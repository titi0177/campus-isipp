-- Migración: agregar program_id a la tabla schedules para filtrar por carrera

ALTER TABLE public.schedules
  ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_schedules_program ON public.schedules(program_id);
