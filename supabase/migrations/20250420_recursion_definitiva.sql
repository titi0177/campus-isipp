-- ============================================================================
-- MIGRACIÓN DEFINITIVA: Reinscripción de Recursantes
-- Elimina todo y recrea desde cero
-- ============================================================================

-- PASO 0: BORRAR TODO (si existe)
DROP FUNCTION IF EXISTS public.student_reinscribe_as_recursive CASCADE;
DROP FUNCTION IF EXISTS public.can_reinscribe_subject CASCADE;
DROP VIEW IF EXISTS public.available_subjects_for_recursive CASCADE;

-- PASO 1: Crear tabla de auditoría para recursiones (si no existe)
CREATE TABLE IF NOT EXISTS public.enrollment_recursions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_enrollment_id UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  new_enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE SET NULL,
  attempt_number INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PASO 2: FUNCIÓN PRINCIPAL - Reinscribir como recursante
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
BEGIN
  -- Obtener dictación type de la materia
  SELECT s.dictation_type, COALESCE(s.semester, 1)
  INTO dict_type, sem
  FROM public.subjects s
  WHERE s.id = p_subject_id;

  IF dict_type IS NULL THEN
    RETURN jsonb_build_object('success', FALSE, 'message', 'Materia no existe');
  END IF;

  -- Obtener año que desaprobó
  SELECT EXTRACT(YEAR FROM eg.created_at)::INT
  INTO year_fail
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

  -- Validar según tipo de materia
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

  -- Crear nueva inscripción
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
    'en_curso'::TEXT,
    TRUE,
    2,
    NOW()
  )
  RETURNING id INTO new_enrollment_id;

  -- Registrar en tabla de recursiones
  INSERT INTO public.enrollment_recursions (
    original_enrollment_id,
    new_enrollment_id,
    attempt_number,
    reason
  )
  SELECT e.id, new_enrollment_id, 2, 'desaprobado'
  FROM public.enrollments e
  WHERE e.student_id = p_student_id
    AND e.subject_id = p_subject_id
    AND e.id != new_enrollment_id
  LIMIT 1;

  RETURN jsonb_build_object(
    'success', TRUE,
    'message', 'Reinscripción exitosa',
    'enrollment_id', new_enrollment_id
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', FALSE,
    'message', 'Error: ' || SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 3: Crear índices
CREATE INDEX IF NOT EXISTS idx_enrollment_student_subject_year 
ON public.enrollments(student_id, subject_id, academic_year);

CREATE INDEX IF NOT EXISTS idx_enrollment_grades_final_status 
ON public.enrollment_grades(final_status);

CREATE INDEX IF NOT EXISTS idx_enrollment_recursions_original 
ON public.enrollment_recursions(original_enrollment_id);

-- PASO 4: LISTO
-- Para probar: SELECT public.student_reinscribe_as_recursive('student-uuid', 'subject-uuid');
-- Debería retornar: {"success":true,"message":"Reinscripción exitosa","enrollment_id":"..."}
