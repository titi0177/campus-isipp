-- =============================================================================
-- Migración: Eliminar constraint restrictivo y permitir reinscripciones
-- =============================================================================
-- El problema es que necesitamos permitir que un alumno se reinscribavarias veces
-- en la misma materia PERO en DIFERENTES años académicos, O con diferentes attempt_number.

-- 1. Eliminar TODOS los constraints problemáticos
ALTER TABLE public.enrollments 
DROP CONSTRAINT IF EXISTS enrollments_unique_attempt;

ALTER TABLE public.enrollments 
DROP CONSTRAINT IF EXISTS enrollments_student_id_subject_id_academic_year_attempt_key;

ALTER TABLE public.enrollments 
DROP CONSTRAINT IF EXISTS enrollments_student_id_subject_id_key;

-- 2. No crear constraint UNIQUE restrictivo
-- Permitir múltiples enrollments del mismo alumno en la misma materia
-- (esto es correcto para recursantes, cambios de división, etc.)

-- 3. Crear un índice para búsquedas rápidas (sin UNIQUE)
CREATE INDEX IF NOT EXISTS idx_enrollments_student_subject_year_attempt 
ON public.enrollments(student_id, subject_id, academic_year, attempt_number);

COMMENT ON INDEX idx_enrollments_student_subject_year_attempt 
IS 'Índice para búsquedas rápidas sin constraint UNIQUE restrictivo';
