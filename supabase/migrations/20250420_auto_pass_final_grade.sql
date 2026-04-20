-- Migración: Actualizar estructura y triggers de enrollment_grades para auto-pasar nota final
-- Fecha: 2025-04-20

-- 1. Verificar que exista la columna attempt_number (puede ser attempt o attempt_number)
ALTER TABLE public.enrollment_grades 
ADD COLUMN IF NOT EXISTS attempt_number INTEGER DEFAULT 1;

-- 2. Actualizar el trigger para auto-pasar nota final cuando es Desaprobado o Promocionado
CREATE OR REPLACE FUNCTION public.update_enrollment_status_on_grades()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar status del enrollment basado en las notas
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

-- 3. Recrear el trigger
DROP TRIGGER IF EXISTS update_enrollment_status_on_grades ON public.enrollment_grades;
CREATE TRIGGER update_enrollment_status_on_grades
  AFTER INSERT OR UPDATE ON public.enrollment_grades
  FOR EACH ROW
  EXECUTE FUNCTION public.update_enrollment_status_on_grades();

-- 4. Actualizar registros existentes que tengan Desaprobado o Promocionado sin nota final
UPDATE public.enrollment_grades
SET 
  final_grade = partial_grade,
  final_status = partial_status,
  updated_at = NOW()
WHERE 
  final_grade IS NULL 
  AND final_status IS NULL
  AND partial_status IN ('desaprobado', 'promocionado');

-- 5. Asegurar que el trigger se ejecute para actualizar enrollments
-- Ejecutar trigger manualmente para todos los registros actualizados
UPDATE public.enrollment_grades
SET updated_at = NOW()
WHERE partial_status IN ('desaprobado', 'promocionado')
  AND final_grade IS NOT NULL;

-- 6. Verificar integridad - mostrar resumen de cambios
-- SELECT 
--   COUNT(*) as total_desaprobados,
--   SUM(CASE WHEN final_grade IS NOT NULL THEN 1 ELSE 0 END) as con_nota_final
-- FROM public.enrollment_grades
-- WHERE partial_status = 'desaprobado';
