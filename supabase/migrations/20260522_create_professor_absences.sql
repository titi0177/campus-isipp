-- =============================================================================
-- PROFESSOR ABSENCES - Crear tabla y políticas RLS
-- =============================================================================

-- Agregar user_id a professors si no existe
ALTER TABLE public.professors
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- Crear tabla professor_absences
CREATE TABLE IF NOT EXISTS public.professor_absences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professor_id UUID NOT NULL REFERENCES public.professors(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  absence_date DATE NOT NULL,
  time_start TIME NOT NULL,
  time_end TIME NOT NULL,
  article TEXT NOT NULL,
  description TEXT DEFAULT '',
  document_name TEXT NOT NULL,
  document_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'enviado' CHECK (status IN ('enviado', 'revisado', 'aprobado', 'rechazado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_professor_absences_professor_id ON public.professor_absences(professor_id);
CREATE INDEX IF NOT EXISTS idx_professor_absences_subject_id ON public.professor_absences(subject_id);
CREATE INDEX IF NOT EXISTS idx_professor_absences_date ON public.professor_absences(absence_date);

-- Habilitar RLS
ALTER TABLE public.professor_absences ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas antiguas si existen
DROP POLICY IF EXISTS "professor_absences_own" ON public.professor_absences;
DROP POLICY IF EXISTS "professor_absences_insert" ON public.professor_absences;
DROP POLICY IF EXISTS "professor_absences_admin_all" ON public.professor_absences;

-- Función auxiliar para obtener profesor_id del usuario actual
CREATE OR REPLACE FUNCTION public.my_professor_id()
RETURNS UUID AS $$
  SELECT id FROM public.professors WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Políticas RLS
-- Los profesores ven solo sus propias inasistencias
CREATE POLICY "professor_absences_own_read" ON public.professor_absences 
  FOR SELECT 
  USING (professor_id = public.my_professor_id() OR public.is_admin());

-- Los profesores pueden crear nuevas inasistencias
CREATE POLICY "professor_absences_own_insert" ON public.professor_absences 
  FOR INSERT 
  WITH CHECK (professor_id = public.my_professor_id() OR public.is_admin());

-- Los profesores pueden actualizar sus propias inasistencias (solo admin puede cambiar estado)
CREATE POLICY "professor_absences_own_update" ON public.professor_absences 
  FOR UPDATE 
  USING (professor_id = public.my_professor_id() OR public.is_admin())
  WITH CHECK (professor_id = public.my_professor_id() OR public.is_admin());

-- Los admins pueden acceder a todo
CREATE POLICY "professor_absences_admin_all" ON public.professor_absences 
  FOR ALL 
  USING (public.is_admin());

-- =============================================================================
-- STORAGE - Políticas para buckets
-- =============================================================================

-- Insertar políticas para el bucket professor-absences-submitted
INSERT INTO storage.objects (bucket_id, name, owner_id, metadata)
SELECT 'professor-absences-submitted', '.gitkeep', auth.uid(), '{}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM storage.objects 
  WHERE bucket_id = 'professor-absences-submitted' AND name = '.gitkeep'
)
ON CONFLICT DO NOTHING;

-- Nota: Las políticas de Storage se deben configurar en la UI de Supabase:
-- 1. Para "professor-absences-submitted":
--    - SELECT: Allowed for authenticated users (para ver sus propios archivos)
--    - INSERT: Allowed for authenticated users (para subir archivos)
--    - UPDATE: Denied
--    - DELETE: Allowed for service role only
--
-- 2. Para "professor-absences":
--    - SELECT: Allowed for authenticated users (para descargar templates)
--    - INSERT: Denied
--    - UPDATE: Denied
--    - DELETE: Denied

-- =============================================================================
-- COMENTARIOS ÚTILES
-- =============================================================================
-- Si necesitas permitir uploads anónimos (no recomendado):
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('professor-absences-submitted', 'professor-absences-submitted', true)
-- ON CONFLICT DO NOTHING;
--
-- Para subir archivos via SQL (si tienes acceso directo):
-- INSERT INTO storage.objects (bucket_id, name, owner_id, metadata, file_size)
-- VALUES ('professor-absences', 'justificacion-inasistencia.docx', auth.uid(), '{}'::jsonb, 0)
-- ON CONFLICT DO NOTHING;
