-- Tabla para configurar cuántas notas se usan por materia (1-6)
CREATE TABLE IF NOT EXISTS public.grade_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  num_grades INTEGER NOT NULL DEFAULT 3 CHECK (num_grades BETWEEN 1 AND 6),
  allows_promotion BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  UNIQUE(subject_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_grade_settings_subject_id ON public.grade_settings(subject_id);

-- RLS
ALTER TABLE public.grade_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "grade_settings_read_all" ON public.grade_settings;
DROP POLICY IF EXISTS "grade_settings_admin_write" ON public.grade_settings;

CREATE POLICY "grade_settings_read_all" ON public.grade_settings
  FOR SELECT
  USING (true);

CREATE POLICY "grade_settings_admin_write" ON public.grade_settings
  FOR ALL
  USING (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));

-- Tabla para notas parciales y finales (reemplaza la estructura anterior)
CREATE TABLE IF NOT EXISTS public.enrollment_grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  -- Notas parciales (1-6)
  grade_1 NUMERIC(3,1),
  grade_2 NUMERIC(3,1),
  grade_3 NUMERIC(3,1),
  grade_4 NUMERIC(3,1),
  grade_5 NUMERIC(3,1),
  grade_6 NUMERIC(3,1),
  -- Promedios y estados
  partial_grade NUMERIC(3,1),
  final_grade NUMERIC(3,1),
  partial_status TEXT CHECK (partial_status IN ('en_curso', 'regular', 'promocionado', 'desaprobado')),
  final_status TEXT CHECK (final_status IN ('aprobado', 'promocionado', 'desaprobado')),
  -- Intentos
  attempt INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  UNIQUE(enrollment_id, attempt)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_enrollment_grades_enrollment_id ON public.enrollment_grades(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_grades_partial_status ON public.enrollment_grades(partial_status);
CREATE INDEX IF NOT EXISTS idx_enrollment_grades_final_status ON public.enrollment_grades(final_status);

-- RLS
ALTER TABLE public.enrollment_grades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "enrollment_grades_student_read" ON public.enrollment_grades;
DROP POLICY IF EXISTS "enrollment_grades_professor_manage" ON public.enrollment_grades;
DROP POLICY IF EXISTS "enrollment_grades_admin_all" ON public.enrollment_grades;

CREATE POLICY "enrollment_grades_student_read" ON public.enrollment_grades
  FOR SELECT
  USING (
    enrollment_id IN (
      SELECT id FROM public.enrollments 
      WHERE student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
    )
    OR auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
  );

CREATE POLICY "enrollment_grades_professor_manage" ON public.enrollment_grades
  FOR ALL
  USING (
    enrollment_id IN (
      SELECT e.id FROM public.enrollments e
      JOIN public.subjects s ON e.subject_id = s.id
      JOIN public.schedules sch ON s.id = sch.subject_id
      WHERE sch.professor_id IN (SELECT id FROM public.professors WHERE user_id = auth.uid())
    )
    OR auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
  );

CREATE POLICY "enrollment_grades_admin_all" ON public.enrollment_grades
  FOR ALL
  USING (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));
