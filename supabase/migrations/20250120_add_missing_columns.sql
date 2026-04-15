-- Migración: Agregar columnas faltantes a las tablas existentes
-- Fecha: 2025-01-20

-- 1. Agregar columnas faltantes a subjects
ALTER TABLE public.subjects
ADD COLUMN IF NOT EXISTS dictation_type TEXT DEFAULT 'anual' CHECK (dictation_type IN ('anual', 'cuatrimestral'));

ALTER TABLE public.subjects
ADD COLUMN IF NOT EXISTS semester INTEGER CHECK (semester IN (1, 2));

-- 2. Agregar columnas faltantes a enrollments
ALTER TABLE public.enrollments
ADD COLUMN IF NOT EXISTS academic_year INTEGER;

ALTER TABLE public.enrollments
ADD COLUMN IF NOT EXISTS attempt INTEGER DEFAULT 1;

-- 3. Copiar datos de 'year' a 'academic_year' si aún no existe
UPDATE public.enrollments
SET academic_year = COALESCE(academic_year, year)
WHERE academic_year IS NULL;

-- 4. Hacer academic_year NOT NULL después de copiar datos
ALTER TABLE public.enrollments
ALTER COLUMN academic_year SET NOT NULL;

-- 5. Índices adicionales para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_subjects_program_year 
ON public.subjects(program_id, year);

CREATE INDEX IF NOT EXISTS idx_enrollments_academic_year 
ON public.enrollments(student_id, academic_year);

-- 6. Documentar columnas
COMMENT ON COLUMN public.subjects.dictation_type IS 'Tipo de dictado: anual o cuatrimestral';
COMMENT ON COLUMN public.subjects.semester IS 'Semestre: 1 (primer cuatrimestre) o 2 (segundo cuatrimestre)';
COMMENT ON COLUMN public.enrollments.academic_year IS 'Año académico de la inscripción (ej: 2025)';
COMMENT ON COLUMN public.enrollments.attempt IS 'Número de intento (1 = primera vez, 2+ = recursante)';
