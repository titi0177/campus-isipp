-- Crear tabla de mensajes (chat)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('student', 'professor')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de materiales (archivos)
CREATE TABLE IF NOT EXISTS materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  professor_id UUID NOT NULL REFERENCES professors(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_url VARCHAR(500) NOT NULL,  -- URL del archivo en Supabase Storage
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER,  -- en bytes
  file_type VARCHAR(100),  -- pdf, doc, pptx, etc
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_messages_enrollment ON messages(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_materials_subject ON materials(subject_id);
CREATE INDEX IF NOT EXISTS idx_materials_professor ON materials(professor_id);

-- Habilitar RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para messages
-- Estudiantes y profesores pueden leer mensajes de sus enrollments
CREATE POLICY "students_read_own_messages" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.id = messages.enrollment_id
      AND e.student_id = (
        SELECT id FROM students WHERE user_id = auth.uid()
      )
    )
    OR
    sender_id = auth.uid()
  );

-- Pueden escribir en sus enrollments
CREATE POLICY "students_write_messages" ON messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.id = messages.enrollment_id
      AND e.student_id = (
        SELECT id FROM students WHERE user_id = auth.uid()
      )
    )
    AND sender_id = auth.uid()
    AND sender_type = 'student'
  );

-- Profesores pueden leer y escribir en sus materias
CREATE POLICY "professors_read_write_messages" ON messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      JOIN subjects s ON e.subject_id = s.id
      WHERE e.id = messages.enrollment_id
      AND s.professor_id = (
        SELECT id FROM professors WHERE user_id = auth.uid()
      )
    )
    OR sender_id = auth.uid()
  );

-- Políticas RLS para materials
-- Todos pueden leer
CREATE POLICY "read_all_materials" ON materials
  FOR SELECT USING (true);

-- Solo el profesor puede crear/editar sus propios materiales
CREATE POLICY "professor_manage_materials" ON materials
  FOR ALL USING (
    professor_id = (
      SELECT id FROM professors WHERE user_id = auth.uid()
    )
  );
