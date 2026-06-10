-- =============================================================================
-- Migración: Agregar soporte para etiquetas de notas y promedios selectivos
-- =============================================================================
-- Esta migración agrega la capacidad de etiquetar cada nota (Parcial 1, TP, etc)
-- y de calcular promedios basados en una selección del profesor

-- 1. Agregar nuevas columnas a enrollment_grades (NO DESTRUCTIVO)
ALTER TABLE public.enrollment_grades
ADD COLUMN IF NOT EXISTS grade_labels JSONB DEFAULT '{
  "grade_1": null,
  "grade_2": null,
  "grade_3": null,
  "grade_4": null,
  "grade_5": null,
  "grade_6": null
}',
ADD COLUMN IF NOT EXISTS selected_grades_for_averaging JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS partial_finalized BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS partial_finalized_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Crear índices para las nuevas columnas
CREATE INDEX IF NOT EXISTS idx_enrollment_grades_partial_finalized ON public.enrollment_grades(partial_finalized);

-- 3. Comentarios
COMMENT ON COLUMN public.enrollment_grades.grade_labels IS 'Mapeo JSON: {"grade_1": "Parcial 1", "grade_2": "Parcial 2", ...} para identificar tipo de nota';
COMMENT ON COLUMN public.enrollment_grades.selected_grades_for_averaging IS 'Array JSON de índices de notas a usar para promediar: [1, 2, 5]';
COMMENT ON COLUMN public.enrollment_grades.partial_finalized IS 'true cuando el profesor presionó "Cerrar Notas" - impide recálculo automático';
COMMENT ON COLUMN public.enrollment_grades.partial_finalized_at IS 'Timestamp de cuándo se finalizaron las notas parciales';

-- 4. Vista para auditoría: mostrar alumnos con notas finalizadas vs pendientes
CREATE OR REPLACE VIEW public.grades_finalization_status AS
SELECT
  eg.id,
  eg.enrollment_id,
  e.student_id,
  s.first_name,
  s.last_name,
  eg.partial_finalized,
  eg.partial_finalized_at,
  eg.partial_grade,
  eg.partial_status,
  eg.selected_grades_for_averaging,
  (CASE WHEN eg.grade_1 IS NOT NULL THEN 1 ELSE 0 END) +
  (CASE WHEN eg.grade_2 IS NOT NULL THEN 1 ELSE 0 END) +
  (CASE WHEN eg.grade_3 IS NOT NULL THEN 1 ELSE 0 END) +
  (CASE WHEN eg.grade_4 IS NOT NULL THEN 1 ELSE 0 END) +
  (CASE WHEN eg.grade_5 IS NOT NULL THEN 1 ELSE 0 END) +
  (CASE WHEN eg.grade_6 IS NOT NULL THEN 1 ELSE 0 END) AS total_grades_loaded
FROM public.enrollment_grades eg
INNER JOIN public.enrollments e ON eg.enrollment_id = e.id
INNER JOIN public.students s ON e.student_id = s.id
ORDER BY s.last_name, s.first_name;

COMMENT ON VIEW public.grades_finalization_status IS 'Auditoría: estado de finalización de notas por alumno';
