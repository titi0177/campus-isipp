-- =========================================================================
-- Diagnóstico: Ver todos los triggers en la tabla students
-- =========================================================================

SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'students'
ORDER BY trigger_name;

-- =========================================================================
-- Si hay múltiples triggers, mostrar cuál está activo
-- =========================================================================

-- Ver función asociada a cada trigger
SELECT 
  t.trigger_name,
  p.proname as function_name
FROM information_schema.triggers t
JOIN pg_trigger pg ON t.trigger_name = pg.tgname
JOIN pg_proc p ON pg.tgfoid = p.oid
WHERE t.event_object_table = 'students';

-- =========================================================================
-- Solución: Eliminar TODOS los triggers antiguos de students
-- =========================================================================

DROP TRIGGER IF EXISTS on_student_created ON public.students;
DROP TRIGGER IF EXISTS on_student_created_old ON public.students;
DROP TRIGGER IF EXISTS trg_student_created ON public.students;
DROP TRIGGER IF EXISTS trigger_create_payments ON public.students;

-- =========================================================================
-- Crear SOLO el trigger correcto
-- =========================================================================

CREATE TRIGGER on_student_created
  AFTER INSERT ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.crear_pagos_para_estudiante();

-- =========================================================================
-- Verificar que solo existe un trigger
-- =========================================================================

SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'students';
