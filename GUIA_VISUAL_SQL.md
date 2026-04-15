# 🚀 EJECUTAR SCRIPT SQL - GUÍA VISUAL

## PASO 1: Acceder a Supabase

```
┌────────────────────────────────────────────┐
│  📱 https://app.supabase.com               │
│                                            │
│  👤 Login → Selecciona tu cuenta           │
│  📁 Proyecto: campus-isipp                 │
└────────────────────────────────────────────┘
```

---

## PASO 2: Abrir SQL Editor

```
DASHBOARD SUPABASE
│
├── 🏠 Home
├── 📊 Projects  
├── 🔒 Authentication
├── 📊 Database
│   ├── 📋 Tables
│   ├── 🔍 Query
│   └── 📝 SQL Editor ← ¡AQUÍ!
├── 🔐 Auth
└── ...
```

**Haz clic en: SQL Editor**

---

## PASO 3: Copiar Script SQL

### 📋 OPCIÓN A: Archivo completo

1. Abre: **SCRIPT_SQL_DIVISIONES.sql**
2. Selecciona todo: **Ctrl+A**
3. Copia: **Ctrl+C**

### 📋 OPCIÓN B: Script corto (Recomendado para copiar-pegar)

1. Abre: **SCRIPT_SQL_COPIAR_PEGAR.sql**
2. Copia TODO el contenido

---

## PASO 4: Pegar en Supabase

```
┌──────────────────────────────────────────────────┐
│ SQL EDITOR                                       │
├──────────────────────────────────────────────────┤
│                                                  │
│  -- DIVISIONES A Y B                            │
│  ALTER TABLE public.subjects                    │
│  ADD COLUMN IF NOT EXISTS division              │
│  TEXT CHECK (division IN ('A', 'B', NULL));     │
│                                                  │
│  [Run] [Save] [Format] [Share]                  │
│                                                  │
└──────────────────────────────────────────────────┘

1️⃣ Haz clic en el área blanca (editor)
2️⃣ Pega: Ctrl+V
3️⃣ Verifica que el código aparezca completo
```

---

## PASO 5: Ejecutar Script

```
┌──────────────────────────────────────────────────┐
│ SQL EDITOR                                       │
├──────────────────────────────────────────────────┤
│  [⏹ Run] ← HAGO CLIC AQUÍ                       │
│  [Save] [Format] [Share]                        │
│                                                  │
│  -- DIVISIONES A Y B                            │
│  ALTER TABLE public.subjects...                 │
└──────────────────────────────────────────────────┘

O presiona: Ctrl+Enter
```

---

## PASO 6: Verificar Resultado

### ✅ ÉXITO

```
┌──────────────────────────────────────────────────┐
│ RESULTADO                                        │
├──────────────────────────────────────────────────┤
│ ✅ Query succeeded                              │
│                                                  │
│ Execution time: 45ms                            │
│ Rows affected: 0 (normal para ALTER TABLE)      │
│                                                  │
│ ✅ Script ejecutado correctamente               │
└──────────────────────────────────────────────────┘
```

### ❌ ERROR (No es problema)

```
┌──────────────────────────────────────────────────┐
│ ERROR                                            │
├──────────────────────────────────────────────────┤
│ ERROR: column "division" already exists          │
│                                                  │
│ → Significa que ya se ejecutó antes             │
│ → El script usa IF NOT EXISTS (es seguro)       │
│ → Puedes ejecutar de nuevo sin problema         │
└──────────────────────────────────────────────────┘
```

---

## PASO 7: Verificar que existen las columnas

### Opción A: Desde Supabase UI (Visual)

```
1. Haz clic en: Table Editor
2. Selecciona tabla: subjects
3. Busca columna: division ✅

4. Selecciona tabla: enrollments  
5. Busca columna: division ✅
```

### Opción B: Desde SQL (Técnico)

1. En SQL Editor, pega esto:

```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'subjects' AND column_name = 'division';
```

2. Haz clic en [Run]
3. Debe mostrar:

```
| column_name | data_type | is_nullable |
|-------------|-----------|-------------|
| division    | text      | true        |
```

---

## 🎯 RESULTADO FINAL

Una vez ejecutado el script:

```
✅ Tabla subjects
   └─ Nueva columna: division (A, B, NULL)

✅ Tabla enrollments  
   └─ Nueva columna: division (A, B, NULL)

✅ Índices creados
   ├─ idx_subjects_division_year
   └─ idx_enrollments_division

✅ Constraints actualizados
   └─ enrollments_unique_per_division

✅ Columnas documentadas
   ├─ subjects.division
   └─ enrollments.division
```

---

## 📱 Ahora puedes usar:

✅ **Admin → Materias**
  - Crear materia año 1 con División A o B

✅ **Admin → Inscripciones**
  - Inscribir alumnos con divisiones

✅ **Profesor → Calificaciones**
  - Cargar notas por división

✅ **Profesor → Asistencia**
  - Registrar asistencia por división

---

## 🆘 Si algo falla

### Problema: "Error de sintaxis"
**Solución:** 
- Abre: SCRIPT_SQL_COPIAR_PEGAR.sql
- Copia TODO nuevamente
- Asegúrate de copiar sin espacios extras

### Problema: "Columnas no aparecen"
**Solución:**
- Recarga la página: F5
- Espera 10 segundos
- Abre Table Editor
- Busca la columna division

### Problema: "Constraint error"
**Solución:**
- Es normal si se ejecutó antes
- El script es idempotente (seguro re-ejecutar)

### Problema: "Permission denied"
**Solución:**
- Verifica que tienes permisos de admin en Supabase
- Contacta al admin del proyecto

---

## ✅ Checklist de Confirmación

```
[ ] Accedí a https://app.supabase.com
[ ] Abrí SQL Editor
[ ] Copié el script SQL
[ ] Pegué en el editor
[ ] Hice clic en [Run]
[ ] Aparece "Query succeeded"
[ ] Verifiqué la columna division en subjects
[ ] Verifiqué la columna division en enrollments
[ ] Las funciones funcionan en la aplicación
```

---

**¡Listo! Tu base de datos ahora tiene divisiones A y B.** 🎉
