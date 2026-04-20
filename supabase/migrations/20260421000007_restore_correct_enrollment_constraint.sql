-- =============================================================================
-- Migración: Restaurar constraint UNIQUE correcto en enrollments
-- =============================================================================
-- CONTEXTO: Habíamos eliminado todos los constraints para permitir reinscripciones.
-- Ahora restauramos UN constraint específico que:
-- - Previene duplicados: No puede haber 2 records con (student, subject, year, attempt) iguales
-- - Permite reinscripciones: Sí puede haber (student, subject, 2024, attempt=1) Y (student, subject, 2025, attempt=2)

-- 1. Eliminar cualquier constraint anterior problemático
ALTER TABLE public.enrollments 
DROP CONSTRAINT IF EXISTS enrollments_unique_attempt;

ALTER TABLE public.enrollments 
DROP CONSTRAINT IF EXISTS enrollments_student_id_subject_id_academic_year_attempt_key;

ALTER TABLE public.enrollments 
DROP CONSTRAINT IF EXISTS enrollments_student_id_subject_id_key;

-- 2. Restaurar el constraint CORRECTO
-- Este permite múltiples intentos (1, 2, 3) pero previene duplicados dentro del mismo intento
ALTER TABLE public.enrollments
ADD CONSTRAINT enrollments_unique_attempt 
UNIQUE (student_id, subject_id, academic_year, attempt_number);

-- 3. Índice adicional para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_enrollments_student_subject_year_attempt 
ON public.enrollments(student_id, subject_id, academic_year, attempt_number);

-- 4. Comentario
COMMENT ON CONSTRAINT enrollments_unique_attempt ON public.enrollments 
IS 'Permite múltiples inscripciones del mismo alumno en la misma materia/año si tienen diferente attempt_number (1=primer intento, 2=recursante, 3=recursante 2do año, etc)';
