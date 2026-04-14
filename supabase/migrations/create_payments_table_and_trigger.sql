-- =========================================================================
-- Tabla: payments
-- Almacena todos los pagos de estudiantes
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('seguro', 'inscripcion', 'cuota_mensual')),
  month INTEGER CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('deudor', 'pendiente', 'pagado')),
  due_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  payment_method TEXT DEFAULT 'efectivo' CHECK (payment_method IN ('efectivo', 'transferencia', 'tarjeta_credito', 'tarjeta_debito', 'cheque', 'otro')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON public.payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON public.payments(due_date);
CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON public.payments(paid_at);

-- RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payments_own_read" ON public.payments;
DROP POLICY IF EXISTS "payments_admin_all" ON public.payments;
DROP POLICY IF EXISTS "payments_treasurer_all" ON public.payments;

CREATE POLICY "payments_own_read" ON public.payments
  FOR SELECT
  USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()) OR 
         auth.uid() IN (SELECT id FROM public.users WHERE role IN ('admin', 'treasurer')));

CREATE POLICY "payments_admin_all" ON public.payments
  FOR ALL
  USING (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));

CREATE POLICY "payments_treasurer_all" ON public.payments
  FOR ALL
  USING (auth.uid() IN (SELECT id FROM public.users WHERE role = 'treasurer'));

-- =========================================================================
-- Función: crear_pagos_para_estudiante
-- Genera automáticamente los pagos (seguro, inscripción, 9 cuotas)
-- cuando se inserta un nuevo estudiante
-- =========================================================================
CREATE OR REPLACE FUNCTION public.crear_pagos_para_estudiante()
RETURNS TRIGGER AS $$
DECLARE
  config RECORD;
  current_year INTEGER;
  due_date DATE;
  payment_date DATE;
  month_offset INTEGER;
BEGIN
  -- Obtener la configuración de pagos de la carrera
  SELECT increment_percentage, monthly_quota_amount, insurance_amount, enrollment_amount
  INTO config
  FROM public.payment_configuration
  WHERE program_id = NEW.program_id
  LIMIT 1;

  -- Si no hay configuración, salir sin crear pagos
  IF config IS NULL THEN
    RETURN NEW;
  END IF;

  -- Obtener el año actual (año calendario)
  current_year := EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;

  -- 1) SEGURO (única vez, sin mes específico)
  INSERT INTO public.payments (
    student_id,
    payment_type,
    month,
    year,
    amount,
    status,
    due_date,
    payment_method
  ) VALUES (
    NEW.id,
    'seguro',
    NULL,
    current_year,
    config.insurance_amount,
    'pendiente',
    CURRENT_DATE + INTERVAL '15 days',
    'efectivo'
  )
  ON CONFLICT DO NOTHING;

  -- 2) INSCRIPCIÓN (única vez, sin mes específico)
  INSERT INTO public.payments (
    student_id,
    payment_type,
    month,
    year,
    amount,
    status,
    due_date,
    payment_method
  ) VALUES (
    NEW.id,
    'inscripcion',
    NULL,
    current_year,
    config.enrollment_amount,
    'pendiente',
    CURRENT_DATE + INTERVAL '15 days',
    'efectivo'
  )
  ON CONFLICT DO NOTHING;

  -- 3) CUOTAS MENSUALES (Abril a Diciembre = 9 cuotas)
  -- Abril = 4, Diciembre = 12
  FOR month_offset IN 4..12 LOOP
    -- Fecha de vencimiento: día 30 del mes
    due_date := (current_year || '-' || LPAD(month_offset::TEXT, 2, '0') || '-30')::DATE;
    
    -- Si el mes no tiene 30 días (ej. febrero), ajustar al último día del mes
    IF EXTRACT(DAY FROM due_date) < 30 THEN
      due_date := (due_date - INTERVAL '1 day')::DATE;
    END IF;

    INSERT INTO public.payments (
      student_id,
      payment_type,
      month,
      year,
      amount,
      status,
      due_date,
      payment_method
    ) VALUES (
      NEW.id,
      'cuota_mensual',
      month_offset,
      current_year,
      config.monthly_quota_amount,
      'pendiente',
      due_date,
      'efectivo'
    )
    ON CONFLICT DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger para ejecutar la función al insertar nuevo estudiante
DROP TRIGGER IF EXISTS on_student_created ON public.students;
CREATE TRIGGER on_student_created
  AFTER INSERT ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.crear_pagos_para_estudiante();

-- =========================================================================
-- Nota importante:
-- - Los montos guardados en payments.amount son siempre la CUOTA BASE
-- - El incremento del 15% se calcula DINÁMICAMENTE en el frontend
-- - El incremento se aplica SOLO si: pago_date > due_date AND pago_date > primer_día_hábil_desde_10
-- - Los estudiantes existentes pueden necesitar pagos creados manualmente
--   mediante: SELECT crear_pagos_para_estudiante() para cada student_id
-- =========================================================================
