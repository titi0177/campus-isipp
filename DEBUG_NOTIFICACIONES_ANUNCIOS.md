# 🔧 Debugging: Las Notificaciones de Anuncios No Llegan

## 🐛 Problema

Al subir un anuncio desde admin, no llega la notificación al alumno.

---

## ✅ Soluciones Aplicadas

### 1. **Mejorado el Hook de Notificaciones**

Cambios en `src/hooks/useRealtimeNotifications.ts`:

- ✅ Agregado logging detallado con `console.log()`
- ✅ Mejorado el canal de anuncios para escuchar todos (sin filtros por usuario)
- ✅ Cambio de nombre de canal a `public-announcements`
- ✅ Manejo mejorado de errores
- ✅ Acceso a `title` O `description` en el mensaje

### 2. **Creado Componente de Debug**

Nuevo archivo: `src/components/NotificationsDebug.tsx`

Este componente ayuda a diagnósticar si las notificaciones se están escuchando.

---

## 🧪 Cómo Probar si Funciona

### Paso 1: Agregar Component de Debug

En cualquier página (ej: `/src/routes/dashboard/index.tsx`):

```tsx
import { NotificationsDebug } from '@/components/NotificationsDebug'

export function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      {/* Agregar este componente temporalmente: */}
      <NotificationsDebug />
    </div>
  )
}
```

### Paso 2: Verificar en Consola

1. Abre la app en navegador
2. Abre Consola (F12)
3. Busca logs que comiencen con `[DEBUG]` o `[Notificaciones]`
4. Deberías ver:
   ```
   [Notificaciones] Iniciando suscripciones...
   [DEBUG] ✅ Usuario autenticado: xxxx
   [DEBUG] ✅ Suscripción exitosa a anuncios
   ```

### Paso 3: Insertar Anuncio de Prueba

1. Ve a `/admin/announcements`
2. Click "Nuevo Anuncio"
3. Completa los campos
4. Click "Publicar"
5. Mira la consola y el componente de debug
6. Deberías ver:
   ```
   [DEBUG] 🔔 EVENTO RECIBIDO: INSERT
   [DEBUG] Datos: {"title": "...", "description": "...", ...}
   ```

### Paso 4: Verificar la Notificación

Si ves el evento en debug:
- ✅ La suscripción funciona
- ✅ La BD está enviando eventos
- ✅ El problema es que la notificación NO se procesa

Si NO ves el evento:
- ❌ Problema de Supabase RLS o conectividad

---

## 🔍 Qué Verificar

### 1. **En Supabase Console**

Ve a: https://app.supabase.com

1. Ve a la tabla `announcements`
2. Inserta un anuncio manualmente
3. Verifica que se inserta sin errores
4. Verifica que RLS (Row Level Security) está habilitado pero permite INSERT

### 2. **Logs de Consola (F12)**

Busca logs de estas fuentes:
```
[Notificaciones] - Mi hook
[DEBUG] - Mi componente de debug  
[supabase] - Logs de Supabase
```

### 3. **Estado de Redux/Context**

En consola:
```javascript
// Verificar si el contexto de notificaciones existe
// Abrir React DevTools > Context > NotificationContext
```

---

## 🚨 Posibles Problemas y Soluciones

### Problema 1: "Usuario no autenticado"

**Síntoma:** Debug muestra `❌ No hay usuario autenticado`

**Solución:**
- Verifica que iniciaste sesión
- Limpia cookies/cache
- Recarga la página

### Problema 2: "Suscripción no exitosa"

**Síntoma:** `❌ Error` en el debug

**Solución:**
- Verifica RLS en Supabase
- Verifica que la tabla `announcements` existe
- Verifica permiso de lectura (SELECT) en RLS

### Problema 3: "Evento recibido pero sin notificación"

**Síntoma:** `🔔 EVENTO RECIBIDO` en debug pero nada en UI

**Solución:**
- Verifica que el contexto de NotificationProvider está en root
- Verifica que `addNotification` se está llamando
- Revisa consola por errores de React

### Problema 4: "Sin logs en consola"

**Síntoma:** Nada en consola, ni siquiera "[Notificaciones]"

**Solución:**
- Verifica que el hook se está llamando en `dashboard.tsx`
- Verifica que `userId` se está pasando correctamente
- Abre DevTools > Network > WebSocket para ver conexiones

---

## 📝 Checklist de Verificación

- [ ] Component NotificationsDebug agregado a la página
- [ ] Consola muestra "[DEBUG] ✅ Usuario autenticado"
- [ ] Consola muestra "[DEBUG] ✅ Suscripción exitosa"
- [ ] Insertar anuncio desde admin
- [ ] Consola muestra "[DEBUG] 🔔 EVENTO RECIBIDO"
- [ ] Verificar que `addNotification` se llama
- [ ] Verifica que notificación aparece en UI

---

## 🔧 Cómo Arreglarlo Manualmente

Si los eventos llegan pero no hay notificación, agregan debugging en el hook:

```tsx
const subscription = supabase
  .channel('public-announcements')
  .on('postgres_changes', {...}, (payload) => {
    console.log('[DEBUG] Payload:', payload) // Agregar esto
    console.log('[DEBUG] addNotification:', addNotification) // Y esto
    
    const data = payload.new as any
    console.log('[DEBUG] Data title:', data.title) // Y esto
    
    addNotification({...}) // El error está aquí si no llega notificación
  })
```

---

## 📞 Información para Reportar Error

Si aún no funciona, recolecta esto:

1. Screenshot del debug component mostrando eventos
2. Output de consola (F12 → Console)
3. Tu userId
4. Último anuncio insertado (id, timestamp)
5. Si ves errores en consola

---

## ✅ Cambios Realizados

- ✅ Agregado logging detallado
- ✅ Mejorado canal de anuncios
- ✅ Creado componente de debug
- ✅ Build exitoso

Ahora puedes diagnosticar exactamente dónde se rompe el flujo. 🔍

Commit: `87091c4f`
