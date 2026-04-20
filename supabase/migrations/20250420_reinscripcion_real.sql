-- ============================================================================
-- MIGRACIÓN FINAL: Reinscripción de Recursantes (NOMBRES CORRECTOS)
-- Tablas reales: enrollment_grades, enrollments, subjects, students
-- ============================================================================

-- PASO 0: Limpiar si existen
DROP FUNCTION IF EXISTS public.student_reinscribe_as_recursive(UUID, UUID) CASCADE;

-- PASO 1: FUNCIÓN PRINCIPAL - Reinscribir como recursante
CREATE OR REPLACE FUNCTION public.student_reinscribe_as_recursive(
  p_student_id UUID,
  p_subject_id UUID
)
RETURNS jsonb AS $$
DECLARE
  dict_type TEXT;
  sem INT;
  year_fail INT;
  year_now INT;
  month_now INT;
  enroll_exists UUID;
  new_enrollment_id UUID;
  can_enroll BOOLEAN := FALSE;
  error_msg TEXT := '';
  part_status TEXT;
BEGIN
  -- Obtener dictation_type y semester de subjects
  SELECT s.dictation_type, COALESCE(s.semester, 1)
  INTO dict_type, sem
  FROM public.subjects s
  WHERE s.id = p_subject_id;

  IF dict_type IS NULL THEN
    RETURN jsonb_build_object('success', FALSE, 'message', 'Materia no existe');
  END IF;

  -- Obtener año que desaprobó (más reciente)
  SELECT EXTRACT(YEAR FROM eg.created_at)::INT, eg.partial_status
  INTO year_fail, part_status
  FROM public.enrollment_grades eg
  INNER JOIN public.enrollments e ON eg.enrollment_id = e.id
  WHERE e.student_id = p_student_id
    AND e.subject_id = p_subject_id
    AND eg.final_status = 'desaprobado'
  ORDER BY eg.created_at DESC
  LIMIT 1;

  IF year_fail IS NULL THEN
    RETURN jsonb_build_object('success', FALSE, 'message', 'No hay desaprobación registrada');
  END IF;

  year_now := EXTRACT(YEAR FROM NOW())::INT;
  month_now := EXTRACT(MONTH FROM NOW())::INT;

  -- Validar según dictation_type
  IF dict_type = 'anual' THEN
    IF year_now > year_fail THEN
      can_enroll := TRUE;
    ELSE
      error_msg := 'Anual: solo próximo año';
    END IF;
  ELSIF dict_type = 'cuatrimestral' THEN
    IF sem = 1 AND month_now <= 6 THEN
      can_enroll := TRUE;
    ELSIF sem = 2 AND month_now >= 7 THEN
      can_enroll := TRUE;
    ELSIF sem = 1 THEN
      error_msg := '1er cuatrimestre: enero a junio';
    ELSE
      error_msg := '2do cuatrimestre: julio a diciembre';
    END IF;
  ELSE
    can_enroll := TRUE;
  END IF;

  IF NOT can_enroll THEN
    RETURN jsonb_build_object('success', FALSE, 'message', error_msg);
  END IF;

  -- Verificar si ya está inscripto este año
  SELECT e.id INTO enroll_exists
  FROM public.enrollments e
  WHERE e.student_id = p_student_id
    AND e.subject_id = p_subject_id
    AND e.academic_year = year_now;

  IF enroll_exists IS NOT NULL THEN
    RETURN jsonb_build_object('success', FALSE, 'message', 'Ya inscripto este año');
  END IF;

  -- Crear nueva inscripción como recursante
  INSERT INTO public.enrollments (
    student_id,
    subject_id,
    academic_year,
    status,
    is_recursive,
    attempt_number,
    created_at
  )
  VALUES (
    p_student_id,
    p_subject_id,
    year_now,
    'en_curso',
    TRUE,
    2,
    NOW()
  )
  RETURNING id INTO new_enrollment_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'message', 'Reinscripción exitosa',
    'enrollment_id', new_enrollment_id::TEXT
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', FALSE,
    'message', 'Error: ' || SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 2: Crear índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_enrollment_grades_final_status 
ON public.enrollment_grades(final_status);

CREATE INDEX IF NOT EXISTS idx_enrollment_student_subject_year 
ON public.enrollments(student_id, subject_id, academic_year);

-- PASO 3: LISTO
-- Para probar: SELECT public.student_reinscribe_as_recursive('student-uuid', 'subject-uuid');
-- Debería retornar: {"success":true,"message":"Reinscripción exitosa","enrollment_id":"..."}
