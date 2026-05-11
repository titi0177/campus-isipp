-- ============================================================================
-- SQL: TABLA DE RELACIÓN USUARIO-ANUNCIO PARA RASTREAR VISTAS
-- ============================================================================
-- Ejecutar esta consulta en Supabase > SQL Editor después de:
-- ALTER TABLE announcements ADD COLUMN IF NOT EXISTS show_at_login BOOLEAN DEFAULT false;
-- ============================================================================

-- Crear tabla announcement_views para rastrear qué usuario vio qué anuncio
CREATE TABLE IF NOT EXISTS public.announcement_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, announcement_id)
);

-- Habilitar RLS
ALTER TABLE public.announcement_views ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: cada usuario solo ve sus propias vistas
DROP POLICY IF EXISTS "announcement_views_own_read" ON public.announcement_views;
DROP POLICY IF EXISTS "announcement_views_insert" ON public.announcement_views;
DROP POLICY IF EXISTS "announcement_views_admin_all" ON public.announcement_views;

CREATE POLICY "announcement_views_own_read" ON public.announcement_views 
  FOR SELECT USING (student_id = public.my_student_id() OR public.is_admin());

CREATE POLICY "announcement_views_insert" ON public.announcement_views 
  FOR INSERT WITH CHECK (student_id = public.my_student_id() OR public.is_admin());

CREATE POLICY "announcement_views_admin_all" ON public.announcement_views 
  FOR ALL USING (public.is_admin());

-- Crear índice para queries rápidas
CREATE INDEX IF NOT EXISTS announcement_views_student_id_idx 
  ON public.announcement_views(student_id);

CREATE INDEX IF NOT EXISTS announcement_views_announcement_id_idx 
  ON public.announcement_views(announcement_id);

-- ============================================================================
-- INSTRUCCIONES:
-- ============================================================================
-- 1. Ejecuta esta consulta completa en Supabase > SQL Editor
-- 2. Verifica que no haya errores
-- 3. El hook automáticamente:
--    - Cargará solo anuncios no vistos (WHERE id NOT IN ...)
--    - Registrará vistas cuando el usuario presione "Entendido"
--    - Cada usuario solo ve cada anuncio UNA SOLA VEZ
-- ============================================================================
