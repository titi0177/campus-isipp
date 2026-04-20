-- ============================================================================
-- MIGRACIÓN: Gestión de Desaprobados - Finalizar intento y habilitar recursión
-- Fecha: 2025-04-20
-- ============================================================================
-- INSTRUCCIONES:
-- 1. Copia TODO el código de este archivo
-- 2. Ve a Supabase > SQL Editor
-- 3. Crea una nueva query
-- 4. Pega el código
-- 5. Ejecuta (presiona el botón Play o Ctrl+Enter)
-- ============================================================================

-- PASO 1: Agregar columnas a enrollments para rastrear intentos
ALTER TABLE public.enrollments
ADD COLUMN IF NOT EXISTS attempt_number INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_recursive BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- PASO 2: Actualizar trigger para marcar como completado cuando es Desaprobado o Promocionado
CREATE OR REPLACE FUNCTION public.update_enrollment_status_on_grades()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar status del enrollment basado en las notas
  UPDATE public.enrollments
  SET 
    status = CASE
      -- Si hay nota final, usar su estado
      WHEN NEW.final_status IS NOT NULL THEN NEW.final_status
      -- Si no hay nota final pero hay status parcial
      WHEN NEW.partial_status IS NOT NULL THEN NEW.partial_status
      ELSE 'en_curso'
    END,
    -- Si es Desaprobado o Promocionado, marcar como completado
    completed_at = CASE
      WHEN NEW.final_status IN ('desaprobado', 'promocionado') THEN NOW()
      ELSE completed_at
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

-- PASO 3: Crear tabla de recursión (para rastrear reinscripciones)
CREATE TABLE IF NOT EXISTS public.enrollment_recursions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  original_enrollment_id UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  new_enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE SET NULL,
  attempt_number INTEGER NOT NULL,
  reason TEXT, -- 'desaprobado', 'abandono', etc
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(original_enrollment_id, attempt_number)
);

CREATE INDEX IF NOT EXISTS idx_enrollment_recursions_original ON public.enrollment_recursions(original_enrollment_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_recursions_new ON public.enrollment_recursions(new_enrollment_id);

-- PASO 4: Crear función para generar nueva inscripción como recursante
CREATE OR REPLACE FUNCTION public.create_recursive_enrollment(
  p_original_enrollment_id UUID,
  p_reason TEXT DEFAULT 'desaprobado'
)
RETURNS UUID AS $$
DECLARE
  v_new_enrollment_id UUID;
  v_student_id UUID;
  v_subject_id UUID;
  v_division TEXT;
  v_attempt_number INTEGER;
BEGIN
  -- Obtener datos del enrollment original
  SELECT e.student_id, e.subject_id, e.division, e.attempt_number
  INTO v_student_id, v_subject_id, v_division, v_attempt_number
  FROM public.enrollments e
  WHERE e.id = p_original_enrollment_id;

  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'Enrollment no encontrado';
  END IF;

  -- Crear nuevo enrollment como recursante
  INSERT INTO public.enrollments (
    student_id,
    subject_id,
    division,
    status,
    attempt_number,
    is_recursive,
    created_at
  )
  VALUES (
    v_student_id,
    v_subject_id,
    v_division,
    'en_curso',
    v_attempt_number + 1,
    TRUE,
    NOW()
  )
  RETURNING id INTO v_new_enrollment_id;

  -- Registrar en tabla de recursiones
  INSERT INTO public.enrollment_recursions (
    original_enrollment_id,
    new_enrollment_id,
    attempt_number,
    reason
  )
  VALUES (
    p_original_enrollment_id,
    v_new_enrollment_id,
    v_attempt_number + 1,
    p_reason
  );

  RETURN v_new_enrollment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 5: Crear vista para alumnos desaprobados listos para recursión
CREATE OR REPLACE VIEW public.desaprobados_para_recursion AS
SELECT 
  e.id as enrollment_id,
  e.student_id,
  s.first_name,
  s.last_name,
  s.legajo,
  sub.name as subject_name,
  sub.code as subject_code,
  e.attempt_number,
  e.division,
  eg.partial_grade,
  eg.final_grade,
  eg.final_status,
  e.completed_at,
  e.created_at
FROM public.enrollments e
JOIN public.students s ON e.student_id = s.id
JOIN public.subjects sub ON e.subject_id = sub.id
JOIN public.enrollment_grades eg ON e.id = eg.enrollment_id
WHERE 
  eg.final_status = 'desaprobado'
  AND e.completed_at IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.enrollment_recursions er
    WHERE er.original_enrollment_id = e.id
    AND er.new_enrollment_id IS NOT NULL
  );

-- PASO 6: Actualizar RLS para ocultar desaprobados
-- No mostrar en carga de notas los que están completados (desaprobado/promocionado)
ALTER TABLE public.enrollment_grades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "enrollment_grades_professor_write" ON public.enrollment_grades;
CREATE POLICY "enrollment_grades_professor_write" ON public.enrollment_grades
  FOR ALL
  USING (
    enrollment_id IN (
      SELECT e.id FROM public.enrollments e
      JOIN public.subjects s ON e.subject_id = s.id
      WHERE s.professor_id IN (SELECT id FROM public.professors WHERE user_id = auth.uid())
      -- Excluir los que ya están completados (desaprobado/promocionado)
      AND (e.completed_at IS NULL OR e.status = 'regular')
    )
  );

-- PASO 7: Habilitar vista para recursiones
ALTER TABLE public.enrollment_recursions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "enrollment_recursions_professor_read" ON public.enrollment_recursions
  FOR SELECT
  USING (
    original_enrollment_id IN (
      SELECT e.id FROM public.enrollments e
      JOIN public.subjects s ON e.subject_id = s.id
      WHERE s.professor_id IN (SELECT id FROM public.professors WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "enrollment_recursions_admin_all" ON public.enrollment_recursions
  FOR ALL
  USING (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));

-- PASO 8: Verificación
-- Ejecuta estas queries para ver el resultado:

-- Ver desaprobados completados listos para recursión:
-- SELECT * FROM public.desaprobados_para_recursion LIMIT 10;

-- Ver historial de recursiones:
-- SELECT 
--   (SELECT CONCAT(s.last_name, ', ', s.first_name) FROM public.students s WHERE s.id IN (
--     SELECT student_id FROM public.enrollments WHERE id = er.original_enrollment_id
--   )) as student_name,
--   er.attempt_number,
--   er.reason,
--   er.created_at
-- FROM public.enrollment_recursions er
-- ORDER BY er.created_at DESC LIMIT 10;
