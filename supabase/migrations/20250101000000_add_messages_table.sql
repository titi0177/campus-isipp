-- Migración: recrear tabla de mensajes correctamente

-- Dropear tabla antigua si existe
DROP TABLE IF EXISTS public.messages CASCADE;

-- Crear tabla de mensajes con estructura correcta
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('student', 'professor')),
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices
CREATE INDEX idx_messages_sender ON public.messages(sender_id);
CREATE INDEX idx_messages_subject ON public.messages(subject_id);
CREATE INDEX idx_messages_read ON public.messages(read);
CREATE INDEX idx_messages_created ON public.messages(created_at);

-- Habilitar RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para mensajes
CREATE POLICY "messages_user_read" ON public.messages 
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "messages_user_insert" ON public.messages 
FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE POLICY "messages_user_update" ON public.messages 
FOR UPDATE USING (sender_id = auth.uid());
