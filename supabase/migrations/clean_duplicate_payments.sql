-- =========================================================================
-- LIMPIEZA TOTAL: Eliminar todos los pagos duplicados
-- Mantener UNO solo por combinación (student_id, payment_type, month, year)
-- =========================================================================

-- Identificar y eliminar duplicados
-- Estrategia: Agrupar por (student_id, payment_type, month, year)
-- y mantener el registro más reciente (por created_at)

DELETE FROM public.payments
WHERE id IN (
  SELECT p.id
  FROM public.payments p
  INNER JOIN (
    SELECT student_id, payment_type, month, year, MAX(created_at) as max_created
    FROM public.payments
    GROUP BY student_id, payment_type, month, year
    HAVING COUNT(*) > 1  -- Solo grupos con duplicados
  ) dupes
  ON p.student_id = dupes.student_id
    AND p.payment_type = dupes.payment_type
    AND COALESCE(p.month, 0) = COALESCE(dupes.month, 0)
    AND p.year = dupes.year
    AND p.created_at < dupes.max_created  -- Eliminar todos EXCEPTO el más reciente
);

-- =========================================================================
-- Verificar resultado
-- =========================================================================

SELECT 
  s.legajo,
  s.first_name,
  s.last_name,
  COUNT(*) as total_pagos,
  STRING_AGG(DISTINCT p.payment_type, ', ' ORDER BY p.payment_type) as tipos,
  COUNT(DISTINCT CASE WHEN p.payment_type = 'cuota_mensual' THEN p.month END) as cuotas_count
FROM public.students s
LEFT JOIN public.payments p ON p.student_id = s.id
GROUP BY s.id, s.legajo, s.first_name, s.last_name
HAVING COUNT(*) > 0
ORDER BY s.created_at DESC;

-- =========================================================================
-- Resumen esperado por estudiante:
-- - 1 Seguro (month = NULL)
-- - 1 Inscripción (month = NULL)
-- - 9 Cuotas (months 4-12)
-- TOTAL: 11 pagos
-- =========================================================================
