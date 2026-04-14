-- Migración: Agregar componentes de calificación (parciales y trabajos prácticos)

-- Agregar columna updated_at si falta
ALTER TABLE public.grades ADD COLUMN IF NOT EXISTS updated_at timestamp without time zone DEFAULT now();

-- Agregar 3 parciales
ALTER TABLE public.grades ADD COLUMN IF NOT EXISTS partial_1 numeric(5,2);
ALTER TABLE public.grades ADD COLUMN IF NOT EXISTS partial_2 numeric(5,2);
ALTER TABLE public.grades ADD COLUMN IF NOT EXISTS partial_3 numeric(5,2);

-- Agregar 3 trabajos prácticos
ALTER TABLE public.grades ADD COLUMN IF NOT EXISTS practical_1 numeric(5,2);
ALTER TABLE public.grades ADD COLUMN IF NOT EXISTS practical_2 numeric(5,2);
ALTER TABLE public.grades ADD COLUMN IF NOT EXISTS practical_3 numeric(5,2);

-- Renombrar final_exam_grade a final_grade_exam para consistencia
ALTER TABLE public.grades RENAME COLUMN final_exam_grade TO final_grade_exam;

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- Crear trigger para updated_at
DROP TRIGGER IF EXISTS trg_u_grades ON public.grades;
CREATE TRIGGER trg_u_grades BEFORE UPDATE ON public.grades
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- Comentario sobre la estructura
COMMENT ON TABLE public.grades IS 'Calificaciones: 3 parciales, 3 trabajos prácticos, y nota final del examen. La nota parcial se calcula como promedio, y la NOTA FINAL (final_grade_exam) determina aprobado/desaprobado/promocionado.';
COMMENT ON COLUMN public.grades.partial_1 IS 'Primer parcial (0-10)';
COMMENT ON COLUMN public.grades.partial_2 IS 'Segundo parcial (0-10)';
COMMENT ON COLUMN public.grades.partial_3 IS 'Tercer parcial (0-10)';
COMMENT ON COLUMN public.grades.practical_1 IS 'Primer trabajo práctico (0-10)';
COMMENT ON COLUMN public.grades.practical_2 IS 'Segundo trabajo práctico (0-10)';
COMMENT ON COLUMN public.grades.practical_3 IS 'Tercer trabajo práctico (0-10)';
COMMENT ON COLUMN public.grades.partial_grade IS 'Promedio de parciales y trabajos prácticos (solo autoriza rendir examen si >= 6)';
COMMENT ON COLUMN public.grades.final_grade_exam IS 'Nota final del examen (determina aprobado/desaprobado/promocionado)';
COMMENT ON COLUMN public.grades.final_grade IS 'Nota final (copia de final_grade_exam o partial_grade)';
COMMENT ON COLUMN public.grades.status IS 'Estado: promoted (>=7), passed (4-6), failed (<4), in_progress';
