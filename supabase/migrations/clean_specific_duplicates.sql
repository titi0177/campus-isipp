-- =========================================================================
-- LIMPIEZA AGRESIVA: Eliminar ALL pagos de estudiantes con duplicados
-- y dejar que el trigger correcto los recree
-- =========================================================================

-- Primero, identificar estudiantes con pagos duplicados
CREATE TEMP TABLE estudiantes_duplicados AS
SELECT student_id
FROM public.payments
GROUP BY student_id, payment_type, month, year
HAVING COUNT(*) > 1;

-- Mostrar cuáles estudiantes tienen duplicados
SELECT 
  s.legajo,
  s.first_name,
  s.last_name,
  COUNT(*) as pagos_actuales
FROM public.students s
INNER JOIN estudiantes_duplicados ed ON s.id = ed.student_id
LEFT JOIN public.payments p ON p.student_id = s.id
GROUP BY s.id, s.legajo, s.first_name, s.last_name;

-- =========================================================================
-- OPCIÓN 1: Limpieza por estudiante (más seguro)
-- Ejecuta esto para cada estudiante con duplicados
-- =========================================================================

-- Para Juan Román (legajo 2345):
-- Primero obtén su student_id:
SELECT id FROM public.students WHERE legajo = '2345';

-- Luego ejecuta (reemplaza 'UUID_AQUI' con el ID real):
-- DELETE FROM public.payments WHERE student_id = 'UUID_AQUI';
-- Luego corre el trigger manualmente o re-inserta el estudiante

-- =========================================================================
-- OPCIÓN 2: Query para ver exactamente qué está duplicado
-- =========================================================================

SELECT 
  p.student_id,
  s.legajo,
  s.first_name,
  p.payment_type,
  p.month,
  p.year,
  COUNT(*) as repeticiones,
  STRING_AGG(p.id::text, ', ') as payment_ids
FROM public.payments p
INNER JOIN public.students s ON s.id = p.student_id
WHERE s.legajo IN ('2345', '123')
GROUP BY p.student_id, s.legajo, s.first_name, p.payment_type, p.month, p.year
ORDER BY s.legajo, p.payment_type, p.month;

-- =========================================================================
-- OPCIÓN 3: Eliminar pagos específicamente duplicados (mantener 1)
-- =========================================================================

WITH ranked_payments AS (
  SELECT 
    p.*,
    ROW_NUMBER() OVER (PARTITION BY student_id, payment_type, month, year ORDER BY created_at DESC) as rn
  FROM public.payments p
  WHERE student_id IN (SELECT id FROM public.students WHERE legajo IN ('2345', '123'))
)
SELECT * FROM ranked_payments WHERE rn > 1;

-- Ahora eliminar esos duplicados:
DELETE FROM public.payments
WHERE id IN (
  WITH ranked_payments AS (
    SELECT 
      p.id,
      ROW_NUMBER() OVER (PARTITION BY student_id, payment_type, month, year ORDER BY created_at DESC) as rn
    FROM public.payments p
    WHERE student_id IN (SELECT id FROM public.students WHERE legajo IN ('2345', '123'))
  )
  SELECT id FROM ranked_payments WHERE rn > 1
);

-- =========================================================================
-- Verificar resultado final
-- =========================================================================

SELECT 
  s.legajo,
  s.first_name,
  s.last_name,
  COUNT(*) as total_pagos,
  STRING_AGG(DISTINCT p.payment_type, ', ') as tipos,
  COUNT(DISTINCT CASE WHEN p.payment_type = 'cuota_mensual' THEN p.month END) as cuotas_count
FROM public.students s
LEFT JOIN public.payments p ON p.student_id = s.id
WHERE s.legajo IN ('2345', '123')
GROUP BY s.id, s.legajo, s.first_name, s.last_name
ORDER BY s.legajo;
