-- =============================================================================
-- Migración: Agregar user_id a professors
-- =============================================================================

-- Agregar columna user_id si no existe
ALTER TABLE public.professors ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- Crear índice
CREATE INDEX IF NOT EXISTS idx_professors_user ON public.professors(user_id);

-- Comentario
COMMENT ON COLUMN public.professors.user_id IS 'Referencia al usuario de autenticación';
