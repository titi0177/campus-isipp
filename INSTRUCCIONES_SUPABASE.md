# 🔧 Instrucciones: Ejecutar Migración en Supabase

## Problema
Los cambios de calificaciones no se están reflejando en el dashboard. Necesitamos ejecutar una migración SQL en Supabase para:
1. Auto-pasar nota final cuando el estado es Desaprobado o Promocionado
2. Actualizar los triggers para reflejar cambios en el enrollment
3. Sincronizar el estado de los alumnos

## Solución: Ejecutar SQL en Supabase

### Paso 1: Ir a Supabase
1. Ve a https://app.supabase.com
2. Selecciona tu proyecto `campus-isipp`
3. En el menú lateral, haz clic en **SQL Editor** (o **SQL**)

### Paso 2: Crear una nueva query
1. Haz clic en **New Query** o **+ New**
2. Se abrirá un editor de SQL en blanco

### Paso 3: Copiar el código
1. Abre el archivo `EJECUTAR_EN_SUPABASE.sql` en tu proyecto
2. Copia TODO el contenido (desde `--` hasta el final)

### Paso 4: Ejecutar
1. Pega el código en el editor de Supabase
2. Haz clic en el botón **Play** (▶️) en la esquina superior derecha
   - O presiona `Ctrl + Enter` (Windows/Linux) o `Cmd + Enter` (Mac)
3. Espera a que termine (debería decir "Success")

### Paso 5: Verificar los cambios
Después de ejecutar, puedes verificar que funcionó:

En el SQL Editor, ejecuta esta query:
```sql
SELECT 
  COUNT(*) as total_registros,
  SUM(CASE WHEN final_grade IS NOT NULL THEN 1 ELSE 0 END) as con_nota_final,
  SUM(CASE WHEN final_status IS NOT NULL THEN 1 ELSE 0 END) as con_estado_final
FROM public.enrollment_grades
WHERE partial_status IN ('desaprobado', 'promocionado');
```

Deberías ver que `con_nota_final` y `con_estado_final` tienen números mayores a 0.

### Paso 6: Refrescar el navegador
1. Ve a tu aplicación (el dashboard)
2. Presiona `F5` o `Ctrl+R` para refrescar completamente
3. Ve a "Carga de Calificaciones" > "Notas Finales (Regulares)"
4. Verifica que:
   - ✅ Solo aparecen alumnos con estado "Regular"
   - ✅ Los Desaprobados y Promocionados desaparecieron de esa sección
   - ✅ Están en el Historial de Aprobados con nota final

## ¿Qué hace la migración?

| Acción | Descripción |
|--------|-------------|
| 🔧 Trigger mejorado | Actualiza automáticamente el estado del alumno cuando cambia la calificación |
| 📝 Auto-pasar nota final | Si promedio es Desaprobado o Promocionado, automáticamente se asigna como nota final |
| 📊 Sincronizar datos | Actualiza la tabla `enrollments` para reflejar el nuevo estado |

## Si algo sale mal

Si ves un error, intenta:
1. Copiar y pegar SOLO el código de "PASO 1" primero
2. Ejecutar por pasos (PASO 2, PASO 3, etc.) en queries separadas
3. Si persiste, contacta al administrador con el mensaje de error

## Resultado esperado

Después de ejecutar:
- Los alumnos con promedio Desaprobado (<6) tendrán `final_grade` = `partial_grade` y `final_status` = "desaprobado"
- Los alumnos con promedio Promocionado (≥8) tendrán `final_grade` = `partial_grade` y `final_status` = "promocionado"
- Los alumnos con promedio Regular (6-7) permanecerán en la sección de Notas Finales
- El dashboard se actualizará automáticamente
