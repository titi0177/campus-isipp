-- =============================================================================
-- FIX: Mejorar RPC student_reinscribe_as_recursive
-- Validar períodos cuatrimestrales y año siguiente
-- =============================================================================

CREATE OR REPLACE FUNCTION public.student_reinscribe_as_recursive(
  p_student_id UUID,
  p_subject_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_current_year INTEGER;
  v_current_month INTEGER;
  v_subject RECORD;
  v_failed_year INTEGER;
  v_existing_enrollment UUID;
  v_new_enrollment_id UUID;
  v_last_failure_date TIMESTAMP;
BEGIN
  v_current_year := EXTRACT(YEAR FROM NOW())::INTEGER;
  v_current_month := EXTRACT(MONTH FROM NOW())::INTEGER;
  
  -- Obtener info de la materia
  SELECT id, dictation_type, semester INTO v_subject
  FROM public.subjects
  WHERE id = p_subject_id;
  
  IF v_subject IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Materia no encontrada');
  END IF;
  
  -- Obtener año en que desaprobó
  SELECT EXTRACT(YEAR FROM MAX(eg.created_at))::INTEGER INTO v_failed_year
  FROM public.enrollment_grades eg
  JOIN public.enrollments e ON e.id = eg.enrollment_id
  WHERE e.student_id = p_student_id
    AND e.subject_id = p_subject_id
    AND eg.final_status = 'desaprobado';
  
  IF v_failed_year IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'No se encontró desaprobación de esta materia');
  END IF;
  
  -- VALIDACIÓN 1: Verificar si ya está reinscripto este año como recursante
  SELECT id INTO v_existing_enrollment
  FROM public.enrollments
  WHERE student_id = p_student_id
    AND subject_id = p_subject_id
    AND academic_year = v_current_year
    AND is_recursive = true;
  
  IF v_existing_enrollment IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Ya está reinscripto como recursante en esta materia este año');
  END IF;
  
  -- VALIDACIÓN 2: Verificar período según tipo de dictación
  IF v_subject.dictation_type = 'anual' THEN
    -- Anual: solo año siguiente (v_failed_year + 1)
    IF v_current_year <> v_failed_year + 1 THEN
      RETURN jsonb_build_object(
        'success', false, 
        'message', 'Materia anual: solo disponible en ' || (v_failed_year + 1)::TEXT
      );
    END IF;
  ELSIF v_subject.dictation_type = 'cuatrimestral' THEN
    -- Cuatrimestral: año siguiente + período específico
    IF v_current_year <> v_failed_year + 1 THEN
      RETURN jsonb_build_object(
        'success', false, 
        'message', 'Materia cuatrimestral: disponible a partir de ' || (v_failed_year + 1)::TEXT
      );
    END IF;
    
    -- Validar mes según cuatrimestre
    IF v_subject.semester = 1 THEN
      -- 1er cuatrimestre: marzo (3) a junio (6)
      IF v_current_month < 3 OR v_current_month > 6 THEN
        RETURN jsonb_build_object(
          'success', false, 
          'message', '1er cuatrimestre: solo disponible de marzo a junio'
        );
      END IF;
    ELSIF v_subject.semester = 2 THEN
      -- 2do cuatrimestre: julio (7) a diciembre (12)
      IF v_current_month < 7 THEN
        RETURN jsonb_build_object(
          'success', false, 
          'message', '2do cuatrimestre: solo disponible de julio a diciembre'
        );
      END IF;
    END IF;
  END IF;
  
  -- Crear nueva inscripción como recursante
  INSERT INTO public.enrollments (
    student_id,
    subject_id,
    academic_year,
    is_recursive,
    status,
    division,
    attempt_number
  )
  VALUES (
    p_student_id,
    p_subject_id,
    v_current_year,
    true,
    'active',
    NULL,
    2
  )
  RETURNING id INTO v_new_enrollment_id;
  
  -- Crear registro inicial en enrollment_grades
  INSERT INTO public.enrollment_grades (
    enrollment_id,
    attempt_number
  )
  VALUES (
    v_new_enrollment_id,
    2
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Reinscripción completada',
    'enrollment_id', v_new_enrollment_id
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- GRANT execution permissions
-- =============================================================================
GRANT EXECUTE ON FUNCTION public.student_reinscribe_as_recursive(UUID, UUID) TO authenticated, anon;
