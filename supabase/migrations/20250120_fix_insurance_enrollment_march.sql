-- Migración: Fijar Seguro e Inscripción con vencimiento en marzo
-- Seguro y Inscripción vencen el 1 de marzo (inicio de ciclo académico)
-- Las cuotas mensuales siguen siendo de abril a diciembre con vencimiento el 10

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

  -- 1) SEGURO - Vencimiento: 1 de marzo (inicio de clases)
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
    3,
    current_year,
    config.insurance_amount,
    'pendiente',
    (current_year || '-03-01')::DATE,
    'efectivo'
  )
  ON CONFLICT DO NOTHING;

  -- 2) INSCRIPCIÓN - Vencimiento: 1 de marzo (inicio de clases)
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
    3,
    current_year,
    config.enrollment_amount,
    'pendiente',
    (current_year || '-03-01')::DATE,
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

-- Actualizar pagos existentes: Seguro e Inscripción a marzo 1
UPDATE public.payments
SET 
  due_date = (EXTRACT(YEAR FROM due_date)::TEXT || '-03-01')::DATE,
  month = 3
WHERE payment_type IN ('seguro', 'inscripcion');

-- Documentación
COMMENT ON TABLE public.payments IS 'Tabla de pagos de estudiantes. Seguro e inscripción vencen el 1 de marzo (inicio de clases). Cuotas mensuales vencen el 10 de abril a diciembre.';
