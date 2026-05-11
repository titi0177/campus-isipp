## 🚨 SOLUCIÓN: EJECUTAR MIGRATION EN SUPABASE

La migración SQL NO se ejecutó automáticamente en Supabase.

**Error:** `Could not find the function public.auto_enroll_students_by_year`

---

## 🔧 PASOS PARA ARREGLARLO

### 1. Ve a Supabase SQL Editor
```
URL: https://app.supabase.com/project/nubtgvweebyqmjrshtnz/sql
```

### 2. Copia TODO el código de abajo (o lee el archivo)

Archivo: `supabase/migrations/20260424000002_auto_enroll_historic_students.sql`

### 3. Pega en SQL Editor y ejecuta

El código crea 2 funciones:
- `auto_enroll_students_by_year()` - Inscribe todos
- `auto_enroll_single_student(uuid)` - Inscribe uno

### 4. Si ves ✅ "Query successful", está listo

---

## 📋 CÓDIGO A EJECUTAR

Copia y pega TODO esto en Supabase SQL Editor:

```sql
-- =============================================================================
-- Función para inscribir automáticamente a alumnos que no se inscribieron
-- =============================================================================

CREATE OR REPLACE FUNCTION public.auto_enroll_students_by_year(
  p_academic_year INTEGER DEFAULT NULL
)
RETURNS TABLE(
  student_id UUID,
  student_name TEXT,
  program_id UUID,
  year INTEGER,
  subjects_enrolled INTEGER,
  error_message TEXT
) AS $$
DECLARE
  v_current_year INTEGER := COALESCE(p_academic_year, EXTRACT(YEAR FROM NOW())::INTEGER);
  v_student RECORD;
  v_subjects_to_enroll UUID[];
  v_count_enrolled INTEGER;
  v_count_inserted INTEGER;
  v_error_msg TEXT;
BEGIN
  FOR v_student IN
    SELECT id, first_name, last_name, program_id, year
    FROM public.students
    WHERE status = 'active'
    ORDER BY year, last_name, first_name
  LOOP
    v_error_msg := NULL;
    v_count_enrolled := 0;
    v_count_inserted := 0;

    IF v_student.year = 2 THEN
      SELECT ARRAY_AGG(id)
      INTO v_subjects_to_enroll
      FROM public.subjects
      WHERE program_id = v_student.program_id
        AND year = 1;

    ELSIF v_student.year = 3 THEN
      SELECT ARRAY_AGG(id)
      INTO v_subjects_to_enroll
      FROM public.subjects
      WHERE program_id = v_student.program_id
        AND year IN (1, 2);
    END IF;

    IF v_subjects_to_enroll IS NOT NULL AND ARRAY_LENGTH(v_subjects_to_enroll, 1) > 0 THEN
      SELECT COUNT(*)
      INTO v_count_enrolled
      FROM public.enrollments
      WHERE student_id = v_student.id
        AND subject_id = ANY(v_subjects_to_enroll)
        AND academic_year = v_current_year;

      INSERT INTO public.enrollments (
        student_id,
        subject_id,
        academic_year,
        status,
        attempt_number
      )
      SELECT
        v_student.id,
        subject_id,
        v_current_year,
        'active',
        1
      FROM (
        SELECT UNNEST(v_subjects_to_enroll) AS subject_id
      ) subj
      WHERE NOT EXISTS (
        SELECT 1
        FROM public.enrollments e
        WHERE e.student_id = v_student.id
          AND e.subject_id = subj.subject_id
          AND e.academic_year = v_current_year
      )
      ON CONFLICT (student_id, subject_id, academic_year, attempt_number) DO NOTHING;

      GET DIAGNOSTICS v_count_inserted = ROW_COUNT;
    END IF;

    RETURN QUERY SELECT
      v_student.id,
      v_student.first_name || ' ' || v_student.last_name,
      v_student.program_id,
      v_student.year,
      v_count_enrolled + v_count_inserted,
      v_error_msg;
  END LOOP;

EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT
    v_student.id,
    v_student.first_name || ' ' || v_student.last_name,
    v_student.program_id,
    v_student.year,
    0,
    SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- Función para un estudiante específico
-- =============================================================================

CREATE OR REPLACE FUNCTION public.auto_enroll_single_student(
  p_student_id UUID,
  p_academic_year INTEGER DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_current_year INTEGER := COALESCE(p_academic_year, EXTRACT(YEAR FROM NOW())::INTEGER);
  v_student RECORD;
  v_subjects_to_enroll UUID[];
  v_count_enrolled INTEGER;
  v_count_inserted INTEGER;
BEGIN
  SELECT id, first_name, last_name, program_id, year
  INTO v_student
  FROM public.students
  WHERE id = p_student_id AND status = 'active';

  IF v_student IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Estudiante no encontrado o inactivo'
    );
  END IF;

  IF v_student.year = 2 THEN
    SELECT ARRAY_AGG(id)
    INTO v_subjects_to_enroll
    FROM public.subjects
    WHERE program_id = v_student.program_id AND year = 1;
  ELSIF v_student.year = 3 THEN
    SELECT ARRAY_AGG(id)
    INTO v_subjects_to_enroll
    FROM public.subjects
    WHERE program_id = v_student.program_id AND year IN (1, 2);
  END IF;

  IF v_subjects_to_enroll IS NULL OR ARRAY_LENGTH(v_subjects_to_enroll, 1) = 0 THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'No hay materias a inscribir para este año'
    );
  END IF;

  SELECT COUNT(*)
  INTO v_count_enrolled
  FROM public.enrollments
  WHERE student_id = v_student.id
    AND subject_id = ANY(v_subjects_to_enroll)
    AND academic_year = v_current_year;

  INSERT INTO public.enrollments (
    student_id,
    subject_id,
    academic_year,
    status,
    attempt_number
  )
  SELECT
    v_student.id,
    subject_id,
    v_current_year,
    'active',
    1
  FROM (SELECT UNNEST(v_subjects_to_enroll) AS subject_id) subj
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.enrollments e
    WHERE e.student_id = v_student.id
      AND e.subject_id = subj.subject_id
      AND e.academic_year = v_current_year
  )
  ON CONFLICT (student_id, subject_id, academic_year, attempt_number) DO NOTHING;

  GET DIAGNOSTICS v_count_inserted = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Inscripción completada',
    'student_name', v_student.first_name || ' ' || v_student.last_name,
    'year', v_student.year,
    'already_enrolled', v_count_enrolled,
    'newly_enrolled', v_count_inserted,
    'total_enrolled', v_count_enrolled + v_count_inserted
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'message', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- Permisos
-- =============================================================================

GRANT EXECUTE ON FUNCTION public.auto_enroll_students_by_year(INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.auto_enroll_single_student(UUID, INTEGER) TO authenticated, anon;

-- Comentarios
COMMENT ON FUNCTION public.auto_enroll_students_by_year(INTEGER) 
IS 'Inscribe automáticamente a todos los alumnos de 2° y 3° en materias de años anteriores, sin duplicar';

COMMENT ON FUNCTION public.auto_enroll_single_student(UUID, INTEGER) 
IS 'Inscribe automáticamente a un alumno específico en materias de años anteriores, sin duplicar';
```

---

## ✅ DESPUÉS DE EJECUTAR

### Verifica que funcionó

En SQL Editor, ejecuta:

```sql
SELECT * FROM public.auto_enroll_students_by_year();
```

Deberías ver una tabla con:
- student_id
- student_name
- year
- subjects_enrolled
- error_message

---

### Luego recarga el panel admin

1. Ve a `/admin`
2. Baja a "Auto-Inscripción de Estudiantes"
3. Haz clic "Ejecutar Auto-Inscripción"
4. Ahora debería funcionar

---

## 🔄 SI NO FUNCIONA

**Error: "function already exists"**
→ Es normal, significa que la función ya existía
→ Se reemplazó correctamente
→ Continúa

**Error: "syntax error"**
→ Verifica que copiaste TODO el código
→ No falten comillas o paréntesis
→ Intenta de nuevo

**Panel admin sigue sin funcionar**
→ Recarga la página (F5)
→ Borra caché del navegador (Ctrl+Shift+Delete)
→ Intenta en pestaña privada

---

## 📞 UBICACIÓN DEL ARCHIVO

Si prefieres copiar desde archivo:

```
supabase/migrations/20260424000002_auto_enroll_historic_students.sql
```

O ejecuta manualmente:
```
supabase/scripts/auto-enroll-manual.sql (Opción A)
```

