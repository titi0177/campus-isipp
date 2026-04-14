-- Agregar columna allows_promotion a la tabla subjects
ALTER TABLE public.subjects
ADD COLUMN IF NOT EXISTS allows_promotion BOOLEAN NOT NULL DEFAULT true;

-- Comentario en la columna para documentación
COMMENT ON COLUMN public.subjects.allows_promotion IS 'Si true, los estudiantes pueden obtener nota Promocional (>=8). Si false, solo pueden obtener Aprobado o Desaprobado.';
