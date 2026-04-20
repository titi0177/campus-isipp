-- ============================================================================
-- MIGRACIÓN: Sistema de Reinscripción Automática para Recursantes
-- Respeta períodos: Anuales (año siguiente), Cuatrimestrales (mismo cuatrimestre)
-- Fecha: 2025-04-20
-- ============================================================================

-- PASO 1: Crear vista para materias disponibles para reinscripción (recursantes)
CREATE OR REPLACE VIEW public.available_subjects_for_recursive AS
SELECT 
  s.id,
  s.name,
  s.code,
  s.year,
  s.division,
  s.dictation_type,
  s.semester,
  s.professor_id,
  EXTRACT(YEAR FROM NOW())::INTEGER as current_year,
  EXTRACT(MONTH FROM NOW())::INTEGER as current_month,
  CASE 
    -- Para anuales: mostrar SOLO en el año siguiente
    WHEN s.dictation_type = 'anual' THEN 
      CASE WHEN EXTRACT(YEAR FROM NOW())::INTEGER > (
        SELECT EXTRACT(YEAR FROM eg.created_at)::INTEGER
        FROM enrollment_grades eg
        WHERE eg.enrollment_id IN (
          SELECT e.id FROM enrollments e WHERE e.subject_id = s.id
        )
        LIMIT 1
      ) THEN TRUE ELSE FALSE END
    
    -- Para cuatrimestrales: mostrar en el mismo período
    WHEN s.dictation_type = 'cuatrimestral' THEN
      CASE 
        -- Primer cuatrimestre: mes 1-6
        WHEN s.semester = 1 AND EXTRACT(MONTH FROM NOW())::INTEGER <= 6 THEN TRUE
        -- Segundo cuatrimestre: mes 7-12
        WHEN s.semester = 2 AND EXTRACT(MONTH FROM NOW())::INTEGER >= 7 THEN TRUE
        ELSE FALSE
      END
    ELSE TRUE
  END as is_available_for_reinscription
FROM public.subjects s;

-- PASO 2: Crear función para verificar si estudiante puede reinscribirse
CREATE OR REPLACE FUNCTION public.can_reinscribe_subject(
  p_student_id UUID,
  p_subject_id UUID
)
RETURNS TABLE (
  can_reinscribe BOOLEAN,
  reason TEXT
) AS $$
DECLARE
  v_subject_dictation_type TEXT;
  v_subject_semester INTEGER;
  v_failed_year INTEGER;
  v_current_year INTEGER;
  v_current_month INTEGER;
BEGIN
  -- Obtener info del sujeto
  SELECT dictation_type, semester 
  INTO v_subject_dictation_type, v_subject_semester
  FROM public.subjects 
  WHERE id = p_subject_id;

  IF v_subject_dictation_type IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Materia no encontrada'::TEXT;
    RETURN;
  END IF;

  -- Obtener fecha en que desaprobó
  SELECT EXTRACT(YEAR FROM eg.created_at)::INTEGER
  INTO v_failed_year
  FROM enrollment_grades eg
  JOIN enrollments e ON eg.enrollment_id = e.id
  WHERE e.student_id = p_student_id 
    AND e.subject_id = p_subject_id
    AND eg.final_status = 'desaprobado'
  ORDER BY eg.created_at DESC
  LIMIT 1;

  -- Si nunca desaprobó
  IF v_failed_year IS NULL THEN
    RETURN QUERY SELECT FALSE, 'No hay registro de desaprobación'::TEXT;
    RETURN;
  END IF;

  v_current_year := EXTRACT(YEAR FROM NOW())::INTEGER;
  v_current_month := EXTRACT(MONTH FROM NOW())::INTEGER;

  -- Validar según tipo de dictación
  IF v_subject_dictation_type = 'anual' THEN
    -- Para anuales: solo si estamos en año diferente al que desaprobó
    IF v_current_year > v_failed_year THEN
      RETURN QUERY SELECT TRUE, 'Puede reinscribirse (anual - año siguiente)'::TEXT;
    ELSE
      RETURN QUERY SELECT FALSE, 'Anual: solo se puede reinscribir el próximo año'::TEXT;
    END IF;

  ELSIF v_subject_dictation_type = 'cuatrimestral' THEN
    -- Para cuatrimestrales: solo en el cuatrimestre correspondiente
    IF v_subject_semester = 1 AND v_current_month <= 6 THEN
      RETURN QUERY SELECT TRUE, 'Puede reinscribirse (1er cuatrimestre)'::TEXT;
    ELSIF v_subject_semester = 2 AND v_current_month >= 7 THEN
      RETURN QUERY SELECT TRUE, 'Puede reinscribirse (2do cuatrimestre)'::TEXT;
    ELSE
      RETURN QUERY SELECT FALSE, 
        CASE WHEN v_subject_semester = 1 
          THEN '1er cuatrimestre: disponible hasta junio'::TEXT 
          ELSE '2do cuatrimestre: disponible desde julio'::TEXT 
        END;
    END IF;
  ELSE
    RETURN QUERY SELECT TRUE, 'Puede reinscribirse'::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 3: Crear función para crear reinscripción automática del estudiante
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
  v_new_enrollment_id UUID;
  v_existing_enrollment_id UUID;
  v_current_year INTEGER;
  v_subject_year INTEGER;
BEGIN
  -- Verificar si puede reinscribirse
  SELECT can_reinscribe, reason
  INTO v_can_reinscribe, v_reason
  FROM public.can_reinscribe_subject(p_student_id, p_subject_id);

  IF NOT v_can_reinscribe THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, v_reason;
    RETURN;
  END IF;

  -- Verificar si ya está inscripto en el año actual
  v_current_year := EXTRACT(YEAR FROM NOW())::INTEGER;
  
  SELECT id INTO v_existing_enrollment_id
  FROM public.enrollments
  WHERE student_id = p_student_id
    AND subject_id = p_subject_id
    AND academic_year = v_current_year;

  IF v_existing_enrollment_id IS NOT NULL THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Ya estás inscripto en esta materia este año'::TEXT;
    RETURN;
  END IF;

  -- Obtener año de la materia
  SELECT year INTO v_subject_year
  FROM public.subjects
  WHERE id = p_subject_id;

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
  SELECT 
    p_student_id,
    p_subject_id,
    v_current_year,
    'en_curso',
    TRUE,
    COALESCE((
      SELECT MAX(attempt_number) + 1
      FROM enrollments
      WHERE student_id = p_student_id AND subject_id = p_subject_id
    ), 2),
    NOW()
  RETURNING id INTO v_new_enrollment_id;

  RETURN QUERY SELECT TRUE, v_new_enrollment_id, 'Reinscripción exitosa como recursante'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 4: Actualizar RLS para enrollments para permitir estudiantes crear reinscripciones
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "students_can_insert_enrollments" ON public.enrollments;
CREATE POLICY "students_can_insert_enrollments" ON public.enrollments
  FOR INSERT
  WITH CHECK (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
  );

-- PASO 5: Crear índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_enrollment_student_subject_year 
ON public.enrollments(student_id, subject_id, academic_year);

CREATE INDEX IF NOT EXISTS idx_enrollment_grades_student_final_status 
ON public.enrollment_grades(enrollment_id, final_status);
