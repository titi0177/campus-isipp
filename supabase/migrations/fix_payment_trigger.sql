-- =========================================================================
-- Diagnóstico y corrección del trigger de pagos
-- =========================================================================

-- 1. Verificar que la tabla payment_configuration existe y tiene datos
SELECT COUNT(*) as config_count FROM public.payment_configuration;

-- 2. Ver las configuraciones de pago por programa
SELECT pc.id, pr.name, pc.monthly_quota_amount, pc.insurance_amount, pc.enrollment_amount
FROM public.payment_configuration pc
LEFT JOIN public.programs pr ON pc.program_id = pr.id
ORDER BY pr.name;

-- 3. Ver estudiantes sin pagos (deberían tener pagos si la config existe)
SELECT s.id, s.first_name, s.last_name, s.program_id, s.created_at,
       COUNT(p.id) as payment_count
FROM public.students s
LEFT JOIN public.payments p ON s.id = p.student_id
GROUP BY s.id
HAVING COUNT(p.id) = 0
ORDER BY s.created_at DESC
LIMIT 20;

-- 4. Verificar que el trigger existe y está activo
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public' 
  AND event_object_table = 'students'
  AND trigger_name = 'on_student_created';

-- 5. Recrear/actualizar el trigger con mejor logging
CREATE OR REPLACE FUNCTION public.crear_pagos_para_estudiante()
RETURNS TRIGGER AS $$
DECLARE
  config RECORD;
  current_year INTEGER;
  due_date DATE;
  month_offset INTEGER;
  payment_count INTEGER := 0;
BEGIN
  -- Validar que el estudiante tenga program_id
  IF NEW.program_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Obtener la configuración de pagos de la carrera
  SELECT id, increment_percentage, monthly_quota_amount, insurance_amount, enrollment_amount
  INTO config
  FROM public.payment_configuration
  WHERE program_id = NEW.program_id
  LIMIT 1;

  -- Si no hay configuración, salir (esto se puede loguear en auditoría)
  IF config IS NULL THEN
    RETURN NEW;
  END IF;

  -- Obtener el año actual
  current_year := EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;

  -- 1) SEGURO
  BEGIN
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
      (CURRENT_DATE + INTERVAL '15 days')::DATE,
      'efectivo'
    );
    payment_count := payment_count + 1;
  EXCEPTION WHEN OTHERS THEN
    -- Silenciar errores de duplicados
    NULL;
  END;

  -- 2) INSCRIPCIÓN
  BEGIN
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
      (CURRENT_DATE + INTERVAL '15 days')::DATE,
      'efectivo'
    );
    payment_count := payment_count + 1;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- 3) CUOTAS MENSUALES (Abril a Diciembre = 9 cuotas)
  FOR month_offset IN 4..12 LOOP
    BEGIN
      -- Establecer fecha de vencimiento al día 10 del mes
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
      );
      payment_count := payment_count + 1;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminar y recrear el trigger para asegurar que esté activo
DROP TRIGGER IF EXISTS on_student_created ON public.students;

CREATE TRIGGER on_student_created
  AFTER INSERT ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.crear_pagos_para_estudiante();

-- 6. Crear función para generar pagos retroactivamente para estudiantes sin pagos
CREATE OR REPLACE FUNCTION public.create_missing_payments_for_students(student_id_param UUID DEFAULT NULL)
RETURNS TABLE(student_id UUID, payments_created INTEGER) AS $$
DECLARE
  student_record RECORD;
  config RECORD;
  current_year INTEGER;
  due_date DATE;
  month_offset INTEGER;
  payment_count INTEGER;
BEGIN
  current_year := EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;

  -- Si se pasa un student_id específico, procesar solo ese
  IF student_id_param IS NOT NULL THEN
    SELECT s.id, s.program_id
    INTO student_record
    FROM public.students s
    WHERE s.id = student_id_param;
    
    IF student_record IS NULL THEN
      RETURN;
    END IF;
    
    -- Procesar estudiante
    SELECT id, monthly_quota_amount, insurance_amount, enrollment_amount
    INTO config
    FROM public.payment_configuration
    WHERE program_id = student_record.program_id
    LIMIT 1;
    
    IF config IS NOT NULL THEN
      payment_count := 0;
      
      -- Seguro
      INSERT INTO public.payments (student_id, payment_type, month, year, amount, status, due_date, payment_method)
      VALUES (student_record.id, 'seguro', NULL, current_year, config.insurance_amount, 'pendiente', (CURRENT_DATE + INTERVAL '15 days')::DATE, 'efectivo')
      ON CONFLICT DO NOTHING;
      
      -- Inscripción
      INSERT INTO public.payments (student_id, payment_type, month, year, amount, status, due_date, payment_method)
      VALUES (student_record.id, 'inscripcion', NULL, current_year, config.enrollment_amount, 'pendiente', (CURRENT_DATE + INTERVAL '15 days')::DATE, 'efectivo')
      ON CONFLICT DO NOTHING;
      
      -- Cuotas
      FOR month_offset IN 4..12 LOOP
        due_date := (current_year || '-' || LPAD(month_offset::TEXT, 2, '0') || '-10')::DATE;
        INSERT INTO public.payments (student_id, payment_type, month, year, amount, status, due_date, payment_method)
        VALUES (student_record.id, 'cuota_mensual', month_offset, current_year, config.monthly_quota_amount, 'pendiente', due_date, 'efectivo')
        ON CONFLICT DO NOTHING;
      END LOOP;
      
      SELECT COUNT(*) INTO payment_count FROM public.payments WHERE student_id = student_record.id;
      RETURN QUERY SELECT student_record.id, payment_count;
    END IF;
  ELSE
    -- Procesar todos los estudiantes sin pagos
    FOR student_record IN 
      SELECT s.id, s.program_id
      FROM public.students s
      LEFT JOIN public.payments p ON s.id = p.student_id
      WHERE s.program_id IS NOT NULL
      GROUP BY s.id
      HAVING COUNT(p.id) = 0
    LOOP
      SELECT id, monthly_quota_amount, insurance_amount, enrollment_amount
      INTO config
      FROM public.payment_configuration
      WHERE program_id = student_record.program_id
      LIMIT 1;
      
      IF config IS NOT NULL THEN
        payment_count := 0;
        
        INSERT INTO public.payments (student_id, payment_type, month, year, amount, status, due_date, payment_method)
        VALUES (student_record.id, 'seguro', NULL, current_year, config.insurance_amount, 'pendiente', (CURRENT_DATE + INTERVAL '15 days')::DATE, 'efectivo')
        ON CONFLICT DO NOTHING;
        
        INSERT INTO public.payments (student_id, payment_type, month, year, amount, status, due_date, payment_method)
        VALUES (student_record.id, 'inscripcion', NULL, current_year, config.enrollment_amount, 'pendiente', (CURRENT_DATE + INTERVAL '15 days')::DATE, 'efectivo')
        ON CONFLICT DO NOTHING;
        
        FOR month_offset IN 4..12 LOOP
          due_date := (current_year || '-' || LPAD(month_offset::TEXT, 2, '0') || '-10')::DATE;
          INSERT INTO public.payments (student_id, payment_type, month, year, amount, status, due_date, payment_method)
          VALUES (student_record.id, 'cuota_mensual', month_offset, current_year, config.monthly_quota_amount, 'pendiente', due_date, 'efectivo')
          ON CONFLICT DO NOTHING;
        END LOOP;
        
        SELECT COUNT(*) INTO payment_count FROM public.payments WHERE student_id = student_record.id;
        RETURN QUERY SELECT student_record.id, payment_count;
      END IF;
    END LOOP;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================================
-- INSTRUCCIONES DE USO:
-- =========================================================================

-- 1. Verificar configuración de pagos por programa:
-- SELECT pc.id, pr.name, pc.monthly_quota_amount FROM public.payment_configuration pc
-- LEFT JOIN public.programs pr ON pc.program_id = pr.id;

-- 2. Si no hay configuración, crearla:
-- INSERT INTO public.payment_configuration (program_id, monthly_quota_amount, insurance_amount, enrollment_amount)
-- VALUES ((SELECT id FROM public.programs WHERE name = 'NOMBRE_CARRERA'), 1000, 500, 200);

-- 3. Generar pagos para todos los estudiantes sin pagos:
-- SELECT * FROM create_missing_payments_for_students();

-- 4. Generar pagos para un estudiante específico:
-- SELECT * FROM create_missing_payments_for_students('STUDENT_UUID_AQUI'::UUID);

-- 5. Verificar pagos creados:
-- SELECT s.id, s.first_name, COUNT(p.id) as total_payments
-- FROM public.students s
-- LEFT JOIN public.payments p ON s.id = p.student_id
-- GROUP BY s.id
-- ORDER BY s.created_at DESC LIMIT 20;
