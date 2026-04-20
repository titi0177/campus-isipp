-- =============================================================================
-- Migración: Corregir RLS de attendance y class_attendance
-- =============================================================================

-- 1. Habilitar RLS si no está habilitado
ALTER TABLE IF EXISTS public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.class_attendance ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas antiguas (ambas tablas)
DROP POLICY IF EXISTS "attendance_own_read" ON public.attendance;
DROP POLICY IF EXISTS "attendance_admin_write" ON public.attendance;
DROP POLICY IF EXISTS "attendance_student_read" ON public.attendance;
DROP POLICY IF EXISTS "attendance_professor_read" ON public.attendance;
DROP POLICY IF EXISTS "attendance_allow_all" ON public.attendance;

DROP POLICY IF EXISTS "class_attendance_allow_all" ON public.class_attendance;
DROP POLICY IF EXISTS "class_attendance_student_read" ON public.class_attendance;
DROP POLICY IF EXISTS "class_attendance_professor_read" ON public.class_attendance;

-- 3. Crear políticas PERMISIVAS para attendance
CREATE POLICY "attendance_allow_select" ON public.attendance
  FOR SELECT USING (true);

CREATE POLICY "attendance_allow_insert" ON public.attendance
  FOR INSERT WITH CHECK (true);

CREATE POLICY "attendance_allow_update" ON public.attendance
  FOR UPDATE USING (true) WITH CHECK (true);

-- 4. Crear políticas PERMISIVAS para class_attendance
CREATE POLICY "class_attendance_allow_select" ON public.class_attendance
  FOR SELECT USING (true);

CREATE POLICY "class_attendance_allow_insert" ON public.class_attendance
  FOR INSERT WITH CHECK (true);

CREATE POLICY "class_attendance_allow_update" ON public.class_attendance
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "class_attendance_allow_delete" ON public.class_attendance
  FOR DELETE USING (true);

-- 5. Admin acceso total (si aplica)
CREATE POLICY "attendance_admin_all" ON public.attendance
  FOR ALL USING (public.is_admin());

CREATE POLICY "class_attendance_admin_all" ON public.class_attendance
  FOR ALL USING (public.is_admin());

-- Comentario
COMMENT ON TABLE public.attendance IS 'Porcentaje de asistencia acumulado por inscripcion';
COMMENT ON TABLE public.class_attendance IS 'Registro diario de asistencia por dia';
