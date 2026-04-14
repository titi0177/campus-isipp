-- Crear tabla de horarios
CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  professor_id UUID REFERENCES professors(id) ON DELETE SET NULL,
  day VARCHAR(20) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  classroom VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_schedules_subject_id ON schedules(subject_id);
CREATE INDEX IF NOT EXISTS idx_schedules_professor_id ON schedules(professor_id);
CREATE INDEX IF NOT EXISTS idx_schedules_day ON schedules(day);

-- Habilitar RLS
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
-- Todos pueden leer
CREATE POLICY "Allow read schedules" ON schedules
  FOR SELECT USING (true);

-- Solo admin puede insertar/actualizar/eliminar
CREATE POLICY "Allow admin schedules" ON schedules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
