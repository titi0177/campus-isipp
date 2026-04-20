-- =============================================================================
-- Migración: Crear tabla enrollment_grades unificada y RPCs
-- =============================================================================
-- Esta migración establece la estructura correcta para calificaciones,
-- reemplazando 'grades' con 'enrollment_grades' que es más específica.

-- 1. Crear tabla enrollment_grades si no existe
CREATE TABLE IF NOT EXISTS public.enrollment_grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  
  -- Calificaciones parciales (1-6)
  grade_1 NUMERIC(4,2),
  grade_2 NUMERIC(4,2),
  grade_3 NUMERIC(4,2),
  grade_4 NUMERIC(4,2),
  grade_5 NUMERIC(4,2),
  grade_6 NUMERIC(4,2),
  
  -- Promedio de parciales
  partial_grade NUMERIC(4,2),
  partial_status TEXT CHECK (partial_status IN ('regular', 'promocionado', 'desaprobado')),
  
  -- Nota final (examen)
  final_grade NUMERIC(4,2),
  final_status TEXT CHECK (final_status IN ('regular', 'promocionado', 'desaprobado')),
  
  -- Metadata
  attempt_number INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(enrollment_id)
);

-- Crear índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_enrollment_grades_enrollment ON public.enrollment_grades(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_grades_status ON public.enrollment_grades(partial_status);
CREATE INDEX IF NOT EXISTS idx_enrollment_grades_final_status ON public.enrollment_grades(final_status);

-- 2. Función para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_enrollment_grades_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para updated_at
DROP TRIGGER IF EXISTS trg_enrollment_grades_updated_at ON public.enrollment_grades;
CREATE TRIGGER trg_enrollment_grades_updated_at
  BEFORE UPDATE ON public.enrollment_grades
  FOR EACH ROW
  EXECUTE FUNCTION public.update_enrollment_grades_timestamp();

-- 3. RPC: Reinscribir alumno como recursante
CREATE OR REPLACE FUNCTION public.student_reinscribe_as_recursive(
  p_student_id UUID,
  p_subject_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_current_year INTEGER;
  v_subject RECORD;
  v_existing_enrollment UUID;
  v_new_enrollment_id UUID;
BEGIN
  v_current_year := EXTRACT(YEAR FROM NOW())::INTEGER;
  
  -- Obtener info de la materia
  SELECT id, dictation_type, semester INTO v_subject
  FROM public.subjects
  WHERE id = p_subject_id;
  
  IF v_subject IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Materia no encontrada');
  END IF;
  
  -- Verificar si ya está reinscripto este año como recursante
  SELECT id INTO v_existing_enrollment
  FROM public.enrollments
  WHERE student_id = p_student_id
    AND subject_id = p_subject_id
    AND academic_year = v_current_year
    AND is_recursive = true;
  
  IF v_existing_enrollment IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Ya está reinscripto como recursante en esta materia este año');
  END IF;
  
  -- Crear nueva inscripción como recursante
  INSERT INTO public.enrollments (
    student_id,
    subject_id,
    academic_year,
    is_recursive,
    status,
    division
  )
  VALUES (
    p_student_id,
    p_subject_id,
    v_current_year,
    true,
    'active',
    NULL
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

-- 4. RPC: Obtener alumnos inscritos en materia (sin filtrado incorrecto)
CREATE OR REPLACE FUNCTION public.get_enrolled_students_for_subject(
  p_subject_id UUID,
  p_academic_year INTEGER DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  student_id UUID,
  student_name TEXT,
  subject_id UUID,
  enrollment_id UUID,
  has_grades BOOLEAN,
  final_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id AS id,
    e.student_id,
    CONCAT(s.last_name, ', ', s.first_name) AS student_name,
    e.subject_id,
    e.id AS enrollment_id,
    COALESCE(eg.id IS NOT NULL, false) AS has_grades,
    eg.final_status
  FROM public.enrollments e
  INNER JOIN public.students s ON e.student_id = s.id
  LEFT JOIN public.enrollment_grades eg ON e.id = eg.enrollment_id
  WHERE e.subject_id = p_subject_id
    AND (p_academic_year IS NULL OR e.academic_year = p_academic_year)
  ORDER BY s.last_name, s.first_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Habilitar RLS en enrollment_grades
ALTER TABLE public.enrollment_grades ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DROP POLICY IF EXISTS "enrollment_grades_student_read" ON public.enrollment_grades;
DROP POLICY IF EXISTS "enrollment_grades_professor_read" ON public.enrollment_grades;
DROP POLICY IF EXISTS "enrollment_grades_admin_all" ON public.enrollment_grades;

CREATE POLICY "enrollment_grades_student_read" ON public.enrollment_grades
  FOR SELECT
  USING (
    enrollment_id IN (
      SELECT id FROM public.enrollments 
      WHERE student_id = public.my_student_id()
    )
  );

CREATE POLICY "enrollment_grades_professor_read" ON public.enrollment_grades
  FOR SELECT
  USING (
    enrollment_id IN (
      SELECT e.id FROM public.enrollments e
      INNER JOIN public.subjects sub ON e.subject_id = sub.id
      INNER JOIN public.professors p ON sub.professor_id = p.id
      INNER JOIN public.users u ON p.user_id = u.id
      WHERE u.id = auth.uid()
    )
  );

CREATE POLICY "enrollment_grades_admin_all" ON public.enrollment_grades
  FOR ALL
  USING (public.is_admin());

-- Políticas para INSERT/UPDATE por profesor
CREATE POLICY "enrollment_grades_professor_write" ON public.enrollment_grades
  FOR INSERT
  WITH CHECK (
    enrollment_id IN (
      SELECT e.id FROM public.enrollments e
      INNER JOIN public.subjects sub ON e.subject_id = sub.id
      INNER JOIN public.professors p ON sub.professor_id = p.id
      INNER JOIN public.users u ON p.user_id = u.id
      WHERE u.id = auth.uid()
    )
  );

CREATE POLICY "enrollment_grades_professor_update" ON public.enrollment_grades
  FOR UPDATE
  USING (
    enrollment_id IN (
      SELECT e.id FROM public.enrollments e
      INNER JOIN public.subjects sub ON e.subject_id = sub.id
      INNER JOIN public.professors p ON sub.professor_id = p.id
      INNER JOIN public.users u ON p.user_id = u.id
      WHERE u.id = auth.uid()
    )
  );

-- 6. Comentarios en tabla
COMMENT ON TABLE public.enrollment_grades IS 'Calificaciones por inscripción: parciales (1-6), promedio, estado y nota final';
COMMENT ON COLUMN public.enrollment_grades.grade_1 IS 'Primera nota parcial (0-10)';
COMMENT ON COLUMN public.enrollment_grades.grade_2 IS 'Segunda nota parcial (0-10)';
COMMENT ON COLUMN public.enrollment_grades.grade_3 IS 'Tercera nota parcial (0-10)';
COMMENT ON COLUMN public.enrollment_grades.grade_4 IS 'Cuarta nota parcial (0-10)';
COMMENT ON COLUMN public.enrollment_grades.grade_5 IS 'Quinta nota parcial (0-10)';
COMMENT ON COLUMN public.enrollment_grades.grade_6 IS 'Sexta nota parcial (0-10)';
COMMENT ON COLUMN public.enrollment_grades.partial_grade IS 'Promedio de parciales calculado automáticamente';
COMMENT ON COLUMN public.enrollment_grades.partial_status IS 'Estado parcial: regular (6-7), promocionado (8+), desaprobado (<6)';
COMMENT ON COLUMN public.enrollment_grades.final_grade IS 'Nota final del examen o promocional';
COMMENT ON COLUMN public.enrollment_grades.final_status IS 'Estado final: promocionado, regular, desaprobado';
