-- ============================================================================
-- SCRIPT MANUAL: Auto-inscripción de estudiantes históricos
-- ============================================================================
-- Ejecuta esto directamente en Supabase SQL Editor si necesitas inscribir
-- estudiantes de forma manual sin el componente admin

-- 1. OPCIÓN A: Auto-inscribir TODOS los alumnos de 2° y 3° año
-- ============================================================================
SELECT * FROM public.auto_enroll_students_by_year();

-- Para un año académico específico:
-- SELECT * FROM public.auto_enroll_students_by_year(2024);


-- 2. OPCIÓN B: Auto-inscribir un estudiante específico
-- ============================================================================
-- Reemplaza 'STUDENT_UUID' con el ID real del estudiante
-- SELECT public.auto_enroll_single_student('STUDENT_UUID'::UUID);

-- Ejemplo:
-- SELECT public.auto_enroll_single_student('550e8400-e29b-41d4-a716-446655440000'::UUID);


-- 3. OPCIÓN C: Ver estudiantes que necesitan inscripción
-- ============================================================================
SELECT
  s.id,
  CONCAT(s.last_name, ', ', s.first_name) AS student_name,
  s.year,
  p.name AS program,
  COUNT(subj.id) AS required_subjects,
  COALESCE(COUNT(e.id), 0) AS enrolled_subjects,
  COUNT(subj.id) - COALESCE(COUNT(e.id), 0) AS missing_subjects
FROM public.students s
INNER JOIN public.programs p ON s.program_id = p.id
CROSS JOIN public.subjects subj
LEFT JOIN public.enrollments e ON (
  e.student_id = s.id
  AND e.subject_id = subj.id
  AND e.academic_year = EXTRACT(YEAR FROM NOW())::INTEGER
)
WHERE s.status = 'active'
  AND s.year IN (2, 3)
  AND (
    (s.year = 2 AND subj.program_id = s.program_id AND subj.year = 1)
    OR (s.year = 3 AND subj.program_id = s.program_id AND subj.year IN (1, 2))
  )
GROUP BY s.id, s.first_name, s.last_name, s.year, p.name
HAVING COUNT(subj.id) - COALESCE(COUNT(e.id), 0) > 0
ORDER BY s.year DESC, s.last_name, s.first_name;


-- 4. OPCIÓN D: Ver inscripciones de un estudiante específico
-- ============================================================================
-- Reemplaza 'STUDENT_UUID' con el ID real
SELECT
  s.first_name,
  s.last_name,
  s.year,
  subj.code,
  subj.name AS subject_name,
  subj.year AS subject_year,
  e.academic_year,
  e.status,
  e.attempt_number,
  e.created_at
FROM public.enrollments e
INNER JOIN public.subjects subj ON e.subject_id = subj.id
INNER JOIN public.students s ON e.student_id = s.id
WHERE e.student_id = 'STUDENT_UUID'::UUID
  AND e.academic_year = EXTRACT(YEAR FROM NOW())::INTEGER
ORDER BY subj.year, subj.name;


-- 5. OPCIÓN E: Verificar integridad - contar duplicados
-- ============================================================================
-- Si hay duplicados, muestra qué estudiante/materia tiene el problema
SELECT
  s.id,
  CONCAT(s.last_name, ', ', s.first_name) AS student_name,
  subj.code,
  subj.name,
  e.academic_year,
  COUNT(*) AS duplicate_count
FROM public.enrollments e
INNER JOIN public.students s ON e.student_id = s.id
INNER JOIN public.subjects subj ON e.subject_id = subj.id
WHERE e.academic_year = EXTRACT(YEAR FROM NOW())::INTEGER
GROUP BY s.id, s.last_name, s.first_name, subj.code, subj.name, e.academic_year
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;


-- 6. OPCIÓN F: Limpiar duplicados (usa con cuidado)
-- ============================================================================
-- ADVERTENCIA: Solo ejecuta esto si encontraste duplicados en OPCIÓN E
-- Esto ELIMINA duplicados, MANTENIENDO el más antiguo
-- DELETE FROM public.enrollments
-- WHERE id NOT IN (
--   SELECT DISTINCT ON (student_id, subject_id, academic_year)
--     id
--   FROM public.enrollments
--   WHERE academic_year = EXTRACT(YEAR FROM NOW())::INTEGER
--   ORDER BY student_id, subject_id, academic_year, created_at ASC
-- );


-- 7. RESUMEN DE INSCRIPCIONES POR PROGRAMA Y AÑO
-- ============================================================================
SELECT
  p.name AS program,
  s.year,
  COUNT(DISTINCT s.id) AS total_students,
  COUNT(e.id) AS total_enrollments,
  ROUND(
    (COUNT(e.id)::NUMERIC / NULLIF(COUNT(DISTINCT s.id), 0))::NUMERIC,
    2
  ) AS avg_enrollments_per_student
FROM public.students s
INNER JOIN public.programs p ON s.program_id = p.id
LEFT JOIN public.enrollments e ON (
  e.student_id = s.id
  AND e.academic_year = EXTRACT(YEAR FROM NOW())::INTEGER
)
WHERE s.status = 'active'
GROUP BY p.id, p.name, s.year
ORDER BY p.name, s.year;
