-- Eliminar tabla grade_settings innecesaria (leeremos de subjects)
DROP TABLE IF EXISTS public.grade_settings CASCADE;

-- Asegurarse que subjects tenga las columnas necesarias
ALTER TABLE public.subjects
ADD COLUMN IF NOT EXISTS allows_promotion BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS num_grades INTEGER DEFAULT 3 CHECK (num_grades BETWEEN 1 AND 6);

-- Tabla enrollment_grades (corregida)
DROP TABLE IF EXISTS public.enrollment_grades CASCADE;

CREATE TABLE IF NOT EXISTS public.enrollment_grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id UUID NOT NULL UNIQUE REFERENCES public.enrollments(id) ON DELETE CASCADE,
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
  attempt_number INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  UNIQUE(enrollment_id, attempt_number)
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
      WHERE s.professor_id IN (SELECT id FROM public.professors WHERE user_id = auth.uid())
    )
    OR auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
  );

CREATE POLICY "enrollment_grades_admin_all" ON public.enrollment_grades
  FOR ALL
  USING (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));

-- Función para actualizar estado (corregida sin reintento automático)
CREATE OR REPLACE FUNCTION public.calculate_student_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.enrollments
  SET status = (
    CASE
      WHEN NEW.final_status IS NOT NULL THEN
        CASE
          WHEN NEW.final_status = 'promocionado' THEN 'promocionado'
          WHEN NEW.final_status = 'aprobado' THEN 'aprobado'
          ELSE 'desaprobado'
        END
      WHEN NEW.partial_status IS NOT NULL THEN
        CASE
          WHEN NEW.partial_status = 'promocionado' THEN 'promocionado'
          WHEN NEW.partial_status = 'regular' THEN 'regular'
          WHEN NEW.partial_status = 'desaprobado' THEN 'desaprobado'
          ELSE 'en_curso'
        END
      ELSE 'en_curso'
    END
  )
  WHERE id = NEW.enrollment_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_enrollment_status ON public.enrollment_grades;
CREATE TRIGGER update_enrollment_status
  AFTER INSERT OR UPDATE ON public.enrollment_grades
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_student_status();
