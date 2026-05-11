-- =============================================================================
-- FUNCIÓN COMPLETAMENTE REESCRITA: Versión simple y directa
-- =============================================================================

DROP FUNCTION IF EXISTS public.auto_enroll_students_by_year(INTEGER);

CREATE FUNCTION public.auto_enroll_students_by_year(
  p_academic_year INTEGER DEFAULT NULL
)
RETURNS TABLE(
  student_id UUID,
  student_name TEXT,
  program_id UUID,
  year INTEGER,
  subjects_enrolled INTEGER,
  error_message TEXT
) AS $$
DECLARE
  v_current_year INTEGER := COALESCE(p_academic_year, EXTRACT(YEAR FROM NOW())::INTEGER);
  v_student_id UUID;
  v_student_name TEXT;
  v_program_id UUID;
  v_year INTEGER;
  v_count INTEGER;
BEGIN
  
  -- Procesar cada estudiante de 2° y 3° año
  FOR v_student_id, v_student_name, v_program_id, v_year IN
    SELECT s.id, (s.first_name || ' ' || s.last_name), s.program_id, s.year
    FROM public.students s
    WHERE s.status = 'active' AND s.year IN (2, 3)
    ORDER BY s.year DESC, s.last_name, s.first_name
  LOOP
    
    -- Determinar qué materias inscribir según el año
    IF v_year = 2 THEN
      -- Inscribir en materias de 1°
      INSERT INTO public.enrollments (student_id, subject_id, academic_year, status, attempt_number)
      SELECT v_student_id, sb.id, v_current_year, 'active', 1
      FROM public.subjects sb
      WHERE sb.program_id = v_program_id
        AND sb.year = 1
        AND NOT EXISTS (
          SELECT 1 FROM public.enrollments e
          WHERE e.student_id = v_student_id
            AND e.subject_id = sb.id
            AND e.academic_year = v_current_year
        )
      ON CONFLICT (student_id, subject_id, academic_year, attempt_number) DO NOTHING;

    ELSIF v_year = 3 THEN
      -- Inscribir en materias de 1° y 2°
      INSERT INTO public.enrollments (student_id, subject_id, academic_year, status, attempt_number)
      SELECT v_student_id, sb.id, v_current_year, 'active', 1
      FROM public.subjects sb
      WHERE sb.program_id = v_program_id
        AND sb.year IN (1, 2)
        AND NOT EXISTS (
          SELECT 1 FROM public.enrollments e
          WHERE e.student_id = v_student_id
            AND e.subject_id = sb.id
            AND e.academic_year = v_current_year
        )
      ON CONFLICT (student_id, subject_id, academic_year, attempt_number) DO NOTHING;
    END IF;

    -- Contar cuántas inscripciones tiene ahora
    SELECT COUNT(*) INTO v_count
    FROM public.enrollments
    WHERE student_id = v_student_id AND academic_year = v_current_year;

    -- Retornar resultado
    RETURN QUERY SELECT
      v_student_id,
      v_student_name,
      v_program_id,
      v_year,
      v_count,
      NULL::TEXT;

  END LOOP;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.auto_enroll_students_by_year(INTEGER) TO authenticated, anon;

COMMENT ON FUNCTION public.auto_enroll_students_by_year(INTEGER) 
IS 'Inscribe automáticamente a todos los alumnos de 2° y 3° en materias de años anteriores, sin duplicar';
