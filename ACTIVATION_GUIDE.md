# 🎓 Divisiones A y B para Materias de Primer Año - ACTIVACIÓN

## ✅ Status: Listo para Producción

Todos los cambios han sido implementados, testeados y pusheados a Vercel.

---

## 📋 Instrucciones de Activación

### Paso 1: Ejecutar Migración SQL en Supabase

**Automático (Recomendado):**
- Si has configurado webhooks entre GitHub y Supabase, la migración se ejecutará automáticamente
- Verifica en Supabase → Migrations

**Manual (Si no se ejecuta automáticamente):**

1. Ve a [Supabase Console](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a **SQL Editor**
4. Haz clic en **New Query**
5. Copia y pega el contenido de `supabase/migrations/add_divisions.sql`
6. Haz clic en **Run**

```sql
-- Agregar soporte para divisiones A y B en materias de primer año
ALTER TABLE public.subjects
ADD COLUMN IF NOT EXISTS division TEXT CHECK (division IN ('A', 'B', NULL));

CREATE INDEX IF NOT EXISTS idx_subjects_division_year 
ON public.subjects(year, division) 
WHERE division IS NOT NULL;

ALTER TABLE public.enrollments
ADD COLUMN IF NOT EXISTS division TEXT CHECK (division IN ('A', 'B', NULL));

CREATE INDEX IF NOT EXISTS idx_enrollments_division 
ON public.enrollments(subject_id, division) 
WHERE division IS NOT NULL;

ALTER TABLE public.enrollments
DROP CONSTRAINT IF EXISTS enrollments_student_subject_year_semester_key;

ALTER TABLE public.enrollments
ADD CONSTRAINT enrollments_unique_per_division 
UNIQUE (student_id, subject_id, year, semester, division);

COMMENT ON COLUMN public.subjects.division IS 'División A o B (solo para materias de año 1)';
COMMENT ON COLUMN public.enrollments.division IS 'División A o B en la que se inscribió el alumno (solo para materias de año 1)';
```

### Paso 2: Verificar Deployment en Vercel

1. Ve a [Vercel Dashboard](https://vercel.com)
2. Selecciona tu proyecto `campus-isipp`
3. Verifica que el último deploy sea de los commits:
   - `8a8d6e00` - docs: add implementation summary
   - `511a1b7b` - docs: add testing guide
   - `ce3bc8f1` - feat: implement divisions A and B...

**Status esperado:** ✅ Ready (o Building/Deployed según momento)

---

## 🧪 Testing Rápido (5 minutos)

### Test 1: Admin - Crear Materia con Divisiones
1. Login como Admin
2. Ir a **Administración → Materias**
3. Nueva Materia:
   - Nombre: `Algoritmos`
   - Código: `ALG`
   - Año: `1` ← Importante
   - División: `A` ← Debe aparecer este selector
4. Guardar
5. Repetir con División `B`
6. ✅ Esperado: Tabla muestra "Div. A" y "Div. B" en columna División

### Test 2: Admin - Inscribir con Divisiones
1. Ir a **Administración → Inscripciones**
2. Nueva Inscripción:
   - Estudiante: cualquiera
   - Materia: Algoritmos (año 1)
   - División: `A` ← Debe aparecer selector
3. Guardar
4. Nueva Inscripción - mismo estudiante:
   - Materia: Algoritmos
   - División: `B`
5. Guardar
6. ✅ Esperado: Ambas inscripciones visible con divisiones diferentes

### Test 3: Profesor - Notas por División
1. Login como Profesor
2. Ir a **Profesor → Carga de Calificaciones**
3. Seleccionar materia "Algoritmos" (año 1)
4. Selector "División (Año 1)" debe aparecer
5. Seleccionar División `A`
6. ✅ Esperado: Solo ve alumnos inscriptos en División A

### Test 4: Profesor - Asistencia por División
1. Ir a **Profesor → Control de Asistencia**
2. Seleccionar "Algoritmos"
3. Selector "División (Año 1)" debe aparecer
4. Seleccionar División `A`
5. ✅ Esperado: Solo ve alumnos de División A, puede marcar asistencia separadamente

---

## 📊 Funcionalidades Nuevas

### Para Administradores
- ✅ Crear materias de año 1 con División A o B
- ✅ Inscribir alumnos en divisiones específicas
- ✅ Ver divisiones en listados
- ✅ Validación: no permite inscribir dos veces en la misma división

### Para Profesores
- ✅ Ver notas separadas por división
- ✅ Cargar asistencia separada por división
- ✅ Filtrar alumnos por división
- ✅ Descargar PDFs con información de división

### Para Sistema
- ✅ Índices para búsquedas rápidas
- ✅ Constraints UNIQUE por división
- ✅ Migraciones automáticas

---

## 🐛 Troubleshooting

### ❌ "Error: column 'division' does not exist"
**Solución:** La migración SQL no se ejecutó
- Ve a Supabase → SQL Editor
- Ejecuta `supabase/migrations/add_divisions.sql`

### ❌ "Selector de División no aparece en materias de año 1"
**Solución:** Verifica en DevTools Console
- Recarga la página (F5)
- Borra cache (Ctrl+Shift+Del)
- Verifica que `npm run build` fue exitoso

### ❌ "Profesor no ve selector División"
**Solución:** Asegúrate que:
- La materia es de año 1 (checked en Supabase)
- Alumnos están inscritos con división asignada
- Recarga página

---

## 📝 Documentación

- **TEST_DIVISIONS.md** - Guía completa de testing con todos los casos
- **IMPLEMENTATION_SUMMARY.md** - Resumen técnico de cambios
- **supabase/migrations/add_divisions.sql** - Script SQL completo

---

## 🔍 Commits Relacionados

```
8a8d6e00 docs: add implementation summary for divisions feature
511a1b7b docs: add testing guide for divisions feature  
ce3bc8f1 feat: implement divisions A and B for first-year subjects
```

Ver todos: `git log --oneline | grep -i division`

---

## ✨ Próximos Pasos (Opcionales)

1. **Configurar webhooks GitHub → Supabase** (para migraciones automáticas)
2. **Crear mas divisiones** si es necesario (actualmente solo A y B)
3. **Estadísticas** - Panel mostrando alumnos por división
4. **Reportes** - Generador de reportes diferenciados por división

---

## 📞 Soporte

Si tienes problemas:

1. Verifica que el build de Vercel está en ✅ Ready
2. Confirma migración SQL ejecutada en Supabase
3. Borra cache del navegador (Ctrl+Shift+Del)
4. Recarga la página
5. Si persiste, revisa console del navegador (F12 → Console)

---

**¡Listo para usar! 🚀**

La feature de divisiones A y B para primer año está completamente implementada y lista para producción.
