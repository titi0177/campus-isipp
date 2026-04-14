-- Migración limpia: crear/verificar tabla class_attendance
-- Sin tocar RLS ni crear políticas complejas

CREATE TABLE IF NOT EXISTS public.class_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  present BOOLEAN NOT NULL DEFAULT false,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (enrollment_id, date)
);

-- Crear índices para performance
CREATE INDEX IF NOT EXISTS idx_class_attendance_enrollment ON public.class_attendance(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_class_attendance_date ON public.class_attendance(date);
