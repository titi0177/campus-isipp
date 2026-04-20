-- =============================================================================
-- Migración: Corregir constraint UNIQUE en enrollments para permitir reinscripciones
-- =============================================================================
-- El constraint actual "enrollments_student_id_subject_id_academic_year_attempt_key"
-- previene que un estudiante se reinscribavarias veces en el mismo año.
-- Necesitamos cambiar el constraint para permitir múltiples attempt_number por materia/año.

-- 1. Eliminar el constraint existente
ALTER TABLE public.enrollments 
DROP CONSTRAINT IF EXISTS enrollments_student_id_subject_id_academic_year_attempt_key;

-- 2. Crear un nuevo constraint que permita múltiples intentos
-- El constraint será solo por (student_id, subject_id, academic_year, attempt_number)
-- para permitir intentos 1, 2, 3, etc.
ALTER TABLE public.enrollments
ADD CONSTRAINT enrollments_unique_attempt 
UNIQUE (student_id, subject_id, academic_year, attempt_number);

-- 3. Comentario explicativo
COMMENT ON CONSTRAINT enrollments_unique_attempt ON public.enrollments 
IS 'Permite múltiples inscripciones del mismo alumno en la misma materia/año si tienen diferente attempt_number (1=primer intento, 2=recursante, etc)';
