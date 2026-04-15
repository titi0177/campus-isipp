# ⚡ EJECUTAR SCRIPT SQL - INSTRUCCIONES RÁPIDAS

## 🎯 Objetivo
Agregar divisiones A y B a tu base de datos de Supabase

---

## ⏱️ Tiempo: 2 minutos

---

## 📋 SCRIPT SQL PARA COPIAR-PEGAR

Copia TODO esto:

```sql
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS division TEXT CHECK (division IN ('A', 'B', NULL));

CREATE INDEX IF NOT EXISTS idx_subjects_division_year ON public.subjects(year, division) WHERE division IS NOT NULL;

ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS division TEXT CHECK (division IN ('A', 'B', NULL));

CREATE INDEX IF NOT EXISTS idx_enrollments_division ON public.enrollments(subject_id, division) WHERE division IS NOT NULL;

ALTER TABLE public.enrollments DROP CONSTRAINT IF EXISTS enrollments_student_subject_year_semester_key;

ALTER TABLE public.enrollments ADD CONSTRAINT enrollments_unique_per_division UNIQUE (student_id, subject_id, year, semester, division);

COMMENT ON COLUMN public.subjects.division IS 'División A o B (solo para materias de año 1). NULL para otros años.';

COMMENT ON COLUMN public.enrollments.division IS 'División A o B en la que se inscribió el alumno (solo para materias de año 1). NULL para otros años.';
```

---

## 🚀 PASOS PARA EJECUTAR

### 1. Acceder a Supabase
```
Abre: https://app.supabase.com
Login → Selecciona proyecto: campus-isipp
```

### 2. Abrir SQL Editor
```
Menú izquierdo → SQL Editor
```

### 3. Pegar Script
```
1. Haz clic en el área blanca
2. Presiona: Ctrl+A (selecciona todo)
3. Presiona: Ctrl+V (pega el script)
```

### 4. Ejecutar
```
Haz clic: [Run]
O presiona: Ctrl+Enter
```

### 5. Esperar resultado
```
✅ Verás: "Query succeeded"
✅ Tiempo: ~45ms
✅ Rows affected: 0 (es normal)
```

---

## ✅ VERIFICAR QUE FUNCIONÓ

### Opción A: Visual (Fácil)
```
1. Haz clic: Table Editor
2. Selecciona tabla: subjects
3. Busca columna: division ✅
4. Repite con tabla: enrollments ✅
```

### Opción B: SQL (Técnico)
```
En SQL Editor, pega y ejecuta:

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name IN ('subjects', 'enrollments')
AND column_name = 'division';

Resultado esperado: 2 filas
```

---

## 🎉 ¡LISTO!

Ahora puedes usar:
- ✅ Crear materias año 1 con División A o B
- ✅ Inscribir alumnos en divisiones
- ✅ Cargar notas por división
- ✅ Registrar asistencia por división

---

## ❌ Si algo falla

### "Error: column already exists"
→ No hay problema, ya estaba. El script es seguro re-ejecutar.

### "Error: syntax error"
→ Verifica que copiaste TODO el código correctamente
→ Intenta copiar desde: SCRIPT_SQL_COPIAR_PEGAR.sql

### "Las columnas no aparecen"
→ Recarga la página (F5)
→ Espera 10 segundos
→ Abre Table Editor nuevamente

---

## 📁 Archivos disponibles

- **SCRIPT_SQL_COPIAR_PEGAR.sql** - El script que acabas de copiar
- **GUIA_VISUAL_SQL.md** - Guía paso a paso con diagramas
- **GUIA_EJECUTAR_SQL.md** - Guía detallada completa

---

**¡Listo! Tu base de datos tiene divisiones.** ✅
