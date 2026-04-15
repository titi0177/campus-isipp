# Guía de Prueba - Divisiones A y B en Primer Año

## Cambios Implementados

### 1. Base de Datos
- ✅ Columna `division` agregada a `subjects`
- ✅ Columna `division` agregada a `enrollments`
- ✅ Índices para búsquedas rápidas
- ✅ Constraint UNIQUE por (student, subject, year, semester, division)

### 2. Frontend - Admin Materias
- ✅ Campo "División" visible en modal de creación/edición
- ✅ Solo habilitado cuando Año = 1
- ✅ Columna "División" en tabla de materias

### 3. Frontend - Admin Inscripciones
- ✅ Selector de División A/B al inscribir
- ✅ Solo habilitado para materias de año 1
- ✅ Validación: no permite inscripciones duplicadas por división
- ✅ Columna "División" en tabla de inscripciones

### 4. Frontend - Profesor Notas
- ✅ Selector de División (solo para materias año 1)
- ✅ Opción: ver ambas divisiones o filtrar por una
- ✅ Tabla muestra división de cada alumno
- ✅ Guardado de notas separado por división

### 5. Frontend - Profesor Asistencia
- ✅ Selector de División (solo para materias año 1)
- ✅ Opción: ver ambas divisiones o filtrar por una
- ✅ Tabla muestra división en columna separada
- ✅ PDF descargado incluye información de división

## Pasos de Prueba

### Paso 1: Crear Materias de Primer Año con Divisiones
1. Ir a Admin → Materias
2. Nueva Materia
   - Nombre: "Algoritmos Div. A"
   - Código: "ALG-A"
   - Año: **1**
   - División: **A**
   - Profesor: seleccionar uno
3. Guardar
4. Repetir con "Algoritmos Div. B" (División B)
5. Crear otra materia de año 1 SIN división (para verificar que no aparezca selector)

### Paso 2: Crear Materias de Otros Años
1. Nueva Materia
   - Nombre: "Base de Datos"
   - Código: "BD"
   - Año: **2**
   - División: (no debe permitir seleccionar)
2. Guardar - verificar que no tenga división

### Paso 3: Inscribir Estudiantes con Divisiones
1. Ir a Admin → Inscripciones
2. Nueva Inscripción
   - Estudiante: seleccionar uno
   - Materia: "Algoritmos Div. A" (año 1)
   - División: **A** (debe estar habilitado)
   - Año lectivo: 2024
3. Guardar
4. Nueva Inscripción - mismo estudiante
   - Materia: "Algoritmos Div. B"
   - División: **B**
5. Guardar
6. Nueva Inscripción - intentar inscribir al mismo estudiante en "Algoritmos Div. A" División A de nuevo
   - Debe mostrar error: "Este alumno ya está inscripto en esta materia/división en este año"

### Paso 4: Verificar Tabla de Inscripciones
- Columna "División" debe mostrar:
  - "A" para inscripciones en división A
  - "B" para inscripciones en división B
  - "-" para materias sin división

### Paso 5: Profesor - Carga de Notas
1. Login como profesor
2. Ir a Profesor → Carga de Calificaciones
3. Seleccionar materia de año 1 (ej: Algoritmos)
4. Debe aparecer selector "División (Año 1)"
5. Seleccionar "División A"
   - Deben aparecer SOLO alumnos inscritos en División A
   - Cargar notas para 1-2 alumnos
   - Guardar
6. Seleccionar "División B"
   - Deben aparecer SOLO alumnos inscritos en División B
   - Cargar notas diferentes
   - Guardar
7. Seleccionar "Ver ambas divisiones"
   - Deben aparecer todos los alumnos con columna de División visible
8. Seleccionar materia de año 2+
   - No debe aparecer selector de División

### Paso 6: Profesor - Control de Asistencia
1. Ir a Profesor → Control de Asistencia
2. Seleccionar materia de año 1 (ej: Algoritmos)
3. Debe aparecer selector "División (Año 1)"
4. Seleccionar "División A"
   - SOLO alumnos de División A
5. Marcar asistencia para un mes
6. Guardar
7. Cambiar a "División B"
   - SOLO alumnos de División B
   - Marcar asistencia diferente
8. Guardar
9. Cambiar a "Ver ambas divisiones"
   - Todos con columna División visible
10. Descargar PDF
    - Debe incluir información de división

## Criterios de Éxito

- ✅ Materias de año 1 pueden tener División A o B
- ✅ Materias de otros años NO pueden tener división
- ✅ Un alumno puede inscribirse en División A y División B de la misma materia
- ✅ No se puede inscribir dos veces en la misma división
- ✅ Profesores ven notas/asistencia separadas por división
- ✅ PDFs incluyen información de división
- ✅ Build sin errores
- ✅ Subido a Vercel correctamente

## Notas

- Ejecutar migración SQL en Supabase si es primera vez
- Las migraciones están en `supabase/migrations/add_divisions.sql`
- Para Vercel: asegurarse de que webhook de Supabase ejecute migraciones automáticamente
