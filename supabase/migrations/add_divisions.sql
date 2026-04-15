-- Agregar soporte para divisiones A y B en materias de primer año
-- Creado: 2024

-- 1. Agregar columna 'division' a subjects (A, B, null para otros años)
ALTER TABLE public.subjects
ADD COLUMN IF NOT EXISTS division TEXT CHECK (division IN ('A', 'B', NULL));

-- 2. Agregar índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_subjects_division_year 
ON public.subjects(year, division) 
WHERE division IS NOT NULL;

-- 3. Agregar columna 'division' a enrollments (para rastrear a qué división se inscribió el alumno)
ALTER TABLE public.enrollments
ADD COLUMN IF NOT EXISTS division TEXT CHECK (division IN ('A', 'B', NULL));

-- 4. Crear índice compuesto para búsquedas rápidas en enrollments
CREATE INDEX IF NOT EXISTS idx_enrollments_division 
ON public.enrollments(subject_id, division) 
WHERE division IS NOT NULL;

-- 5. Agregar constraint UNIQUE mejorado: un alumno no puede inscribirse dos veces a la misma materia en la misma división en el mismo año
ALTER TABLE public.enrollments
DROP CONSTRAINT IF EXISTS enrollments_student_subject_year_semester_key;

ALTER TABLE public.enrollments
ADD CONSTRAINT enrollments_unique_per_division 
UNIQUE (student_id, subject_id, year, semester, division);

-- 6. Comentarios en las columnas
COMMENT ON COLUMN public.subjects.division IS 'División A o B (solo para materias de año 1)';
COMMENT ON COLUMN public.enrollments.division IS 'División A o B en la que se inscribió el alumno (solo para materias de año 1)';
