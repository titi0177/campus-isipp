-- DIAGNÓSTICO: Ver qué está pasando con la función

-- 1. Ver si la función existe
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'auto_enroll_students_by_year';

-- 2. Ver estudiantes de 2° y 3° año
SELECT id, first_name, last_name, year, program_id, status
FROM public.students
WHERE status = 'active' AND year IN (2, 3)
ORDER BY year DESC;

-- 3. Ver si hay materias activas de 1° y 2°
SELECT id, code, name, year, program_id, status
FROM public.subjects
WHERE year IN (1, 2) AND status = 'active'
LIMIT 20;

-- 4. Ejecutar la función para ver qué retorna
SELECT * FROM public.auto_enroll_students_by_year();

-- 5. Si hay error, ver los detalles intentando con un estudiante de 3° específico
-- Primero obtener un ID de estudiante de 3° año
SELECT id FROM public.students WHERE status = 'active' AND year = 3 LIMIT 1;

-- 6. Verificar enrollments actuales de esos estudiantes
SELECT e.student_id, s.first_name, s.last_name, COUNT(e.id) as total_enrolled
FROM public.enrollments e
INNER JOIN public.students s ON e.student_id = s.id
WHERE s.status = 'active' AND s.year IN (2, 3)
GROUP BY e.student_id, s.first_name, s.last_name;
