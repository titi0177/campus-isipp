-- ============================================================================
-- LIMPIEZA Y REINICIO: Sistema de Reinscripción (NUEVO INTENTO)
-- ============================================================================

-- PASO 1: LIMPIAR TODO LO ANTERIOR
DROP FUNCTION IF EXISTS public.student_reinscribe_as_recursive(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.can_reinscribe_subject(UUID, UUID) CASCADE;
DROP VIEW IF EXISTS public.available_subjects_for_recursive CASCADE;

-- PASO 2: CREAR FUNCIÓN SIMPLE - Verificar si puede reinscribirse
CREATE OR REPLACE FUNCTION public.can_reinscribe_subject(
  p_student_id UUID,
  p_subject_id UUID
)
RETURNS TABLE (
  can_reinscribe BOOLEAN,
  reason TEXT
) AS $$
DECLARE
  v_dict_type TEXT;
  v_semester INT;
  v_fail_year INT;
  v_curr_year INT;
  v_curr_month INT;
BEGIN
  -- Obtener tipo de dictación
  SELECT s.dictation_type, COALESCE(s.semester, 1)
  INTO v_dict_type, v_semester
  FROM subjects s
  WHERE s.id = p_subject_id;

  IF v_dict_type IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Materia no encontrada'::TEXT;
    RETURN;
  END IF;

  -- Obtener año de desaprobación
  SELECT EXTRACT(YEAR FROM eg.created_at)::INT
  INTO v_fail_year
  FROM enrollment_grades eg
  INNER JOIN enrollments e ON eg.enrollment_id = e.id
  WHERE e.student_id = p_student_id
    AND e.subject_id = p_subject_id
    AND eg.final_status = 'desaprobado'
  ORDER BY eg.created_at DESC
  LIMIT 1;

  IF v_fail_year IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Sin desaprobación registrada'::TEXT;
    RETURN;
  END IF;

  v_curr_year := EXTRACT(YEAR FROM NOW())::INT;
  v_curr_month := EXTRACT(MONTH FROM NOW())::INT;

  -- VALIDAR SEGÚN TIPO
  IF v_dict_type = 'anual' THEN
    IF v_curr_year > v_fail_year THEN
      RETURN QUERY SELECT TRUE, 'OK: anual año siguiente'::TEXT;
    ELSE
      RETURN QUERY SELECT FALSE, 'Anual: solo próximo año'::TEXT;
    END IF;
  END IF;

  IF v_dict_type = 'cuatrimestral' THEN
    IF v_semester = 1 AND v_curr_month <= 6 THEN
      RETURN QUERY SELECT TRUE, 'OK: 1er cuatrimestre'::TEXT;
    ELSIF v_semester = 2 AND v_curr_month >= 7 THEN
      RETURN QUERY SELECT TRUE, 'OK: 2do cuatrimestre'::TEXT;
    ELSIF v_semester = 1 THEN
      RETURN QUERY SELECT FALSE, '1er cuatrimestre: enero-junio'::TEXT;
    ELSE
      RETURN QUERY SELECT FALSE, '2do cuatrimestre: julio-diciembre'::TEXT;
    END IF;
  END IF;

  RETURN QUERY SELECT TRUE, 'OK'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- PASO 3: CREAR FUNCIÓN - Reinscribir estudiante
CREATE OR REPLACE FUNCTION public.student_reinscribe_as_recursive(
  p_student_id UUID,
  p_subject_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  enrollment_id UUID,
  message TEXT
) AS $$
DECLARE
  v_can_reinscribe BOOLEAN;
  v_reason TEXT;
  v_new_id UUID;
  v_exists_id UUID;
  v_curr_year INT;
BEGIN
  -- Verificar si puede
  SELECT t.can_reinscribe, t.reason
  INTO v_can_reinscribe, v_reason
  FROM can_reinscribe_subject(p_student_id, p_subject_id) t;

  IF NOT v_can_reinscribe THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, v_reason;
    RETURN;
  END IF;

  v_curr_year := EXTRACT(YEAR FROM NOW())::INT;

  -- Verificar si ya inscripto este año
  SELECT e.id INTO v_exists_id
  FROM enrollments e
  WHERE e.student_id = p_student_id
    AND e.subject_id = p_subject_id
    AND e.academic_year = v_curr_year;

  IF v_exists_id IS NOT NULL THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Ya inscripto este año'::TEXT;
    RETURN;
  END IF;

  -- Insertar nueva inscripción
  INSERT INTO enrollments (
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
    v_curr_year,
    'en_curso',
    TRUE,
    2,
    NOW()
  )
  RETURNING enrollments.id INTO v_new_id;

  RETURN QUERY SELECT TRUE, v_new_id, 'Reinscripción OK'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- PASO 4: VERIFICAR
-- Ejecuta: SELECT * FROM can_reinscribe_subject('uuid-estudiante', 'uuid-materia');
-- Ejecuta: SELECT * FROM student_reinscribe_as_recursive('uuid-estudiante', 'uuid-materia');
