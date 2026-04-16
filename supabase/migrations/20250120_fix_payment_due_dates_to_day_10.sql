-- Migración: Corregir fechas de vencimiento de cuotas al 10 del mes
-- Antes: Vencimiento al día 30 de cada mes
-- Ahora: Vencimiento al día 10 de cada mes

-- 1. Actualizar la función de creación de pagos
CREATE OR REPLACE FUNCTION public.crear_pagos_para_estudiante()
RETURNS TRIGGER AS $$
DECLARE
  config RECORD;
  current_year INTEGER;
  due_date DATE;
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
  -- VENCIMIENTO: DÍA 10 DE CADA MES
  FOR month_offset IN 4..12 LOOP
    -- Fecha de vencimiento: día 10 del mes
    due_date := (current_year || '-' || LPAD(month_offset::TEXT, 2, '0') || '-10')::DATE;

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

-- 2. Actualizar pagos existentes: cambiar vencimiento de cuotas mensuales al 10
UPDATE public.payments
SET due_date = (
  EXTRACT(YEAR FROM due_date)::TEXT || '-' || 
  LPAD(EXTRACT(MONTH FROM due_date)::TEXT, 2, '0') || 
  '-10'
)::DATE
WHERE payment_type = 'cuota_mensual'
  AND EXTRACT(DAY FROM due_date) != 10;

-- 3. Documentación
COMMENT ON TABLE public.payments IS 'Tabla de pagos de estudiantes. Las cuotas mensuales vencen el 10 del mes. El incremento por demora se aplica si se paga después del primer día hábil a partir del 10.';
COMMENT ON COLUMN public.payments.due_date IS 'Fecha de vencimiento. Para cuotas mensuales: siempre el 10 del mes. Incremento por demora si se paga después del primer día hábil desde el 10.';

-- 4. Información importante
-- - Cuota base: Se cobra entre 1-10 del mes (sin incremento)
-- - Pago tardío: Se aplica incremento si se paga después del primer día hábil a partir del 10
-- - Cálculo: Si el 10 es sábado, el primer día hábil es lunes. El incremento se cobra a partir del día siguiente.
-- - La función calculatePaymentWithSurcharge en paymentUtils.ts maneja automáticamente este cálculo
