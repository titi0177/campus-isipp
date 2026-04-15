-- ============================================================================
-- DIVISIONES A Y B - SCRIPT SIMPLIFICADO
-- ============================================================================
-- Copia y pega TODO este contenido en Supabase SQL Editor
-- Luego haz clic en [Run] o presiona Ctrl+Enter
-- ============================================================================

ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS division TEXT CHECK (division IN ('A', 'B', NULL));

CREATE INDEX IF NOT EXISTS idx_subjects_division_year ON public.subjects(year, division) WHERE division IS NOT NULL;

ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS division TEXT CHECK (division IN ('A', 'B', NULL));

CREATE INDEX IF NOT EXISTS idx_enrollments_division ON public.enrollments(subject_id, division) WHERE division IS NOT NULL;

ALTER TABLE public.enrollments DROP CONSTRAINT IF EXISTS enrollments_student_subject_year_semester_key;

ALTER TABLE public.enrollments ADD CONSTRAINT enrollments_unique_per_division UNIQUE (student_id, subject_id, year, semester, division);

COMMENT ON COLUMN public.subjects.division IS 'División A o B (solo para materias de año 1). NULL para otros años.';

COMMENT ON COLUMN public.enrollments.division IS 'División A o B en la que se inscribió el alumno (solo para materias de año 1). NULL para otros años.';

-- ============================================================================
-- VERIFICACIÓN: Ejecuta esto después para confirmar que todo se creó
-- ============================================================================

SELECT 'Columna subjects.division' as Item, column_name FROM information_schema.columns WHERE table_name = 'subjects' AND column_name = 'division'
UNION ALL
SELECT 'Columna enrollments.division' as Item, column_name FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'division';
