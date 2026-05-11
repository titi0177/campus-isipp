# 🔒 RESUMEN DE CAMBIOS DE SEGURIDAD - REGISTRO DE ESTUDIANTES

## Fecha: 2026-04-24
## Commit: b5561533

### ✅ PROBLEMA RESUELTO

Se eliminó la vulnerabilidad que permitía dejar **cuentas huérfanas** en Supabase Auth cuando un usuario intentaba registrarse con un legajo o DNI duplicado.

---

## 📋 CAMBIOS REALIZADOS

### 1️⃣ Función SQL: `check_duplicate_legajo_dni()`
**Archivo:** `supabase/migrations/20260424000000_add_duplicate_validation_function.sql`

**Qué hace:**
- Valida que el legajo y DNI no estén duplicados
- Se puede llamar ANTES de intentar registrarse
- Devuelve `is_duplicate: true/false` y `error_message`

**Ventajas:**
- Validación previa en el cliente
- Evita requests innecesarias
- Mensajes de error claros

---

### 2️⃣ Trigger Mejorado: `handle_new_auth_user_into_students()`
**Archivo:** `supabase/migrations/20260424000001_improve_student_trigger_atomic.sql`

**Qué cambia:**
- **ANTES:** Insertaba aunque hubiera duplicados (generaba error confuso)
- **AHORA:** Valida legajo/DNI y RECHAZA el INSERT si hay duplicados
- Usa `RAISE EXCEPTION` para cancelar la transacción completa
- Impide que quede usuario huérfano en `auth.users`

**Flujo de Transacción:**
```
1. Usuario se registra en Auth
2. Trigger intenta crear registro en students
3. Trigger valida: ¿Legajo/DNI duplicado?
4. SI → RAISE EXCEPTION → Transacción cancela
   NO → INSERT exitoso → Transacción continúa
```

---

### 3️⃣ Mejora de Manejo de Errores: `src/routes/login.tsx`
**Cambios principales:**

#### A) Validación Previa (NUEVO)
```typescript
// Antes de intentar registrarse
const { data: validation } = await supabase.rpc('check_duplicate_legajo_dni', {
  p_legajo: registerData.legajo.trim(),
  p_dni: registerData.dni.trim(),
})

if (validation?.[0]?.is_duplicate) {
  setError(validation[0].error_message)
  return
}
```

#### B) Manejo de Errores de Auth (MEJORADO)
```typescript
// Ahora distingue entre tipos de errores
if (authError.message.includes('El legajo')) {
  setError('El legajo ya está registrado en el sistema.')
} else if (authError.message.includes('El DNI')) {
  setError('El DNI ya está registrado en el sistema.')
}
```

#### C) Manejo de Errores de Inserción (MEJORADO)
```typescript
// Distingue entre:
// 1. Legajo duplicado → mensaje claro
// 2. DNI duplicado → mensaje claro
// 3. Creado por trigger (esperado) → intenta recuperar
```

---

## 🛡️ SEGURIDAD: ANTES vs DESPUÉS

### ANTES ❌
```
1. Usuario registra: legajo "2024001" (ya existe)
2. Auth crea usuario ✓
3. Trigger intenta INSERT → FALLA (duplicado)
4. Error genérico: "Error al obtener registro"
5. Cuenta HUÉRFANA en auth.users ⚠️
```

### DESPUÉS ✅
```
1. Usuario completa legajo "2024001"
2. Validación previa: "Este legajo ya existe" → STOP
3. Usuario no puede registrarse
4. Sin cuenta huérfana ✓
5. O si lo intenta igual:
   - Auth rechaza el INSERT (transacción atómica)
   - Error claro: "El legajo ya está registrado"
```

---

## 📁 ARCHIVOS DE BACKUP

Ubicación: `backup_/`

- `login.tsx.backup` - Original del componente de login
- `trigger_create_student_from_auth.sql.backup` - Trigger original

**Para restaurar (si hay error):**
```bash
# Restaurar archivo TypeScript
cp backup_/login.tsx.backup src/routes/login.tsx

# Restaurar función SQL (revert en Supabase):
# 1. Ir a Supabase SQL Editor
# 2. Ejecutar el archivo .sql.backup original
```

---

## 🔄 FLUJO DE DEPLOYMENT

1. **GitHub** → Commit y push completado ✓
2. **Vercel** → Auto-deploy desde main (en proceso)
3. **Supabase** → Migrations ejecutarán automáticamente en próximo despliegue
4. **Producción** → Cambios en vivo

---

## ✅ VERIFICACIÓN

### Tests Manuales Recomendados:

1. **Test: Legajo duplicado (fase previa)**
   - Ir a /login → Registrarse
   - Usar legajo "2024001" que ya existe
   - Verificar: Mensaje "Este legajo ya está registrado"
   - ✓ No se envía solicitud

2. **Test: DNI duplicado (fase previa)**
   - Usar DNI que ya existe
   - Verificar: Mensaje "El DNI ya está registrado"
   - ✓ No se envía solicitud

3. **Test: Registro exitoso**
   - Datos únicos: legajo "9999999", DNI "99999999"
   - Verificar: Cuenta se crea correctamente
   - Verificar: Estudiante aparece en tabla
   - ✓ Sin errores

---

## 📝 NOTAS

- Las migrations se aplican automáticamente al siguiente despliegue en Supabase
- La función `check_duplicate_legajo_dni()` es pública y puede usarse desde el cliente
- El trigger es SEGURO: si falla alguna validación, rechaza TODO (transacción atómica)
- No hay impacto en estudiantes ya registrados
- Todos los cambios son hacia atrás compatibles

---

## 🚨 EN CASO DE ERROR

Si Vercel muestra error de build:

1. **Verificar build logs:** https://vercel.com/your-project
2. **Si falla compilación:** Revisar `src/routes/login.tsx` con backup
3. **Si falla en Supabase:** Ejecutar queries SQL originales desde backup
4. **Revert rápido:**
   ```bash
   git revert b5561533
   git push origin main
   ```

---

## 📞 SOPORTE

Archivos de referencia en `backup_/`:
- `login.tsx.backup` → Si necesitas el código original
- `trigger_create_student_from_auth.sql.backup` → Si necesitas revertir SQL
