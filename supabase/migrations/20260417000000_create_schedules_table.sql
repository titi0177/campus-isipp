-- Crear tabla schedules si no existe
CREATE TABLE IF NOT EXISTS public.schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  professor_id UUID REFERENCES public.professors(id) ON DELETE SET NULL,
  program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE,
  division TEXT,
  day TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  classroom TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(subject_id, professor_id, program_id, division, day, start_time)
);

-- Crear índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_schedules_subject ON public.schedules(subject_id);
CREATE INDEX IF NOT EXISTS idx_schedules_professor ON public.schedules(professor_id);
CREATE INDEX IF NOT EXISTS idx_schedules_program ON public.schedules(program_id);
CREATE INDEX IF NOT EXISTS idx_schedules_day ON public.schedules(day);

-- Habilitar RLS
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para schedules (lectura pública, escritura solo para admin)
DROP POLICY IF EXISTS "schedules_read_all" ON public.schedules;
DROP POLICY IF EXISTS "schedules_admin_write" ON public.schedules;

CREATE POLICY "schedules_read_all" ON public.schedules 
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "schedules_admin_write" ON public.schedules 
  FOR ALL USING (public.is_admin());
