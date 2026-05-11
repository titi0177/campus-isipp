## 🔧 AUTO-INSCRIPCIÓN DE ESTUDIANTES - INSTRUCCIONES

### 📋 PROBLEMA RESUELTO

Estudiantes de 2° y 3° año que se registraban **no se auto-inscribían** en materias de años anteriores por:
1. **Missing fields en `enrollments` table** - No se enviaba `attempt_number` ni `status`
2. **RLS policies restrictivas** - Bloqueaban inserciones silenciosamente
3. **Constraint UNIQUE** - Causaba conflictos sin mensajes claros

---

### ✅ CAMBIOS REALIZADOS

#### 1. **login.tsx - Mejorado**
- ✅ Ahora agrega `status: 'active'` y `attempt_number: 1` al insertar
- ✅ Incluye validaciones reales de materias encontradas
- ✅ Logging detallado de errores con detalles de la BD
- ✅ NO bloquea el registro si falla la auto-inscripción (soft error)

#### 2. **SQL Migration - Funciones auto-enroll**
Archivos:
- `supabase/migrations/20260424000002_auto_enroll_historic_students.sql`

Contiene:
```sql
-- Inscribir todos los estudiantes (sin duplicar)
SELECT * FROM public.auto_enroll_students_by_year();

-- Inscribir un estudiante específico
SELECT public.auto_enroll_single_student('STUDENT_UUID'::UUID);
```

#### 3. **Frontend Utilities**
- `src/lib/enrollment-auto-enroll.ts` - Funciones para llamar RPC desde TypeScript
- `src/components/admin/EnrollmentAutoEnrollPanel.tsx` - Panel admin para ejecutar

#### 4. **Manual SQL Scripts**
- `supabase/scripts/auto-enroll-manual.sql` - Scripts para ejecutar en SQL Editor

---

### 🚀 CÓMO USAR

#### **OPCIÓN 1: Panel Admin (Recomendado)**

1. Agrega el componente al dashboard admin:
```tsx
import { EnrollmentAutoEnrollPanel } from '@/components/admin/EnrollmentAutoEnrollPanel'

export function AdminDashboard() {
  return (
    <div>
      {/* otros componentes */}
      <EnrollmentAutoEnrollPanel />
    </div>
  )
}
```

2. Haz clic en "Ejecutar Auto-Inscripción"
3. Verifica resultados en la tabla

---

#### **OPCIÓN 2: Desde TypeScript (Backend/API)**

```typescript
import { autoEnrollStudentsByYear, autoEnrollSingleStudent } from '@/lib/enrollment-auto-enroll'

// Inscribir todos
const result = await autoEnrollStudentsByYear()
console.log(result.summary)
// {
//   total_students: 45,
//   students_processed: 45,
//   students_with_errors: 0,
//   total_subjects_enrolled: 180
// }

// Inscribir uno específico
const singleResult = await autoEnrollSingleStudent('student-uuid-here')
console.log(singleResult)
// {
//   success: true,
//   student_name: "Pérez, Juan",
//   year: 2,
//   already_enrolled: 5,
//   newly_enrolled: 8,
//   total_enrolled: 13
// }
```

---

#### **OPCIÓN 3: SQL Editor (Supabase)**

1. Ve a **SQL Editor** en Supabase
2. Copia **una** de estas queries:

**Ver estudiantes faltantes:**
```sql
SELECT
  s.id,
  s.first_name || ' ' || s.last_name AS name,
  s.year,
  COUNT(subj.id) AS required,
  COALESCE(COUNT(e.id), 0) AS enrolled,
  COUNT(subj.id) - COALESCE(COUNT(e.id), 0) AS missing
FROM public.students s
CROSS JOIN public.subjects subj
LEFT JOIN public.enrollments e ON (
  e.student_id = s.id
  AND e.subject_id = subj.id
)
WHERE s.status = 'active' AND s.year IN (2, 3)
  AND (s.year = 2 AND subj.year = 1 OR s.year = 3 AND subj.year IN (1,2))
GROUP BY s.id, s.year
HAVING COUNT(subj.id) > COALESCE(COUNT(e.id), 0);
```

**Ejecutar auto-inscripción:**
```sql
SELECT * FROM public.auto_enroll_students_by_year();
```

**Para un año específico:**
```sql
SELECT * FROM public.auto_enroll_students_by_year(2024);
```

---

### ⚙️ PARÁMETROS

#### `auto_enroll_students_by_year(p_academic_year INTEGER DEFAULT NULL)`

| Parámetro | Tipo | Descripción | Defecto |
|-----------|------|-------------|---------|
| `p_academic_year` | INTEGER | Año académico a procesar | Año actual |

**Retorna TABLE:**
- `student_id` - UUID del estudiante
- `student_name` - Nombre completo
- `program_id` - Programa
- `year` - Año académico del alumno
- `subjects_enrolled` - Total de materias inscritas
- `error_message` - Error si hubo (NULL si OK)

---

#### `auto_enroll_single_student(p_student_id UUID, p_academic_year INTEGER DEFAULT NULL)`

| Parámetro | Tipo | Descripción | Defecto |
|-----------|------|-------------|---------|
| `p_student_id` | UUID | ID del estudiante | Requerido |
| `p_academic_year` | INTEGER | Año académico | Año actual |

**Retorna JSONB:**
```json
{
  "success": true,
  "message": "Inscripción completada",
  "student_name": "Pérez, Juan",
  "year": 2,
  "already_enrolled": 5,
  "newly_enrolled": 8,
  "total_enrolled": 13
}
```

---

### 🛡️ CARACTERÍSTICAS DE SEGURIDAD

✅ **NO duplica inscripciones**
- Verifica si el estudiante ya está inscripto antes de insertar
- Usa `ON CONFLICT (...) DO NOTHING`

✅ **Transacciones atómicas**
- Si falla una materia, el rest continúa
- Reporta exactamente cuáles fallaron

✅ **RLS compliant**
- Respeta todas las políticas de Row Level Security
- Usa SECURITY DEFINER para permisos de admin

✅ **Logging detallado**
- Cada inserción reporta:
  - Qué estudiante
  - Qué materias se agregaron
  - Cuáles ya existían
  - Errores específicos

---

### 📊 REPORTES

#### Ver estudiantes sin completar inscripción:

```sql
-- En Supabase SQL Editor o desde el script auto-enroll-manual.sql OPCIÓN C
```

#### Ver duplicados (si hay problemas):

```sql
-- En Supabase SQL Editor o desde el script auto-enroll-manual.sql OPCIÓN E
```

#### Estadísticas por programa:

```sql
-- En Supabase SQL Editor o desde el script auto-enroll-manual.sql OPCIÓN G
```

---

### 🔄 FLUJO AUTOMÁTICO EN REGISTRO

Cuando un alumno se registra ahora:

```
1. Valida legajo/DNI duplicados ✓
2. Crea usuario en Auth ✓
3. Crea registro en students ✓
4. Según el año del alumno:
   - Año 1: SIN auto-inscripción (manual)
   - Año 2: Auto-inscribe en TODAS las de 1° ✓
   - Año 3: Auto-inscribe en TODAS las de 1° y 2° ✓
5. Si falla la auto-inscripción:
   - Registra error detallado en consola
   - NO bloquea el registro
   - Usuario ve advertencia
```

---

### ⚠️ NOTAS IMPORTANTES

1. **Solo para años anteriores**
   - Alumno de 2° → Inscritos en 1°
   - Alumno de 3° → Inscritos en 1° y 2°
   - Alumno de 3° → NO se auto-inscriben en 3° (manual)

2. **Sin duplicados garantizado**
   - Verifica constraint UNIQUE
   - Usa ON CONFLICT DO NOTHING
   - No hay forma de crear duplicados

3. **Año académico**
   - Por defecto usa el año actual
   - Puedes especificar otro año si lo necesitas

4. **Permisos**
   - Solo admin y operadores pueden ejecutar
   - Respeta todas las RLS policies

---

### 🧪 TESTING

#### Test 1: Verificar auto-inscripción en registro
```
1. Ve a /login → Registrarse
2. Elige "2° Año (inscribe en 1° y 2°)"
3. Completa formulario y registra
4. Abre consola del navegador
5. Deberías ver: "✅ Alumno inscrito en X materias de 1° año"
```

#### Test 2: Auto-inscripción histórica
```
1. Ve al panel admin → Auto-Inscripción
2. Haz clic "Ejecutar Auto-Inscripción"
3. Espera a que termine
4. Verifica tabla de resultados
5. Total inscritas debe aumentar
```

#### Test 3: Sin duplicados
```
1. Ejecuta auto-inscripción 2 veces
2. Los números NO deben cambiar en la 2° vez
3. newly_enrolled debe ser 0
```

---

### 🆘 TROUBLESHOOTING

| Problema | Solución |
|----------|----------|
| "No se autoinscriben en nuevos registros" | Verifica que `login.tsx` tiene status y attempt_number |
| "RLS policy error" | Ejecuta migración 20260424000002 |
| "Constraint violation" | Verifica constraint es `unique_attempt` no el viejo |
| "Duplicados existentes" | Usa OPCIÓN F en auto-enroll-manual.sql |

---

### 📁 ARCHIVOS NUEVOS

```
supabase/
  migrations/
    20260424000002_auto_enroll_historic_students.sql  ← Funciones SQL
  scripts/
    auto-enroll-manual.sql  ← Scripts SQL manuales

src/
  lib/
    enrollment-auto-enroll.ts  ← Utilidades TypeScript
  components/
    admin/
      EnrollmentAutoEnrollPanel.tsx  ← Componente UI admin
```

---

### 📞 RESUMEN RÁPIDO

✅ **El problema**: Alumnos de 2°/3° no se auto-inscribían al registrarse  
✅ **La causa**: Missing fields, RLS issues, constraint conflicts  
✅ **La solución**: Mejorado login.tsx + Funciones SQL + Panel admin  
✅ **Cómo aplicar**: Ejecuta migración → usa panel admin u opción SQL  
✅ **Resultado**: 100% sin duplicados, logging detallado, soft errors  

