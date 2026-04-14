-- =========================================================================
-- FIX: Eliminar pagos duplicados y activar solo el trigger correcto
-- =========================================================================

-- 1) Eliminar trigger antiguo si existe
DROP TRIGGER IF EXISTS on_student_created_old ON public.students;

-- 2) Limpiar pagos duplicados: mantener el más reciente (creado por el trigger nuevo)
DELETE FROM public.payments p1
WHERE EXISTS (
  SELECT 1 FROM public.payments p2
  WHERE p1.student_id = p2.student_id
    AND p1.payment_type = p2.payment_type
    AND p1.month IS NOT DISTINCT FROM p2.month
    AND p1.year = p2.year
    AND p1.created_at < p2.created_at  -- Mantener el más nuevo
);

-- 3) Asegurar que el trigger nuevo está activo y es el único
DROP TRIGGER IF EXISTS on_student_created ON public.students;

CREATE TRIGGER on_student_created
  AFTER INSERT ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.crear_pagos_para_estudiante();

-- 4) Verificación: mostrar pagos por estudiante
SELECT 
  s.legajo,
  s.first_name,
  s.last_name,
  COUNT(*) as total_pagos,
  COUNT(DISTINCT CONCAT(p.payment_type, '-', p.month)) as tipos_unicos
FROM public.students s
LEFT JOIN public.payments p ON p.student_id = s.id
GROUP BY s.id, s.legajo, s.first_name, s.last_name
HAVING COUNT(*) > 0
ORDER BY s.created_at DESC
LIMIT 10;

-- =========================================================================
-- NOTA: Si sigue habiendo duplicados después de esto:
-- 1) Verifica que la migración create_payments_table_and_trigger.sql esté ejecutada
-- 2) Revisa cuáles triggers existen: SELECT trigger_name FROM information_schema.triggers WHERE table_name='students';
-- 3) Si hay múltiples triggers, ejecuta: DROP TRIGGER nombre_trigger ON public.students;
-- =========================================================================
