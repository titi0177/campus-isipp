-- Migración: Habilitar RLS en class_attendance (sin políticas complejas)

-- Habilitar RLS si no está habilitado
ALTER TABLE public.class_attendance ENABLE ROW LEVEL SECURITY;

-- Crear políticas SIMPLES y seguras
-- 1. Profesores y admin pueden leer todo
CREATE POLICY IF NOT EXISTS "class_attendance_professors_read" ON public.class_attendance 
FOR SELECT 
TO authenticated
USING (
  public.es_admin() 
  OR public.es_profesor()
);

-- 2. Estudiantes pueden leer solo su propia asistencia
CREATE POLICY IF NOT EXISTS "class_attendance_students_read" ON public.class_attendance 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.enrollments e
    WHERE e.id = class_attendance.enrollment_id 
      AND e.student_id IN (
        SELECT id FROM public.students WHERE user_id = auth.uid()
      )
  )
);

-- 3. Solo profesores y admin pueden insertar/actualizar/borrar
CREATE POLICY IF NOT EXISTS "class_attendance_write_admin" ON public.class_attendance 
FOR INSERT 
TO authenticated
WITH CHECK (public.es_admin() OR public.es_profesor());

CREATE POLICY IF NOT EXISTS "class_attendance_update_admin" ON public.class_attendance 
FOR UPDATE 
TO authenticated
USING (public.es_admin() OR public.es_profesor())
WITH CHECK (public.es_admin() OR public.es_profesor());

CREATE POLICY IF NOT EXISTS "class_attendance_delete_admin" ON public.class_attendance 
FOR DELETE 
TO authenticated
USING (public.es_admin() OR public.es_profesor());
