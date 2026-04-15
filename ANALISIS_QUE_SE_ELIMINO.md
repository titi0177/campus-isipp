# ❌ QUÉ SE ELIMINÓ Y QUÉ CONEXIONES SE ROMPIERON

## 📦 DEPENDENCIAS ELIMINADAS

```json
{
  "@tanstack/react-start": "^1.166.1",           ❌ ELIMINADA
  "@tanstack/start-client-core": "...",          ❌ ELIMINADA
  "@tanstack/start-server-core": "...",          ❌ ELIMINADA
  "@tanstack/start-storage-context": "...",      ❌ ELIMINADA
  "h3-v2": "...",                                 ❌ ELIMINADA
  "seroval": "...",                               ❌ ELIMINADA
}
```

**Reducción de dependencias:** 247 → 163 paquetes (-84 paquetes, -34%)

---

## 📂 ARCHIVOS ELIMINADOS

### 1. `src/server/provisionAuthUsers.ts` ❌ COMPLETAMENTE ELIMINADO

**¿Qué hacía?**
```typescript
// Crear estudiantes con Supabase Auth desde el panel admin
export const provisionStudentWithAuth = createServerFn({ method: 'POST' })
  .inputValidator((raw: unknown) => studentPayload.parse(raw))
  .handler(async ({ data }): Promise<ProvisionStudentResult> => {
    // Crear usuario en Supabase Auth
    // Crear perfil en BD
    // Crear estudiante en tabla students
  })

// Crear profesores con Supabase Auth desde el panel admin
export const provisionProfessorWithAuth = createServerFn({ method: 'POST' })
  .inputValidator((raw: unknown) => professorPayload.parse(raw))
  .handler(async ({ data }): Promise<ProvisionProfessorResult> => {
    // Crear usuario en Supabase Auth
    // Crear perfil en BD
    // Crear profesor en tabla professors
  })
```

**¿DÓNDE SE USABA?**
- `/admin/students.tsx` - Botón "Crear estudiante"
- `/admin/professors.tsx` - Botón "Crear profesor"

---

## 🔌 CONEXIONES ROTAS

### 1. **Admin Panel → Crear Estudiantes** ❌

**Archivo afectado:** `src/routes/admin/students.tsx`

**Antes:**
```typescript
import { provisionStudentWithAuth } from '@/server/provisionAuthUsers'

const handleSave = async (e: React.FormEvent) => {
  if (createWithAuth) {
    const res = await provisionStudentWithAuth({
      data: {
        accessToken: token,
        email: rest.email,
        dni: rest.dni,
        first_name: rest.first_name,
        last_name: rest.last_name,
        legajo: rest.legajo,
        program_id: rest.program_id,
        year: rest.year,
        status: rest.status,
      },
    })
    // Mostrar resultado...
  }
}
```

**Ahora:**
```typescript
const handleSave = async (e: React.FormEvent) => {
  // Opción 1: Insertar directo en BD (sin crear usuario Auth)
  const { error } = await supabase.from('students').insert(rest)
  // SIN crear usuario en Supabase Auth
}
```

**Resultado:** Se pueden crear estudiantes en BD, pero SIN cuenta de login.

---

### 2. **Admin Panel → Crear Profesores** ❌

**Archivo afectado:** `src/routes/admin/professors.tsx`

**Antes:**
```typescript
import { provisionProfessorWithAuth } from '@/server/provisionAuthUsers'

const handleSave = async (e: React.FormEvent) => {
  if (createWithAuth) {
    const res = await provisionProfessorWithAuth({
      data: {
        accessToken: token,
        email: data.email,
        dni: String(dni).trim(),
        name: data.name,
        department: data.department,
      },
    })
  }
}
```

**Ahora:**
```typescript
const handleSave = async (e: React.FormEvent) => {
  // Solo insertar en BD (sin crear usuario Auth)
  const { error } = await supabase.from('professors').insert(data)
  // SIN crear usuario en Supabase Auth
}
```

**Resultado:** Se pueden crear profesores en BD, pero SIN cuenta de login.

---

## ✅ LO QUE SIGUE FUNCIONANDO

### **CONEXIONES INTACTAS:**

| Conexión | Estado | Detalle |
|----------|--------|---------|
| **Supabase Auth** | ✅ | Login/Register desde `/login` funciona |
| **Supabase BD** | ✅ | CRUD en todas las tablas funciona |
| **Realtime** | ✅ | Suscripciones en tiempo real funcionan |
| **Storage** | ✅ | Subir/descargar archivos funciona |
| **RLS Policies** | ✅ | Seguridad en BD intacta |
| **API Supabase** | ✅ | Todas las queries directas funcionan |

---

## 🔴 FUNCIONALIDADES ROTAS

### **1. Crear estudiante desde Admin con cuenta**

```
❌ ROTO: Admin crea estudiante → Estudiante recibe email de confirmación → Puede loguearse

✅ ALTERNATIVA 1: Admin crea en Supabase Dashboard directamente
✅ ALTERNATIVA 2: Admin comparte código ISIPP25, estudiante se registra solo
✅ ALTERNATIVA 3: Crear Edge Function para crear usuarios
```

### **2. Crear profesor desde Admin con cuenta**

```
❌ ROTO: Admin crea profesor → Profesor recibe credenciales → Puede loguearse

✅ ALTERNATIVA 1: Admin crea en Supabase Dashboard
✅ ALTERNATIVA 2: Profesor se registra desde `/login` con código
✅ ALTERNATIVA 3: Crear Edge Function
```

### **3. Server-side validation con token**

```typescript
// ❌ YA NO FUNCIONA:
await assertStaffFromAccessToken(data.accessToken)
// Esta validación se hacía en servidor

// ✅ ALTERNATIVA:
// Usar Supabase RLS Policies para validar en BD
```

---

## 📊 RESUMEN DE CAMBIOS

| Elemento | Antes | Ahora | Estado |
|----------|-------|-------|--------|
| **Dependencias** | 247 | 163 | ✅ Reducidas |
| **Tamaño bundle** | ~700 KB | ~37 KB | ✅ Mejorado |
| **Server functions** | 2 | 0 | ❌ Eliminadas |
| **Archivos .ts** | +1 (provisionAuthUsers) | -1 | ❌ 1 menos |
| **Rutas rotas** | 0 | 2 (admin) | ❌ 2 afectadas |
| **Login estudiante** | ✅ Funciona | ✅ Funciona | ✅ OK |
| **Crear admin** | ✅ Funciona | ❌ ROTO | ❌ PROBLEMA |

---

## 🚀 SOLUCIONES DISPONIBLES

### **Opción A: Edge Functions (Recomendada)**
Crear una Edge Function en Supabase que:
- Cree usuario en Auth
- Cree perfil
- Cree registro en tabla correspondiente
- Se llama desde Admin panel

**Complejidad:** Media  
**Tiempo:** 30-45 min  
**Costo:** Gratis (primera 1M invocaciones)

### **Opción B: API externa**
Crear un mini-servidor en Node.js/Express en otro hosting que:
- Reciba peticiones desde Admin panel
- Cree usuarios en Supabase
- Retorne resultado

**Complejidad:** Media-Alta  
**Tiempo:** 1-2 horas  
**Costo:** Según hosting ($5-20/mes)

### **Opción C: Manual**
Admin crea usuarios en Supabase Dashboard directamente

**Complejidad:** Baja  
**Tiempo:** 2-3 min por usuario  
**Costo:** $0

### **Opción D: Volver a SSR**
Revertir cambios y usar Next.js + Vercel para SSR

**Complejidad:** Alta  
**Tiempo:** 2-3 días  
**Costo:** $0 (pero más tiempo)

---

## 🔧 ¿QUÉ HACER AHORA?

**1. Verifica que funcione:**
```bash
npm run build  # ✅ Debe compilar sin errores
```

**2. Elige una solución:**
- ¿Quieres Edge Function? Te ayudo
- ¿Quieres API externa? Te ayudo
- ¿Quieres manual? Listo ya

**3. Si necesitas crear usuarios ya:**
Ve a https://app.supabase.com → Authentication → Create User

---

## 📝 CHECKLIST

- ✅ Dependencias: 84 eliminadas
- ✅ Archivos: 1 eliminado (provisionAuthUsers.ts)
- ✅ Rutas rotas: 2 (/admin/students y /admin/professors)
- ✅ Conexiones rotas: 2 (crear estudiante con Auth, crear profesor con Auth)
- ✅ Conexiones intactas: Todas (Supabase Auth, BD, Realtime, RLS)
- ❌ Server functions: Eliminadas
- ❌ Login admin: Afectado

