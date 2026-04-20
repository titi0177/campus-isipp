# 🎯 Guía Completa: Gestión de Desaprobados y Recursión

## ¿Qué cambios se hicieron?

### Frontend (Ya están en Vercel):
✅ Nuevo tab: **"🔄 Desaprobados"** en Carga de Calificaciones
✅ Componente: `ProfessorDisapprovedManagement` - permite reinscribir recursantes
✅ Desaprobados se ocultan de "Carga de Notas" y "Asistencia"
✅ Solo Regular aparece en "Notas Finales"

### Backend (Requiere ejecución en Supabase):
⏳ Tabla `enrollment_recursions` - rastrear reinscripciones
⏳ Columnas en `enrollments`: `attempt_number`, `is_recursive`, `completed_at`
⏳ Función `create_recursive_enrollment()` - crear inscripción como 2do intento
⏳ Triggers mejorados - actualizar automáticamente estados

---

## 🚀 PASOS A EJECUTAR EN SUPABASE

### PASO 1: Ir a Supabase SQL Editor
1. Ve a https://app.supabase.com
2. Selecciona tu proyecto: **campus-isipp**
3. En el menú lateral → **SQL Editor** (o **SQL**)
4. Haz clic en **+ New Query** o **New**

### PASO 2: Copiar y ejecutar la primera migración (AUTO-PASAR NOTA FINAL)
**Archivo:** `EJECUTAR_EN_SUPABASE.sql`

1. Abre el archivo `EJECUTAR_EN_SUPABASE.sql` 
2. Copia TODO el contenido
3. Pégalo en Supabase SQL Editor
4. Haz clic en **Play** (▶️) o presiona `Ctrl+Enter`
5. Espera a que termine ✅

### PASO 3: Copiar y ejecutar la segunda migración (DESAPROBADOS Y RECURSIÓN)
**Archivo:** `supabase/migrations/20250420_desaprobados_recursion.sql`

1. Abre el archivo desde el proyecto
2. Copia TODO el contenido
3. Crea una NUEVA query en Supabase SQL Editor
4. Pégalo
5. Haz clic en **Play** (▶️)
6. Espera a que termine ✅

---

## ✅ VERIFICAR QUE FUNCIONÓ

Ejecuta estas queries en Supabase SQL Editor para confirmar:

### Query 1: Ver desaprobados completados
```sql
SELECT 
  COUNT(*) as total_desaprobados,
  SUM(CASE WHEN final_grade IS NOT NULL THEN 1 ELSE 0 END) as con_nota_final_asignada
FROM public.enrollment_grades
WHERE final_status = 'desaprobado';
```
Deberías ver números > 0

### Query 2: Ver tabla de recursiones
```sql
SELECT COUNT(*) as total_recursiones
FROM public.enrollment_recursions;
```
Debería ver al menos una fila

### Query 3: Ver estructura de tabla enrollments
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'enrollments'
AND column_name IN ('attempt_number', 'is_recursive', 'completed_at')
ORDER BY column_name;
```
Debería mostrar las 3 columnas nuevas

---

## 🎯 FLUJO OPERATIVO DESPUÉS DE LAS MIGRACIONES

### Cuando un alumno obtiene Desaprobado (<6):

1. **Automáticamente**:
   - ✅ Su nota parcial se copia como nota final
   - ✅ Desaparece de "Carga de Notas Parciales"
   - ✅ Desaparece de "Asistencia"
   - ✅ Aparece en tab "🔄 Desaprobados"
   - ✅ Su status en `enrollments` cambia a "desaprobado"

2. **El profesor**:
   - Ve la lista de desaprobados en el tab "🔄 Desaprobados"
   - Presiona el botón "Reinscribir"
   - Se crea automáticamente una nueva inscripción como 2do intento
   - Se registra en tabla `enrollment_recursions`

3. **El alumno**:
   - Aparece como nuevo enrollment con `attempt_number = 2`
   - Aparece con `is_recursive = TRUE`
   - Puede cargar notas nuevamente en el próximo ciclo
   - Conserva su histórico del primer intento

---

## 📋 EJEMPLO DE CASOS

### Caso 1: Promedio 4.5 (Desaprobado)
```
Carga: Nota1=4, Nota2=5, Nota3=4 → Promedio: 4.3
Estado: Desaprobado (✗)
Auto-asignado: final_grade = 4.3, final_status = "desaprobado"
Acción: Aparece en tab "Desaprobados" para reinscribir
```

### Caso 2: Promedio 6.5 (Regular)
```
Carga: Nota1=7, Nota2=6, Nota3=7 → Promedio: 6.7
Estado: Regular (⚬)
Acción: Aparece en tab "Notas Finales" para examen
No desaparece, espera nota final del examen
```

### Caso 3: Promedio 8.5 (Promocionado)
```
Carga: Nota1=9, Nota2=8, Nota3=9 → Promedio: 8.7
Estado: Promocionado (✅)
Auto-asignado: final_grade = 8.7, final_status = "promocionado"
Acción: Finalizado automáticamente, no aparece en Desaprobados
```

---

## ⚠️ SI ALGO SALE MAL

### Error: "Column does not exist"
**Solución**: Ejecuta primero la migración `20250420_desaprobados_recursion.sql`

### No veo el tab "Desaprobados"
**Solución**: Recarga la página del navegador (F5) o borra caché (Ctrl+Shift+R)

### El botón "Reinscribir" no funciona
**Solución**: Verifica que se ejecutó bien el SQL de migración

### Los desaprobados siguen en "Carga de Notas"
**Solución**: El trigger no se ejecutó. Ejecuta manualmente:
```sql
UPDATE public.enrollments SET status = 'desaprobado'
WHERE id IN (
  SELECT eg.enrollment_id 
  FROM public.enrollment_grades eg
  WHERE eg.final_status = 'desaprobado'
);
```

---

## 📞 SOPORTE

Si necesitas ayuda:
1. Verifica que ejecutaste AMBAS migraciones
2. Ejecuta las queries de verificación arriba
3. Revisa los messages de error en Supabase
4. Contacta al administrador con el mensaje de error

---

## 📦 ARCHIVOS RELACIONADOS

- `EJECUTAR_EN_SUPABASE.sql` - Migración 1: Auto-pasar nota final
- `supabase/migrations/20250420_desaprobados_recursion.sql` - Migración 2: Desaprobados
- `src/components/ProfessorDisapprovedManagement.tsx` - Componente UI
- `src/routes/professor/grades.tsx` - Tab "Desaprobados"
