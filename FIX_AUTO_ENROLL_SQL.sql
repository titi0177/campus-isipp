-- =============================================================================
-- FUNCIÓN REPARADA: auto_enroll_students_by_year
-- Problema: EXCEPTION handler intentaba usar v_student no inicializado
-- Solución: Usar variables auxiliares para guardar valores de cada iteración
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
  v_student RECORD;
  v_student_id UUID;
  v_student_name TEXT;
  v_program_id UUID;
  v_year INTEGER;
  v_subjects_to_enroll UUID[];
  v_count_enrolled INTEGER := 0;
  v_count_inserted INTEGER := 0;
  v_error_msg TEXT := NULL;
BEGIN
  -- Iterar sobre cada estudiante activo que sea de 2° o 3° año
  FOR v_student IN
    SELECT id, first_name, last_name, program_id, year
    FROM public.students
    WHERE status = 'active' AND year IN (2, 3)
    ORDER BY year DESC, last_name, first_name
  LOOP
    BEGIN
      -- Guardar valores para usar en EXCEPTION si es necesario
      v_student_id := v_student.id;
      v_student_name := v_student.first_name || ' ' || v_student.last_name;
      v_program_id := v_student.program_id;
      v_year := v_student.year;
      v_error_msg := NULL;
      v_count_enrolled := 0;
      v_count_inserted := 0;
      v_subjects_to_enroll := NULL;

      -- Determinar qué años de materias debe cursar
      IF v_student.year = 2 THEN
        -- Alumno de 2° debe estar inscripto en todas las de 1°
        SELECT ARRAY_AGG(id)
        INTO v_subjects_to_enroll
        FROM public.subjects
        WHERE program_id = v_student.program_id
          AND year = 1
          AND status = 'active';

      ELSIF v_student.year = 3 THEN
        -- Alumno de 3° debe estar inscripto en todas las de 1° y 2°
        SELECT ARRAY_AGG(id)
        INTO v_subjects_to_enroll
        FROM public.subjects
        WHERE program_id = v_student.program_id
          AND year IN (1, 2)
          AND status = 'active';
      END IF;

      -- Si hay materias a inscribir
      IF v_subjects_to_enroll IS NOT NULL AND ARRAY_LENGTH(v_subjects_to_enroll, 1) > 0 THEN
        -- Contar cuántas ya está inscripto
        SELECT COUNT(*)
        INTO v_count_enrolled
        FROM public.enrollments
        WHERE student_id = v_student.id
          AND subject_id = ANY(v_subjects_to_enroll)
          AND academic_year = v_current_year;

        -- Insertar solo las que NO está inscripto (evitar duplicados)
        INSERT INTO public.enrollments (
          student_id,
          subject_id,
          academic_year,
          status,
          attempt_number
        )
        SELECT
          v_student.id,
          subject_id,
          v_current_year,
          'active',
          1
        FROM (
          SELECT UNNEST(v_subjects_to_enroll) AS subject_id
        ) subj
        WHERE NOT EXISTS (
          SELECT 1
          FROM public.enrollments e
          WHERE e.student_id = v_student.id
            AND e.subject_id = subj.subject_id
            AND e.academic_year = v_current_year
        )
        ON CONFLICT (student_id, subject_id, academic_year, attempt_number) DO NOTHING;

        GET DIAGNOSTICS v_count_inserted = ROW_COUNT;
      END IF;

      -- Retornar resultado de este estudiante
      RETURN QUERY SELECT
        v_student_id,
        v_student_name,
        v_program_id,
        v_year,
        v_count_enrolled + v_count_inserted,
        v_error_msg;

    EXCEPTION WHEN OTHERS THEN
      -- Si hay error en un estudiante, retornar con el error pero continuar
      v_error_msg := SQLERRM;
      RETURN QUERY SELECT
        v_student_id,
        v_student_name,
        v_program_id,
        v_year,
        0,
        v_error_msg;
    END;
  END LOOP;

EXCEPTION WHEN OTHERS THEN
  -- Error global (nunca debería llegar aquí, pero por si acaso)
  RAISE WARNING 'Error global en auto_enroll_students_by_year: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.auto_enroll_students_by_year(INTEGER) TO authenticated, anon;

COMMENT ON FUNCTION public.auto_enroll_students_by_year(INTEGER) 
IS 'Inscribe automáticamente a todos los alumnos de 2° y 3° en materias de años anteriores, sin duplicar. Parámetro opcional: año académico (por defecto: año actual)';
