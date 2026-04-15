-- ============================================================================
-- SCRIPT SQL: DIVISIONES A Y B PARA PRIMER AÑO
-- ============================================================================
-- Este script agrega soporte completo para divisiones A y B en materias de
-- primer año. Permite separar la carga de notas y asistencia por división.
--
-- FECHA: 2024
-- PROPÓSITO: Implementar divisiones en inscripciones de primer año
-- ============================================================================

-- ============================================================================
-- 1. AGREGAR COLUMNA 'division' A TABLA subjects
-- ============================================================================
-- Valores permitidos: 'A', 'B', NULL (para otros años)
-- Solo para materias de primer año

ALTER TABLE public.subjects
ADD COLUMN IF NOT EXISTS division TEXT CHECK (division IN ('A', 'B', NULL));

-- ============================================================================
-- 2. CREAR ÍNDICE EN subjects PARA BÚSQUEDAS RÁPIDAS
-- ============================================================================
-- Índice compuesto (year, division) para optimizar filtros

CREATE INDEX IF NOT EXISTS idx_subjects_division_year 
ON public.subjects(year, division) 
WHERE division IS NOT NULL;

-- ============================================================================
-- 3. AGREGAR COLUMNA 'division' A TABLA enrollments
-- ============================================================================
-- Rastrear en qué división se inscribió el alumno
-- Valores permitidos: 'A', 'B', NULL

ALTER TABLE public.enrollments
ADD COLUMN IF NOT EXISTS division TEXT CHECK (division IN ('A', 'B', NULL));

-- ============================================================================
-- 4. CREAR ÍNDICE EN enrollments PARA BÚSQUEDAS RÁPIDAS
-- ============================================================================
-- Índice compuesto (subject_id, division) para optimizar filtros por división

CREATE INDEX IF NOT EXISTS idx_enrollments_division 
ON public.enrollments(subject_id, division) 
WHERE division IS NOT NULL;

-- ============================================================================
-- 5. ACTUALIZAR CONSTRAINT UNIQUE EN enrollments
-- ============================================================================
-- Evitar: mismo alumno inscripto dos veces en misma materia/división/año
-- Ahora incluye: student_id, subject_id, year, semester, division
-- Resultado: Un alumno PUEDE inscribirse en Div. A Y Div. B de la misma materia

-- Primero eliminar constraint antiguo si existe
ALTER TABLE public.enrollments
DROP CONSTRAINT IF EXISTS enrollments_student_subject_year_semester_key;

-- Crear nuevo constraint con división
ALTER TABLE public.enrollments
ADD CONSTRAINT enrollments_unique_per_division 
UNIQUE (student_id, subject_id, year, semester, division);

-- ============================================================================
-- 6. AGREGAR COMENTARIOS A LAS COLUMNAS
-- ============================================================================
-- Documentar el propósito de cada columna

COMMENT ON COLUMN public.subjects.division 
IS 'División A o B (solo para materias de año 1). NULL para otros años.';

COMMENT ON COLUMN public.enrollments.division 
IS 'División A o B en la que se inscribió el alumno (solo para materias de año 1). NULL para otros años.';

-- ============================================================================
-- 7. VERIFICACIÓN (OPCIONAL - ejecutar después para confirmar)
-- ============================================================================
-- Descomenta estas líneas para verificar que todo se creó correctamente

/*
-- Ver estructura de tabla subjects
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'subjects' AND column_name = 'division';

-- Ver estructura de tabla enrollments
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'enrollments' AND column_name = 'division';

-- Ver índices creados
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN ('subjects', 'enrollments') 
AND indexname LIKE '%division%';

-- Ver constraints
SELECT constraint_name, table_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name IN ('subjects', 'enrollments') 
AND constraint_name LIKE '%division%';
*/

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================
-- Una vez ejecutado, las siguientes funcionalidades estarán disponibles:
--
-- ✅ Crear materias de año 1 con División A o B
-- ✅ Inscribir alumnos en divisiones específicas
-- ✅ Validación: evitar inscripciones duplicadas por división
-- ✅ Separar cargas de notas por división en profesores
-- ✅ Separar control de asistencia por división en profesores
--
-- ============================================================================
