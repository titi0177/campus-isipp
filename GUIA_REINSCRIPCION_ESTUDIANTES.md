# 🔄 Reinscripción de Recursantes - Sistema Automático Inteligente

## ¿Cómo funciona?

El sistema respeta automáticamente los períodos de cursado para reinscripción:

### **MATERIAS ANUALES**
```
Desaprobó en 2026
    ↓
BLOQUEADA en 2026 (mismo año)
    ↓
Se abre ENERO 2027 (año siguiente)
    ↓
Puede reinscribirse como "2do intento"
```

### **MATERIAS CUATRIMESTRALES - 1ER CUATRIMESTRE**
```
Desaprobó 1er cuatrimestre (enero-junio) 2026
    ↓
BLOQUEADA julio-diciembre 2026
    ↓
Se abre ENERO 2027 (próximo 1er cuatrimestre)
    ↓
Disponible hasta JUNIO 2027
    ↓
Después vuelve a bloquearse hasta 2028
```

### **MATERIAS CUATRIMESTRALES - 2DO CUATRIMESTRE**
```
Desaprobó 2do cuatrimestre (julio-diciembre) 2026
    ↓
BLOQUEADA enero-junio 2027
    ↓
Se abre JULIO 2027 (próximo 2do cuatrimestre)
    ↓
Disponible hasta DICIEMBRE 2027
    ↓
Después vuelve a bloquearse hasta 2028
```

---

## 🎯 Flujo del Estudiante

### Opción 1: A través del Dashboard
1. Ir a Dashboard
2. Ver la sección "Calificaciones recientes"
3. Si tienes desaprobados, verás un link/botón
4. Ir a **Reinscripción como Recursante** (`/dashboard/recursive-reinscription`)

### Opción 2: Desde Inscripción de Materias
1. Ir a **Inscripción a Materias**
2. Ver si la materia dice "Recursante" (badge naranja)
3. Si es recursante y está disponible, aparece el botón "Inscribirse"
4. El sistema valida automáticamente los períodos

---

## 📋 Lo que ve el estudiante

### DISPONIBLES PARA REINSCRIBIRSE (Verde)
```
✅ Matemática I (Anual)
   Nota: 4.5 | Desaprobado: 2026
   [Botón: Reinscribirse]

✅ Inglés (1er Cuatrimestre)
   Nota: 5.0 | Desaprobado: 2026
   [Botón: Reinscribirse]
```

### NO DISPONIBLES ACTUALMENTE (Gris)
```
🔒 Programación II (Anual)
   Nota: 3.8 | Desaprobado: 2026
   Razón: "Anual: solo el próximo año"
   [Botón Bloqueado: No disponible]

🔒 Física (2do Cuatrimestre)
   Nota: 5.5 | Desaprobado: 2026 (2do C)
   Razón: "2do cuatrimestre: próximo disponible en julio"
   [Botón Bloqueado: No disponible]
```

---

## 🔧 MIGRACIONES SQL A EJECUTAR

### Migración 1: Sistema de Reinscripción Automática
**Archivo:** `supabase/migrations/20250420_student_recursive_reinscription.sql`

**Pasos:**
1. Ve a Supabase → SQL Editor → New Query
2. Abre el archivo
3. Copia TODO el contenido
4. Pégalo en Supabase
5. Presiona Play (▶️)

**Qué hace:**
- ✅ Crea vista `available_subjects_for_recursive`
- ✅ Función `can_reinscribe_subject()` - valida períodos
- ✅ Función `student_reinscribe_as_recursive()` - crea inscripción
- ✅ Actualiza RLS para permitir reinscripciones
- ✅ Crea índices para optimizar búsquedas

---

## 📊 Lógica de Validación de Períodos

### Para Anuales:
```sql
-- Solo si el año actual es DIFERENTE al año que desaprobó
IF current_year > failed_year THEN
  CAN_REINSCRIBE = TRUE
ELSE
  CAN_REINSCRIBE = FALSE
END
```

### Para Cuatrimestrales 1er Cuatrimestre:
```sql
-- Solo si estamos en meses 1-6 (enero-junio)
IF semester = 1 AND current_month <= 6 THEN
  CAN_REINSCRIBE = TRUE
ELSE
  CAN_REINSCRIBE = FALSE
END
```

### Para Cuatrimestrales 2do Cuatrimestre:
```sql
-- Solo si estamos en meses 7-12 (julio-diciembre)
IF semester = 2 AND current_month >= 7 THEN
  CAN_REINSCRIBE = TRUE
ELSE
  CAN_REINSCRIBE = FALSE
END
```

---

## 🎓 Ejemplos Reales

### EJEMPLO 1: Anual desaprobada
```
Estudiante: Juan Pérez
Materia: Matemática I (Anual)
Desaprobó: 4.5 (junio 2026)
Hoy: marzo 2027

✅ PUEDE REINSCRIBIRSE
   → Año cambió (2026 → 2027)
   → Es anual
   → Se abre inscripción automáticamente
```

### EJEMPLO 2: Cuatrimestral 1er C bloqueada
```
Estudiante: María García
Materia: Inglés (1er Cuatrimestre)
Desaprobó: 5.0 (junio 2026)
Hoy: septiembre 2026

❌ NO PUEDE REINSCRIBIRSE
   → Es 1er cuatrimestre (septiembre)
   → Solo disponible enero-junio
   → Se abrirá el próximo enero
```

### EJEMPLO 3: Cuatrimestral 2do C disponible
```
Estudiante: Carlos López
Materia: Programación (2do Cuatrimestre)
Desaprobó: 3.5 (noviembre 2026)
Hoy: julio 2027

✅ PUEDE REINSCRIBIRSE
   → Es 2do cuatrimestre (julio)
   → Disponible julio-diciembre
   → Se abre inscripción automáticamente
```

---

## 💾 Lo que se guarda en la BD

Cuando se reinscribe, se crea:

```sql
INSERT INTO enrollments (
  student_id,           -- Su ID
  subject_id,           -- La materia
  academic_year,        -- Año actual (ej: 2027)
  status,               -- 'en_curso'
  is_recursive,         -- TRUE (marca como recursante)
  attempt_number,       -- 2 (2do intento)
  created_at            -- Fecha/hora actual
);
```

Y en `enrollment_recursions` se registra:
```sql
original_enrollment_id  -- Inscripción del 1er intento
new_enrollment_id       -- Inscripción del 2do intento
attempt_number          -- 2
reason                  -- 'desaprobado'
```

---

## ⚙️ Frontend: Lo que ya está implementado

### ✅ Nuevo componente: `StudentRecursiveReinscription`
Muestra:
- Materias desaprobadas en el pasado
- Estado: disponible/bloqueada
- Razón por la que está bloqueada
- Botón para reinscribirse

### ✅ Nueva ruta: `/dashboard/recursive-reinscription`
Acceso desde:
- Link directo
- Menú del dashboard (próximamente)

### ✅ Integración con `enroll-subjects.tsx`
Ya valida y permite reinscripción con control de períodos

---

## ✅ CHECKLIST PARA ACTIVAR EL SISTEMA

- [ ] Ejecutar migración SQL en Supabase
- [ ] Verificar que la vista se creó: `SELECT * FROM public.desaprobados_para_recursion LIMIT 1;`
- [ ] Verificar funciones: `SELECT function_name FROM information_schema.routines WHERE routine_name LIKE '%recursive%';`
- [ ] Refrescar navegador (F5)
- [ ] Ir a Dashboard → Reinscripción como Recursante
- [ ] Probar con un alumno desaprobado (si existe)
- [ ] Verificar que respa los períodos

---

## 🚨 Troubleshooting

### Error: "Function does not exist"
**Solución**: Ejecutar la migración SQL completa

### No veo materias en reinscripción
**Solución**: 
- El alumno debe tener al menos un desaprobado registrado
- Verificar que `final_status = 'desaprobado'` en la BD

### La materia no se bloquea en el período correcto
**Solución**:
- Verificar que `dictation_type` y `semester` estén bien en `subjects`
- Ejecutar: `SELECT id, name, dictation_type, semester FROM subjects LIMIT 5;`

### El estudiante puede reinscribirse en año anterior
**Solución**: Verificar la lógica en `can_reinscribe_subject()` - revisar comparación de años

---

## 📞 RESUMEN

✅ **Sistema completo de reinscripción automática**
✅ **Respeta anuales y cuatrimestrales**
✅ **Validación inteligente de períodos**
✅ **El estudiante ve qué puede reinscribirse y cuándo**
✅ **Profesor ve tab de "Desaprobados" para reinscribir**
✅ **Historial completo en BD para auditoría**

¡Todo listo para que los estudiantes se reinscr iban respetando sus períodos de cursado!
