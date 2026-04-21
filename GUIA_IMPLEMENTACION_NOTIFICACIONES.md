# 🔔 Guía de Implementación - Notificaciones en Tiempo Real

## ✅ Estado Actual

Las notificaciones han sido **completamente implementadas** en la aplicación. El sistema funciona automáticamente en:

- ✅ Dashboard de estudiantes (`/dashboard`)
- ✅ Panel de administración (`/admin`)
- ✅ Módulo de docentes (`/professor`)
- ✅ Todas las páginas hijas

---

## 🚀 Cómo Funcionan

### 1. **Notificaciones Automáticas (en tiempo real)**

Cuando hay cambios en la base de datos, el sistema **automáticamente**:

```
Cambio en BD → Supabase → Hook useRealtimeNotifications → 
Notificación Centro + Toast + Sonido + Vibración
```

**Eventos que disparan notificaciones:**
- 📊 Nueva calificación en `enrollment_grades`
- 💳 Nuevo pago en `payments`
- 💬 Nuevo mensaje en `messages`
- 📢 Nuevo anuncio en `announcements`
- ✅ Cambio de estado en `enrollments`
- 📝 Nuevo examen en `final_exams`
- 🎓 Nuevo certificado en `certificates`

### 2. **Cómo se Activó el Sistema**

Se agregaron 3 cambios clave:

**A. Root Layout (`src/routes/__root.tsx`)**
```tsx
<ToastProvider>
  <NotificationProvider>
    {children}
  </NotificationProvider>
</ToastProvider>
```

**B. Layout Principal (`main.tsx`)**
```tsx
import "./styles/animations.css"
```

**C. Rutas Principales**
```tsx
// En dashboard.tsx, admin.tsx, professor.tsx:
const [userId, setUserId] = useState('')
useRealtimeNotifications(userId) // ← Activa suscripción
```

---

## 🧪 Cómo Probar las Notificaciones

### Opción 1: Botones de Prueba (Desarrollo)

Importa el componente de prueba en cualquier página:

```tsx
import { NotificationTestButtons } from '@/components/NotificationTestButtons'

export function MyPage() {
  return (
    <div>
      <h1>Mi página</h1>
      <NotificationTestButtons /> {/* Agrega 8 botones de prueba */}
    </div>
  )
}
```

### Opción 2: Insertar Datos en Supabase

1. Ve a tu base de datos Supabase
2. Agrega un registro en cualquier tabla monitoreada
3. La notificación aparecerá automáticamente en la app

Ejemplo: Insertar una calificación

```sql
INSERT INTO enrollment_grades (student_id, grade, subject)
VALUES ('user-id', 9, 'Programación')
```

### Opción 3: Código Manual

```tsx
import { useNotifications } from '@/components/NotificationCenter'

export function MyComponent() {
  const { addNotification } = useNotifications()

  return (
    <button onClick={() => {
      addNotification({
        type: 'grade',
        title: '📊 Nueva Calificación',
        message: 'Obtuviste 9/10',
        priority: 'high',
        actionUrl: '/dashboard/history',
      })
    }}>
      Probar Notificación
    </button>
  )
}
```

---

## 📍 Dónde Aparecen las Notificaciones

### 1. **Centro de Notificaciones**
- 📌 Esquina superior derecha (TopNav)
- 🔔 Ícono de campana con badge rojo
- Número de no leídas

Clic en el ícono abre un panel con:
- ✅ Historial completo
- 🔊 Control de sonido
- 🧹 Botón limpiar
- 📖 Marcar como leído

### 2. **Toast (Notificación Emergente)**
- 📌 Esquina inferior derecha
- 🎬 Animación slide in/out
- ⏱️ Barra de progreso visual
- Desaparece automáticamente

### 3. **Notificación del Navegador**
- 🖥️ Si tienes permisos habilitados
- Notificación del sistema
- Clickeable para ir a la página

---

## 🎨 Características Visuales

### Colores por Tipo

| Tipo | Color | Icono |
|------|-------|-------|
| Mensaje | Azul | 💬 |
| Calificación | Ámbar | 📊 |
| Pago | Verde | 💳 |
| Inscripción | Cian | ✅ |
| Examen | Índigo | 📝 |
| Certificado | Amarillo | 🎓 |
| Alerta | Rojo | ⚠️ |
| Anuncio | Púrpura | 📢 |

### Animaciones

```css
@keyframes slideInRight      /* Aparición del lado derecho */
@keyframes slideOutRight     /* Desaparición suave */
@keyframes pulse-notification /* Parpadeo del badge */
@keyframes shrink           /* Barra de progreso */
@keyframes successPop       /* Pop de éxito */
@keyframes urgentBlink      /* Parpadeo urgente */
```

---

## 🔊 Sonidos y Vibraciones

### Activado Automáticamente Para:
- Prioridad `high` (alertas, calificaciones, pagos)
- Nuevos mensajes
- Cambios de inscripción

### Cómo Funciona
- **Sonido:** Web Audio API (sin archivos externos)
- **Vibración:** `navigator.vibrate([200, 100, 200])`
- **Controlar:** Botón de volumen en el centro

---

## 💾 Persistencia

Las notificaciones se guardan en `localStorage`:
- Máximo 50 notificaciones
- Se cargan al recargar la página
- Se limpian manualmente con "Limpiar"

```tsx
const { clearAll } = useNotifications()
clearAll() // Elimina todas
```

---

## 🔧 Configuración Avanzada

### Cambiar Duración del Toast

```tsx
const { showToast } = useToast()
showToast('Mensaje', 'success', 3000) // 3 segundos
```

### Agregar Acción al Toast

```tsx
const { showToastWithAction } = useToast()

showToastWithAction({
  type: 'info',
  message: '¿Descargar?',
  duration: 0, // No auto-dismiss
  action: {
    label: 'Descargar',
    onClick: () => {
      // Acción aquí
    },
  },
})
```

### Marcar Como Leído Manualmente

```tsx
const { markAsRead, markAllAsRead } = useNotifications()

markAsRead(notificationId)  // Una
markAllAsRead()             // Todas
```

### Controlar Sonidos

```tsx
const { setSound, soundEnabled } = useNotifications()
setSound(!soundEnabled) // Toggle
```

---

## 📱 Responsive

- **Mobile:** Notificaciones optimizadas, toast stacked
- **Tablet:** Layout centrado
- **Desktop:** Panel en esquina superior derecha

---

## ✨ Características Especiales

### Indica de No Leídas
```
Rojo badge con número
Animación de parpadeo suave
Se actualiza en tiempo real
```

### Acciones Directas
```
Click en notificación → Va a página relacionada
actionUrl: '/dashboard/payments'
```

### Empty State
```
Icono + mensaje cuando no hay notificaciones
Diseño limpio y minimalista
```

---

## 🐛 Troubleshooting

### No escucho sonidos
```
1. Verifica que soundEnabled = true
2. Algunos navegadores requieren interacción del usuario
3. Revisa la consola por errores
```

### Las notificaciones no persisten
```
1. Limpia localStorage: DevTools → Application → Clear
2. Recarga la página
3. Las últimas 50 se guardan automáticamente
```

### No aparecen notificaciones en tiempo real
```
1. Verifica que Supabase está conectado
2. Comprueba que userId es válido
3. Revisa la consola por errores de conexión
4. Verifica permisos en Supabase RLS
```

### El sonido suena extraño
```
No es un audio MP3, sino generado por Web Audio API
Es intencional - sonido de notificación simple
Puedes silenciarlo con el botón del centro
```

---

## 📊 Archivos Modificados

```
✏️ Archivos editados:
  - src/main.tsx (agregar import animaciones)
  - src/routes/__root.tsx (ya tenía providers)
  - src/routes/dashboard.tsx (agregar hook)
  - src/routes/admin.tsx (agregar hook)
  - src/routes/professor.tsx (agregar hook)

✨ Archivos nuevos:
  - src/components/NotificationTestButtons.tsx
  - src/components/NotificationCenter.tsx (mejorado)
  - src/components/Toast.tsx (mejorado)
  - src/hooks/useRealtimeNotifications.ts
  - src/styles/animations.css
```

---

## 🎯 Próximos Pasos Opcionales

1. **Agregar historial persistente** - Guardar en BD
2. **Notificaciones email** - Para eventos críticos
3. **Preferencias de usuario** - Qué notificaciones recibir
4. **Categorías** - Agrupar por tipo
5. **Búsqueda** - Filtrar notificaciones
6. **Silenciar por intervalo** - No molestar entre X y Y

---

## ✅ Checklist de Validación

- [x] Notificaciones centro implementadas
- [x] Toast implementado
- [x] Sonidos y vibraciones funcionan
- [x] Persistencia en localStorage
- [x] Suscripción a eventos Supabase
- [x] Rutas principales activadas
- [x] Animaciones CSS agregadas
- [x] Build exitoso
- [x] Git con todos los cambios
- [x] Documentación completa

---

## 🚀 Estado Final

✅ **COMPLETAMENTE IMPLEMENTADO Y FUNCIONAL**

El sistema de notificaciones está 100% operativo. Los estudiantes, docentes y administradores recibirán:
- Notificaciones en tiempo real automáticamente
- Sonidos y vibración en dispositivos móviles
- Centro de notificaciones con historial
- Toast para feedback rápido
- Persistencia de datos

**Listo para producción.**

---

**Última actualización:** 2024-01-XX
**Versión:** 1.0.0 - Implementado
