-- Migración: agregar parciales y trabajos prácticos a la tabla grades

-- Agregar columnas para 3 parciales
ALTER TABLE public.grades ADD COLUMN IF NOT EXISTS partial_1 numeric(5,2);
ALTER TABLE public.grades ADD COLUMN IF NOT EXISTS partial_2 numeric(5,2);
ALTER TABLE public.grades ADD COLUMN IF NOT EXISTS partial_3 numeric(5,2);

-- Agregar columnas para 3 trabajos prácticos
ALTER TABLE public.grades ADD COLUMN IF NOT EXISTS practical_1 numeric(5,2);
ALTER TABLE public.grades ADD COLUMN IF NOT EXISTS practical_2 numeric(5,2);
ALTER TABLE public.grades ADD COLUMN IF NOT EXISTS practical_3 numeric(5,2);

-- Agregar columna para nota final del examen
ALTER TABLE public.grades ADD COLUMN IF NOT EXISTS final_grade_exam numeric(5,2);

-- Crear vista para calcular la nota parcial como promedio de parciales y trabajos
CREATE OR REPLACE VIEW public.vista_calificaciones_detalle AS
SELECT
  g.id AS grade_id,
  e.id AS enrollment_id,
  e.student_id,
  e.subject_id,
  s.name AS subject_name,
  s.code AS subject_code,
  -- Parciales
  g.partial_1,
  g.partial_2,
  g.partial_3,
  -- Trabajos prácticos
  g.practical_1,
  g.practical_2,
  g.practical_3,
  -- Promedio de parciales
  ROUND((COALESCE(g.partial_1, 0) + COALESCE(g.partial_2, 0) + COALESCE(g.partial_3, 0)) / 
    NULLIF((CASE WHEN g.partial_1 IS NOT NULL THEN 1 ELSE 0 END +
            CASE WHEN g.partial_2 IS NOT NULL THEN 1 ELSE 0 END +
            CASE WHEN g.partial_3 IS NOT NULL THEN 1 ELSE 0 END), 0), 2) AS average_partials,
  -- Promedio de trabajos prácticos
  ROUND((COALESCE(g.practical_1, 0) + COALESCE(g.practical_2, 0) + COALESCE(g.practical_3, 0)) / 
    NULLIF((CASE WHEN g.practical_1 IS NOT NULL THEN 1 ELSE 0 END +
            CASE WHEN g.practical_2 IS NOT NULL THEN 1 ELSE 0 END +
            CASE WHEN g.practical_3 IS NOT NULL THEN 1 ELSE 0 END), 0), 2) AS average_practicals,
  -- Nota parcial (promedio de ambos)
  ROUND(((COALESCE(g.partial_1, 0) + COALESCE(g.partial_2, 0) + COALESCE(g.partial_3, 0) +
          COALESCE(g.practical_1, 0) + COALESCE(g.practical_2, 0) + COALESCE(g.practical_3, 0)) / 
    NULLIF((CASE WHEN g.partial_1 IS NOT NULL THEN 1 ELSE 0 END +
            CASE WHEN g.partial_2 IS NOT NULL THEN 1 ELSE 0 END +
            CASE WHEN g.partial_3 IS NOT NULL THEN 1 ELSE 0 END +
            CASE WHEN g.practical_1 IS NOT NULL THEN 1 ELSE 0 END +
            CASE WHEN g.practical_2 IS NOT NULL THEN 1 ELSE 0 END +
            CASE WHEN g.practical_3 IS NOT NULL THEN 1 ELSE 0 END), 0)), 2) AS partial_grade_calculated,
  -- Nota final (solo se carga después de rendir examen)
  g.final_grade_exam,
  -- Status depende de nota final, no parcial
  CASE 
    WHEN g.final_grade_exam IS NULL THEN 'in_progress'
    WHEN g.final_grade_exam >= 7 THEN 'promoted'
    WHEN g.final_grade_exam >= 4 THEN 'passed'
    ELSE 'failed'
  END AS status_final,
  g.created_at,
  g.updated_at
FROM public.grades g
JOIN public.enrollments e ON e.id = g.enrollment_id
JOIN public.subjects s ON s.id = e.subject_id;

-- Comentario sobre estructura
COMMENT ON TABLE public.grades IS 'Calificaciones: parciales (3), trabajos prácticos (3), y nota final del examen. La nota parcial se calcula como promedio, y la NOTA FINAL que determina aprobado/desaprobado/promocionado es final_grade_exam.';
