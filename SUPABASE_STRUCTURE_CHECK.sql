-- Script para inspeccionar la estructura de la base de datos
-- Ejecutar en Supabase SQL Editor para ver qué tablas existen

-- 1. Ver todas las tablas en el schema público
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Ver estructura de la tabla enrollments
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'enrollments'
ORDER BY ordinal_position;

-- 3. Ver estructura de la tabla enrollment_grades (si existe)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'enrollment_grades'
ORDER BY ordinal_position;

-- 4. Ver estructura de la tabla grades (antigua, si existe)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'grades'
ORDER BY ordinal_position;

-- 5. Ver estructura de attendance
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'attendance'
ORDER BY ordinal_position;

-- 6. Ver datos de ejemplo de enrollments
SELECT * FROM public.enrollments LIMIT 1;

-- 7. Ver datos de ejemplo de enrollment_grades (si existe)
SELECT * FROM public.enrollment_grades LIMIT 1;

-- 8. Ver datos de ejemplo de grades (si existe)
SELECT * FROM public.grades LIMIT 1;

-- 9. Contar registros en cada tabla
SELECT 
  (SELECT COUNT(*) FROM public.enrollments) as enrollments_count,
  (SELECT COUNT(*) FROM public.enrollment_grades) as enrollment_grades_count,
  (SELECT COUNT(*) FROM public.grades) as grades_count,
  (SELECT COUNT(*) FROM public.attendance) as attendance_count;
