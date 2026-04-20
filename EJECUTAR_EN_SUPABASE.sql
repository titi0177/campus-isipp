-- ============================================================================
-- MIGRACIÓN: Auto-pasar nota final para Desaprobado/Promocionado
-- Fecha: 2025-04-20
-- ============================================================================
-- INSTRUCCIONES:
-- 1. Copia TODO el código de este archivo
-- 2. Ve a Supabase > SQL Editor
-- 3. Crea una nueva query
-- 4. Pega el código
-- 5. Ejecuta (presiona el botón Play o Ctrl+Enter)
-- ============================================================================

-- PASO 1: Agregar columna attempt_number si no existe
ALTER TABLE public.enrollment_grades 
ADD COLUMN IF NOT EXISTS attempt_number INTEGER DEFAULT 1;

-- PASO 2: Recrear el trigger mejorado
CREATE OR REPLACE FUNCTION public.update_enrollment_status_on_grades()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar status del enrollment basado en las notas
  -- Prioridad: final_status > partial_status > en_curso
  UPDATE public.enrollments
  SET status = CASE
    -- Si hay nota final, usar su estado
    WHEN NEW.final_status IS NOT NULL THEN NEW.final_status
    -- Si no hay nota final pero hay status parcial
    WHEN NEW.partial_status IS NOT NULL THEN NEW.partial_status
    ELSE 'en_curso'
  END,
  updated_at = NOW()
  WHERE id = NEW.enrollment_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recrear el trigger
DROP TRIGGER IF EXISTS update_enrollment_status_on_grades ON public.enrollment_grades;
CREATE TRIGGER update_enrollment_status_on_grades
  AFTER INSERT OR UPDATE ON public.enrollment_grades
  FOR EACH ROW
  EXECUTE FUNCTION public.update_enrollment_status_on_grades();

-- PASO 3: AUTO-PASAR NOTA FINAL
-- Actualizar todos los registros que sean Desaprobado o Promocionado
-- y que aún no tengan nota final
UPDATE public.enrollment_grades
SET 
  final_grade = partial_grade,
  final_status = CASE
    WHEN partial_status = 'desaprobado' THEN 'desaprobado'
    WHEN partial_status = 'promocionado' THEN 'promocionado'
    ELSE partial_status
  END,
  updated_at = NOW()
WHERE 
  final_grade IS NULL 
  AND final_status IS NULL
  AND partial_status IN ('desaprobado', 'promocionado');

-- PASO 4: Actualizar enrollments para reflejar los cambios
UPDATE public.enrollments
SET 
  status = eg.final_status,
  updated_at = NOW()
FROM public.enrollment_grades eg
WHERE 
  enrollments.id = eg.enrollment_id
  AND eg.final_status IS NOT NULL;

-- PASO 5: VERIFICAR RESULTADOS
-- Ejecuta estas queries para verificar que todo salió bien:

-- Ver desaprobados con nota final auto-asignada:
-- SELECT 
--   e.id as enrollment_id,
--   CONCAT(s.last_name, ', ', s.first_name) as student_name,
--   eg.partial_grade,
--   eg.partial_status,
--   eg.final_grade,
--   eg.final_status,
--   e.status as enrollment_status
-- FROM public.enrollment_grades eg
-- JOIN public.enrollments e ON eg.enrollment_id = e.id
-- JOIN public.students s ON e.student_id = s.id
-- WHERE eg.partial_status IN ('desaprobado', 'promocionado')
-- ORDER BY eg.created_at DESC
-- LIMIT 10;

-- Ver resumen de cambios:
-- SELECT 
--   partial_status,
--   COUNT(*) as cantidad,
--   SUM(CASE WHEN final_grade IS NOT NULL THEN 1 ELSE 0 END) as con_nota_final
-- FROM public.enrollment_grades
-- WHERE partial_status IN ('desaprobado', 'promocionado')
-- GROUP BY partial_status;
