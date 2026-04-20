-- =============================================================================
-- Script SQL para ejecutar en Supabase SQL Editor
-- Verifica y corrige el estado de las tablas críticas
-- =============================================================================

-- 1. Verificar estructura de enrollment_grades
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'enrollment_grades' 
ORDER BY ordinal_position;

-- 2. Verificar estructura de professors
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'professors' 
ORDER BY ordinal_position;

-- 3. Verificar si hay profesores SIN user_id
SELECT id, name, email, user_id 
FROM public.professors 
WHERE user_id IS NULL 
LIMIT 10;

-- 4. Verificar políticas RLS en enrollment_grades
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'enrollment_grades' 
ORDER BY policyname;

-- 5. Verificar que enrollment_grades tiene RLS habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'enrollment_grades';

-- 6. Intentar insertar un registro de prueba (para verificar permisos)
-- NOTA: Cambiar 'enrollment_id_aqui' por un UUID real de enrollment
-- INSERT INTO public.enrollment_grades (enrollment_id, grade_1) 
-- VALUES ('enrollment_id_aqui', 8.5) 
-- RETURNING *;
