-- =============================================================================
-- Migración: Agregar columnas faltantes a enrollments
-- =============================================================================

-- Agregar columnas si no existen
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS academic_year INTEGER;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS is_recursive BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed', 'dropped'));
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS attempt_number INTEGER NOT NULL DEFAULT 1;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS division TEXT;

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_enrollments_academic_year ON public.enrollments(academic_year);
CREATE INDEX IF NOT EXISTS idx_enrollments_is_recursive ON public.enrollments(is_recursive);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_year ON public.enrollments(student_id, academic_year);
CREATE INDEX IF NOT EXISTS idx_enrollments_subject_year ON public.enrollments(subject_id, academic_year);
