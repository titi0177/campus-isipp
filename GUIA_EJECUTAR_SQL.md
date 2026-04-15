# 📋 GUÍA PASO A PASO: EJECUTAR SCRIPT SQL EN SUPABASE

## 🎯 Objetivo
Ejecutar el script SQL para crear divisiones A y B en primer año.

---

## 📱 PASO 1: Acceder a Supabase

1. Ve a **https://app.supabase.com**
2. Inicia sesión con tu cuenta
3. Selecciona tu proyecto **campus-isipp**

---

## 🔧 PASO 2: Ir a SQL Editor

1. En el menú izquierdo, haz clic en **SQL Editor**
2. Se abrirá el editor de SQL

```
SUPABASE DASHBOARD
├─ 📊 Projects
├─ 🗄️ Databases
├─ 📝 SQL Editor ← AQUÍ
├─ 🔐 Authentication
└─ ...
```

---

## 📋 PASO 3: Copiar el Script SQL

### Opción A: Desde archivo (Recomendado)

1. Abre el archivo `SCRIPT_SQL_DIVISIONES.sql` desde el repositorio
2. Copia TODO el contenido (Ctrl+A, Ctrl+C)

### Opción B: Copiar código directamente

Copia este código:

```sql
-- DIVISIONES A Y B PARA PRIMER AÑO

-- 1. Agregar columna 'division' a subjects
ALTER TABLE public.subjects
ADD COLUMN IF NOT EXISTS division TEXT CHECK (division IN ('A', 'B', NULL));

-- 2. Crear índice en subjects
CREATE INDEX IF NOT EXISTS idx_subjects_division_year 
ON public.subjects(year, division) 
WHERE division IS NOT NULL;

-- 3. Agregar columna 'division' a enrollments
ALTER TABLE public.enrollments
ADD COLUMN IF NOT EXISTS division TEXT CHECK (division IN ('A', 'B', NULL));

-- 4. Crear índice en enrollments
CREATE INDEX IF NOT EXISTS idx_enrollments_division 
ON public.enrollments(subject_id, division) 
WHERE division IS NOT NULL;

-- 5. Actualizar constraint UNIQUE
ALTER TABLE public.enrollments
DROP CONSTRAINT IF EXISTS enrollments_student_subject_year_semester_key;

ALTER TABLE public.enrollments
ADD CONSTRAINT enrollments_unique_per_division 
UNIQUE (student_id, subject_id, year, semester, division);

-- 6. Agregar comentarios
COMMENT ON COLUMN public.subjects.division 
IS 'División A o B (solo para materias de año 1). NULL para otros años.';

COMMENT ON COLUMN public.enrollments.division 
IS 'División A o B en la que se inscribió el alumno (solo para materias de año 1). NULL para otros años.';
```

---

## 🔨 PASO 4: Pegar el Script en Supabase

1. En el editor SQL de Supabase, haz clic en el área de texto
2. Pega el código: **Ctrl+V**
3. Verás algo como esto:

```
┌─ SQL EDITOR ────────────────────────┐
│                                     │
│ -- DIVISIONES A Y B...             │
│ ALTER TABLE public.subjects        │
│ ADD COLUMN IF NOT EXISTS division  │
│ TEXT CHECK (division IN ('A', 'B')│
│                                     │
│ [Run] [Save] [Format]              │
└─────────────────────────────────────┘
```

---

## ▶️ PASO 5: Ejecutar el Script

### Opción A: Ejecutar TODO
1. Haz clic en el botón **[Run]** (esquina superior derecha)
2. O presiona: **Ctrl+Enter**

### Opción B: Ejecutar línea por línea (Si hay problemas)
1. Selecciona las primeras líneas
2. Haz clic en **[Run]**
3. Si no hay error, continúa con las siguientes

---

## ✅ PASO 6: Verificar Ejecución

### Señal de éxito ✅

Verás un mensaje como:

```
Query succeeded
Execution time: 45ms
Rows affected: 0 (es normal para ALTER TABLE)
```

### En caso de error ❌

Si ves algo como:

```
ERROR: column "division" already exists
```

**No es problema** - significa que la columna ya existe. El script usa `IF NOT EXISTS` así que es seguro re-ejecutar.

---

## 🔍 PASO 7: Verificar que todo se creó correctamente

### Opción A: Desde Supabase UI

1. Ve a **Table Editor**
2. Haz clic en tabla **subjects**
3. Verifica que existe columna **division**
4. Repite para tabla **enrollments**

### Opción B: Ejecutar script de verificación

Copia y ejecuta esto en SQL Editor:

```sql
-- Ver columnas en subjects
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'subjects' AND column_name = 'division';

-- Ver columnas en enrollments
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'enrollments' AND column_name = 'division';

-- Ver índices
SELECT indexname 
FROM pg_indexes 
WHERE tablename IN ('subjects', 'enrollments') 
AND indexname LIKE '%division%';
```

**Resultado esperado:**
```
| column_name | data_type | is_nullable |
|-------------|-----------|-------------|
| division    | text      | YES         |
```

---

## 🎉 ¡COMPLETADO!

Si todos los pasos fueron exitosos, tu base de datos ahora tiene:

✅ Columna `division` en `subjects`
✅ Columna `division` en `enrollments`
✅ Índices optimizados
✅ Constraints UNIQUE mejorados
✅ Comentarios en columnas

---

## 🐛 Troubleshooting

### ❌ "Error: constraint already exists"

**Solución:** Es normal. El script usa `IF NOT EXISTS` así que es seguro.

### ❌ "Error: syntax error"

**Solución:** Verifica que copiaste TODO el código sin errores de formato.

### ❌ "Error: permission denied"

**Solución:** Asegúrate de que tienes permisos de admin en Supabase.

### ❌ No aparecen las columnas

**Solución:**
1. Recarga la página (F5)
2. Espera unos segundos
3. Recarga el Table Editor

---

## 📞 Próximos Pasos

Una vez ejecutado este script:

1. **En la aplicación:**
   - Ir a Admin → Materias
   - Crear materia de año 1 con División A o B
   - Debe funcionar correctamente

2. **Si no funciona:**
   - Recarga la aplicación (Ctrl+F5)
   - Borra cache (Ctrl+Shift+Del)
   - Contacta al soporte

---

## 📋 Checklist

- [ ] Accedí a Supabase
- [ ] Abrí SQL Editor
- [ ] Copié el script SQL
- [ ] Pegué en el editor
- [ ] Ejecuté el script (clic en Run)
- [ ] Verificar éxito (Query succeeded)
- [ ] Verifiqué que existen las columnas
- [ ] Testeé en la aplicación

---

**¡Listo! El script SQL ha sido ejecutado correctamente.** ✅
