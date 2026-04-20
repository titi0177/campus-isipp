-- Función para calcular y actualizar el estado del alumno basado en calificaciones
-- Este estado se usa para mostrar el progreso actual (En curso, Regular, Desaprobado, etc)

CREATE OR REPLACE FUNCTION public.calculate_student_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar el estado basado en las calificaciones
  UPDATE public.enrollments
  SET status = (
    CASE
      -- Si tiene nota final, usar el estado final
      WHEN NEW.final_status IS NOT NULL THEN
        CASE
          WHEN NEW.final_status = 'promocionado' THEN 'promocionado'
          WHEN NEW.final_status = 'aprobado' THEN 'aprobado'
          ELSE 'desaprobado'
        END
      -- Si tiene nota parcial pero no final, usar el estado parcial
      WHEN NEW.partial_status IS NOT NULL THEN
        CASE
          WHEN NEW.partial_status = 'promocionado' THEN 'promocionado'
          WHEN NEW.partial_status = 'regular' THEN 'regular'
          WHEN NEW.partial_status = 'desaprobado' THEN 'desaprobado'
          ELSE 'en_curso'
        END
      -- Sin notas
      ELSE 'en_curso'
    END
  )
  WHERE id = NEW.enrollment_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger
DROP TRIGGER IF EXISTS update_enrollment_status ON public.enrollment_grades;
CREATE TRIGGER update_enrollment_status
  AFTER INSERT OR UPDATE ON public.enrollment_grades
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_student_status();

-- Función para crear intento 2 cuando hay desaprobado
CREATE OR REPLACE FUNCTION public.handle_failed_enrollment()
RETURNS TRIGGER AS $$
BEGIN
  -- Si es la primera vez que se marca como desaprobado, crear oportunidad de reintento
  IF NEW.partial_status = 'desaprobado' AND OLD.partial_status IS DISTINCT FROM 'desaprobado' THEN
    -- Crear nuevo enrollment para intento 2
    INSERT INTO public.enrollments (
      student_id,
      subject_id,
      academic_year,
      attempt_number,
      status
    )
    SELECT
      e.student_id,
      e.subject_id,
      e.academic_year,
      COALESCE((SELECT MAX(attempt_number) FROM public.enrollments 
                WHERE student_id = e.student_id AND subject_id = e.subject_id), 0) + 1,
      'en_curso'
    FROM public.enrollments e
    WHERE e.id = NEW.enrollment_id
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger para reintentos
DROP TRIGGER IF EXISTS create_retry_attempt ON public.enrollment_grades;
CREATE TRIGGER create_retry_attempt
  AFTER UPDATE ON public.enrollment_grades
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_failed_enrollment();
