# 📝 SQL para Supabase - Notificaciones de Calificaciones

Ejecuta este SQL en Supabase para que funcionen las notificaciones de calificaciones.

## Opción 1: Agregar Columna y Trigger (Recomendado)

```sql
-- 1. Agregar columna student_id a enrollment_grades si no existe
ALTER TABLE public.enrollment_grades
ADD COLUMN student_id UUID REFERENCES public.students(id) ON DELETE CASCADE;

-- 2. Crear índice para mejorar búsquedas
CREATE INDEX IF NOT EXISTS idx_enrollment_grades_student_id ON public.enrollment_grades(student_id);

-- 3. Llenar datos existentes (si hay)
UPDATE public.enrollment_grades eg
SET student_id = e.student_id
FROM public.enrollments e
WHERE eg.enrollment_id = e.id AND eg.student_id IS NULL;

-- 4. Crear trigger para que se llene automáticamente en nuevas inserciones
CREATE OR REPLACE FUNCTION public.fill_enrollment_grades_student_id()
RETURNS TRIGGER AS $$
BEGIN
  SELECT student_id INTO NEW.student_id
  FROM public.enrollments
  WHERE id = NEW.enrollment_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enrollment_grades_student_id_trigger ON public.enrollment_grades;

CREATE TRIGGER enrollment_grades_student_id_trigger
BEFORE INSERT ON public.enrollment_grades
FOR EACH ROW
EXECUTE FUNCTION public.fill_enrollment_grades_student_id();
```

## Opción 2: Sin Modificar BD (Cambiar el Hook)

Si no quieres modificar la base de datos, cambia el hook para hacer un JOIN.

Pero **Opción 1 es mejor** porque:
- ✅ Las notificaciones se envían automáticamente
- ✅ Más rápido (sin JOINs complejos)
- ✅ RLS más fácil
- ✅ Mejor para suscripciones en tiempo real

---

## ¿Cuál Usar?

**Recomendado: Opción 1** (agregar columna + trigger)

Solo copia todo el SQL de arriba, pégalo en Supabase SQL Editor y ejecuta.

Luego las notificaciones de calificaciones funcionarán automáticamente.
