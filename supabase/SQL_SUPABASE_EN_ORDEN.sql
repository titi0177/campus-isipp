-- =============================================================================
-- ISIPP — Script SQL ordenado para Supabase (SQL Editor)
-- =============================================================================
-- Orden lógico:
--   1) Extensión UUID
--   2) Tablas (dependencias: users → programs/professors → subjects → students → …)
--   3) Columnas opcionales extra (cupos / mesas abiertas)
--   4) Funciones helper is_admin() y my_student_id() — ANTES de las políticas
--   5) RLS + políticas (DROP + CREATE idempotente)
--   6) Trigger handle_new_user (Auth → public.users)
--   7) Datos de ejemplo (sin duplicar carreras por nombre)
--
-- Si YA tenés tablas: las CREATE usan IF NOT EXISTS y no las borra.
-- Las políticas se recrean (DROP + CREATE) para evitar errores al re-ejecutar.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Extensión
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 2) Tablas (mismo orden que las FK)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'student', 'professor', 'treasurer')),
  full_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  duration_years INTEGER NOT NULL DEFAULT 3,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.professors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  department TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  program_id UUID REFERENCES public.programs(id) ON DELETE SET NULL,
  year INTEGER NOT NULL DEFAULT 1,
  professor_id UUID REFERENCES public.professors(id) ON DELETE SET NULL,
  credits INTEGER NOT NULL DEFAULT 4,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  dni TEXT NOT NULL UNIQUE,
  legajo TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  program_id UUID REFERENCES public.programs(id) ON DELETE SET NULL,
  year INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'graduated', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.subject_correlatives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  requires_subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(subject_id, requires_subject_id)
);

CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  semester INTEGER NOT NULL DEFAULT 1 CHECK (semester IN (1, 2)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, subject_id, year, semester)
);

CREATE TABLE IF NOT EXISTS public.grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE UNIQUE,
  partial_grade NUMERIC(4,2) CHECK (partial_grade BETWEEN 1 AND 10),
  final_exam_grade NUMERIC(4,2) CHECK (final_exam_grade BETWEEN 1 AND 10),
  final_grade NUMERIC(4,2) CHECK (final_grade BETWEEN 1 AND 10),
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('promoted', 'regular', 'in_progress', 'free', 'failed', 'passed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE UNIQUE,
  percentage NUMERIC(5,2) NOT NULL CHECK (percentage BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Mesas: columna de fecha = exam_date (alineado con Supabase / PostgREST)
CREATE TABLE IF NOT EXISTS public.final_exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  exam_date DATE NOT NULL,
  professor_id UUID REFERENCES public.professors(id) ON DELETE SET NULL,
  location TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Inscripciones a mesa (nombre que usa el frontend)
CREATE TABLE IF NOT EXISTS public.exam_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  final_exam_id UUID NOT NULL REFERENCES public.final_exams(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, final_exam_id)
);

CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  type TEXT NOT NULL DEFAULT 'event' CHECK (type IN ('exam', 'deadline', 'event')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 3) Ajustes si venías de un esquema viejo (ej. exam_date / otra tabla)
--     Descomentá solo lo que necesites.
-- -----------------------------------------------------------------------------

-- Si tu tabla antigua tenía la columna `date` en vez de `exam_date`:
-- ALTER TABLE public.final_exams RENAME COLUMN date TO exam_date;

-- Si existía tabla final_exam_registrations y querés migrar a exam_enrollments:
-- INSERT INTO public.exam_enrollments (student_id, final_exam_id, created_at)
-- SELECT student_id, final_exam_id, COALESCE(created_at, NOW())
-- FROM public.final_exam_registrations
-- ON CONFLICT DO NOTHING;
-- DROP TABLE IF EXISTS public.final_exam_registrations;

-- Opcional: cupos y flag de apertura (el frontend ya contempla max_students si existe)
ALTER TABLE public.final_exams
  ADD COLUMN IF NOT EXISTS max_students INTEGER CHECK (max_students IS NULL OR max_students > 0);
ALTER TABLE public.final_exams
  ADD COLUMN IF NOT EXISTS is_open BOOLEAN NOT NULL DEFAULT true;

-- -----------------------------------------------------------------------------
-- 4) Funciones usadas por RLS (obligatorio antes de crear políticas)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.my_student_id()
RETURNS UUID AS $$
  SELECT id FROM public.students WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- -----------------------------------------------------------------------------
-- 5) RLS: activar y recrear políticas (idempotente)
-- -----------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.final_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subject_correlatives ENABLE ROW LEVEL SECURITY;

-- users
DROP POLICY IF EXISTS "users_self_read" ON public.users;
DROP POLICY IF EXISTS "users_self_update" ON public.users;
DROP POLICY IF EXISTS "users_admin_insert" ON public.users;
DROP POLICY IF EXISTS "users_admin_delete" ON public.users;
CREATE POLICY "users_self_read" ON public.users FOR SELECT USING (id = auth.uid() OR public.is_admin());
CREATE POLICY "users_self_update" ON public.users FOR UPDATE USING (id = auth.uid() OR public.is_admin());
CREATE POLICY "users_admin_insert" ON public.users FOR INSERT WITH CHECK (public.is_admin() OR id = auth.uid());
CREATE POLICY "users_admin_delete" ON public.users FOR DELETE USING (public.is_admin());

-- students
DROP POLICY IF EXISTS "students_own_read" ON public.students;
DROP POLICY IF EXISTS "students_admin_all" ON public.students;
CREATE POLICY "students_own_read" ON public.students FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "students_admin_all" ON public.students FOR ALL USING (public.is_admin());

-- programs, professors, subjects, announcements, calendar, final_exams, correlatives
DROP POLICY IF EXISTS "programs_read_all" ON public.programs;
DROP POLICY IF EXISTS "programs_admin_write" ON public.programs;
CREATE POLICY "programs_read_all" ON public.programs FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "programs_admin_write" ON public.programs FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "professors_read_all" ON public.professors;
DROP POLICY IF EXISTS "professors_admin_write" ON public.professors;
CREATE POLICY "professors_read_all" ON public.professors FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "professors_admin_write" ON public.professors FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "subjects_read_all" ON public.subjects;
DROP POLICY IF EXISTS "subjects_admin_write" ON public.subjects;
CREATE POLICY "subjects_read_all" ON public.subjects FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "subjects_admin_write" ON public.subjects FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "announcements_read_all" ON public.announcements;
DROP POLICY IF EXISTS "announcements_admin_write" ON public.announcements;
CREATE POLICY "announcements_read_all" ON public.announcements FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "announcements_admin_write" ON public.announcements FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "calendar_read_all" ON public.calendar_events;
DROP POLICY IF EXISTS "calendar_admin_write" ON public.calendar_events;
CREATE POLICY "calendar_read_all" ON public.calendar_events FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "calendar_admin_write" ON public.calendar_events FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "final_exams_read_all" ON public.final_exams;
DROP POLICY IF EXISTS "final_exams_admin_write" ON public.final_exams;
CREATE POLICY "final_exams_read_all" ON public.final_exams FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "final_exams_admin_write" ON public.final_exams FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "correlatives_read_all" ON public.subject_correlatives;
DROP POLICY IF EXISTS "correlatives_admin_write" ON public.subject_correlatives;
CREATE POLICY "correlatives_read_all" ON public.subject_correlatives FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "correlatives_admin_write" ON public.subject_correlatives FOR ALL USING (public.is_admin());

-- enrollments, grades, attendance
DROP POLICY IF EXISTS "enrollments_own_read" ON public.enrollments;
DROP POLICY IF EXISTS "enrollments_admin_write" ON public.enrollments;
CREATE POLICY "enrollments_own_read" ON public.enrollments FOR SELECT USING (student_id = public.my_student_id() OR public.is_admin());
CREATE POLICY "enrollments_admin_write" ON public.enrollments FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "grades_own_read" ON public.grades;
DROP POLICY IF EXISTS "grades_admin_write" ON public.grades;
CREATE POLICY "grades_own_read" ON public.grades FOR SELECT
  USING (enrollment_id IN (SELECT id FROM public.enrollments WHERE student_id = public.my_student_id()) OR public.is_admin());
CREATE POLICY "grades_admin_write" ON public.grades FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "attendance_own_read" ON public.attendance;
DROP POLICY IF EXISTS "attendance_admin_write" ON public.attendance;
CREATE POLICY "attendance_own_read" ON public.attendance FOR SELECT
  USING (enrollment_id IN (SELECT id FROM public.enrollments WHERE student_id = public.my_student_id()) OR public.is_admin());
CREATE POLICY "attendance_admin_write" ON public.attendance FOR ALL USING (public.is_admin());

-- exam_enrollments
DROP POLICY IF EXISTS "exam_enrollments_own" ON public.exam_enrollments;
DROP POLICY IF EXISTS "exam_enrollments_insert" ON public.exam_enrollments;
DROP POLICY IF EXISTS "exam_enrollments_delete" ON public.exam_enrollments;
DROP POLICY IF EXISTS "exam_enrollments_admin_all" ON public.exam_enrollments;
CREATE POLICY "exam_enrollments_own" ON public.exam_enrollments FOR SELECT USING (student_id = public.my_student_id() OR public.is_admin());
CREATE POLICY "exam_enrollments_insert" ON public.exam_enrollments FOR INSERT WITH CHECK (student_id = public.my_student_id() OR public.is_admin());
CREATE POLICY "exam_enrollments_delete" ON public.exam_enrollments FOR DELETE USING (student_id = public.my_student_id() OR public.is_admin());
CREATE POLICY "exam_enrollments_admin_all" ON public.exam_enrollments FOR ALL USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- 6) Trigger: fila en public.users al registrarse en Auth
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role, full_name)
  VALUES (NEW.id, NEW.email, 'student', COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 7) Datos de ejemplo (idempotente por nombre de carrera)
-- -----------------------------------------------------------------------------
INSERT INTO public.programs (name, duration_years, description)
SELECT v.name, v.duration_years, v.description
FROM (
  VALUES
    ('Tecnicatura en Programación'::text, 3, 'Tecnicatura Superior en Programación Informática'::text),
    ('Tecnicatura en Administración'::text, 3, 'Tecnicatura Superior en Administración de Empresas'::text),
    ('Licenciatura en Sistemas'::text, 5, 'Licenciatura en Sistemas de Información'::text)
) AS v(name, duration_years, description)
WHERE NOT EXISTS (SELECT 1 FROM public.programs p WHERE p.name = v.name);

INSERT INTO public.announcements (title, description, date)
SELECT 'Inicio del Ciclo Lectivo', 'Aviso institucional de ejemplo.', CURRENT_DATE
WHERE NOT EXISTS (SELECT 1 FROM public.announcements a WHERE a.title = 'Inicio del Ciclo Lectivo');

INSERT INTO public.announcements (title, description, date)
SELECT 'Inscripción a Exámenes Finales', 'Período de inscripción a mesas — consultar fechas en secretaría.', CURRENT_DATE
WHERE NOT EXISTS (SELECT 1 FROM public.announcements a WHERE a.title = 'Inscripción a Exámenes Finales');
