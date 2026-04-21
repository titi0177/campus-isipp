# 📢 Sistema de Notificaciones en Tiempo Real

## Descripción General

Sistema completo y moderno de notificaciones en tiempo real para estudiantes del Campus ISIPP. Incluye:

- ✨ Notificaciones toast elegantes
- 🔔 Centro de notificaciones con historial
- 🔊 Sonidos y vibraciones
- ⚡ Suscripción en tiempo real con Supabase
- 💾 Persistencia en localStorage
- 🎨  9 tipos de notificaciones diferentes
- 📱 Diseño responsive
- ♿ Accesibilidad WCAG AA

---

## 🎯 Tipos de Notificaciones

### 1. **Message** 💬
Mensajes de profesores o administradores

```tsx
addNotification({
  type: 'message',
  title: '💬 Nuevo Mensaje',
  message: 'El profesor te envió un mensaje',
  priority: 'medium',
  actionUrl: '/dashboard/messages',
})
```

### 2. **Announcement** 📢
Anuncios institucionales

```tsx
addNotification({
  type: 'announcement',
  title: '📢 Anuncio Nuevo',
  message: 'Nueva información disponible',
  priority: 'medium',
  actionUrl: '/dashboard/announcements',
})
```

### 3. **Grade** 📊
Notificaciones de calificaciones

```tsx
addNotification({
  type: 'grade',
  title: '📊 Nueva Calificación',
  message: 'Calificación registrada: 9/10',
  priority: 'high',
  actionUrl: '/dashboard/history',
})
```

### 4. **Payment** 💳
Confirmaciones de pago

```tsx
addNotification({
  type: 'payment',
  title: '💳 Pago Confirmado',
  message: 'Tu pago de $5000 ha sido procesado',
  priority: 'high',
  actionUrl: '/dashboard/payments',
})
```

### 5. **Enrollment** ✅
Estado de inscripciones

```tsx
addNotification({
  type: 'enrollment',
  title: '✅ Inscripción Aprobada',
  message: 'Tu inscripción ha sido aceptada',
  priority: 'high',
  actionUrl: '/dashboard/subjects',
})
```

### 6. **Exam** 📝
Programación de exámenes

```tsx
addNotification({
  type: 'exam',
  title: '📝 Examen Programado',
  message: 'Examen el 20 de diciembre',
  priority: 'high',
  actionUrl: '/dashboard/exams',
})
```

### 7. **Certificate** 🎓
Disponibilidad de certificados

```tsx
addNotification({
  type: 'certificate',
  title: '🎓 Certificado Disponible',
  message: 'Tu certificado está listo',
  priority: 'medium',
  actionUrl: '/dashboard/certificates',
})
```

### 8. **Alert** ⚠️
Alertas críticas

```tsx
addNotification({
  type: 'alert',
  title: '⚠️ Alerta Importante',
  message: 'Vencimiento próximo',
  priority: 'high',
})
```

### 9. **Success** ✅
Operaciones exitosas

```tsx
addNotification({
  type: 'success',
  title: '✅ Éxito',
  message: 'Operación completada',
  priority: 'medium',
})
```

---

## 🚀 Uso Básico

### En un Componente

```tsx
import { useNotifications } from '@/components/NotificationCenter'
import { useToast } from '@/components/Toast'

export function MyComponent() {
  const { addNotification } = useNotifications()
  const { showToast } = useToast()

  const handleSomething = () => {
    // Agregar notificación
    addNotification({
      type: 'success',
      title: '¡Éxito!',
      message: 'Cambios guardados correctamente',
      priority: 'medium',
    })

    // Mostrar toast
    showToast('Guardado correctamente', 'success')
  }

  return (
    <button onClick={handleSomething}>
      Guardar
    </button>
  )
}
```

### Con Acciones

```tsx
const { showToastWithAction } = useToast()

showToastWithAction({
  type: 'info',
  title: 'Confirmar',
  message: '¿Estás seguro?',
  duration: 0, // No auto-dismiss
  action: {
    label: 'Aceptar',
    onClick: () => {
      console.log('Confirmado')
    },
  },
})
```

---

## 🔔 Sistema de Notificaciones en Tiempo Real

### Configuración

1. **Importar el hook** en tu página principal de estudiante:

```tsx
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications'

export function StudentDashboard() {
  const userId = 'user-id-aqui'
  
  // Activar notificaciones en tiempo real
  useRealtimeNotifications(userId)

  return (
    // Tu contenido
  )
}
```

### Eventos Subscriptos

El hook se suscribe automáticamente a:

| Evento | Tabla | Filtro |
|--------|-------|--------|
| Calificaciones | `enrollment_grades` | `student_id=eq.{userId}` |
| Pagos | `payments` | `student_id=eq.{userId}` |
| Mensajes | `messages` | `receiver_id=eq.{userId}` |
| Anuncios | `announcements` | Todos |
| Inscripciones | `enrollments` | `student_id=eq.{userId}` |
| Exámenes | `final_exams` | `student_id=eq.{userId}` |
| Certificados | `certificates` | `student_id=eq.{userId}` |

---

## 🎨 Características Especiales

### Prioridades

```tsx
priority: 'low' | 'medium' | 'high'

// low: Notificación gris normal
// medium: Notificación con color del tipo
// high: Notificación con rojo urgente, sonido + vibración
```

### Sonidos y Vibraciones

- ✅ Sonidos automáticos para notificaciones (si está activado)
- 📳 Vibración en dispositivos móviles
- 🔇 Botón para silenciar/activar notificaciones

### Persistencia

Las notificaciones se guardan en `localStorage`:
- Máximo 50 notificaciones
- Se cargan al recargar la página
- Se limpian manualmente con "Limpiar"

### Indicador Visual

Badge con número de no leídas:
- Se actualiza en tiempo real
- Muestra "99+" cuando hay muchas
- Animación de parpadeo suave

---

## 📱 Toast (Notificaciones Emergentes)

### Uso Rápido

```tsx
const { showToast } = useToast()

// Éxito
showToast('Guardado correctamente', 'success')

// Error
showToast('Algo salió mal', 'error')

// Información
showToast('Operación en progreso', 'info')

// Advertencia
showToast('Cuidado con esto', 'warning')
```

### Duración Personalizada

```tsx
showToast('Mensaje rápido', 'success', 2000) // 2 segundos
showToast('Mensaje largo', 'info', 8000)     // 8 segundos
```

### Toast con Acción

```tsx
showToastWithAction({
  type: 'info',
  title: 'Confirmación',
  message: '¿Descargar archivo?',
  duration: 10000,
  action: {
    label: 'Descargar',
    onClick: () => {
      // Lógica aquí
    },
  },
})
```

---

## 🎯 Ejemplos Completos

### Ejemplo 1: Guardar Datos

```tsx
async function handleSave() {
  try {
    await saveData()
    
    addNotification({
      type: 'success',
      title: '✅ Guardado',
      message: 'Tus cambios se han guardado correctamente',
      priority: 'medium',
    })
    
    showToast('Cambios guardados', 'success')
  } catch (error) {
    addNotification({
      type: 'alert',
      title: '❌ Error',
      message: 'No se pudo guardar. Intenta de nuevo',
      priority: 'high',
    })
    
    showToast('Error al guardar', 'error')
  }
}
```

### Ejemplo 2: Inscripción

```tsx
async function handleEnrollment(subjectId) {
  try {
    const response = await enrollToSubject(subjectId)
    
    addNotification({
      type: 'enrollment',
      title: '✅ Inscripción Enviada',
      message: 'Tu solicitud está en revisión',
      priority: 'high',
      actionUrl: '/dashboard/subjects',
    })
    
    showToastWithAction({
      type: 'success',
      title: 'Inscripción Enviada',
      message: 'Verifica el estado en tu historial',
      action: {
        label: 'Ver Estado',
        onClick: () => {
          navigate('/dashboard/subjects')
        },
      },
    })
  } catch (error) {
    showToast('Error en la inscripción', 'error')
  }
}
```

### Ejemplo 3: Con Datos

```tsx
function handleGradeReceived(gradeData) {
  addNotification({
    type: 'grade',
    title: '📊 Nueva Calificación',
    message: `Obtuviste ${gradeData.grade}/10 en ${gradeData.subject}`,
    priority: 'high',
    data: gradeData,
    actionUrl: '/dashboard/history',
  })

  showToast(
    `¡${gradeData.grade === 10 ? 'Excelente' : 'Buena'} calificación!`,
    'success'
  )
}
```

---

## 🎨 Colores por Tipo

| Tipo | Color | Ícono |
|------|-------|-------|
| message | Azul | 💬 |
| announcement | Púrpura | 📢 |
| grade | Ámbar | 📊 |
| payment | Verde | 💳 |
| enrollment | Cian | ✅ |
| exam | Índigo | 📝 |
| certificate | Amarillo | 🎓 |
| alert | Rojo | ⚠️ |
| success | Esmeralda | ✅ |

---

## ⚙️ Configuración

### Habilitar/Deshabilitar Sonidos

```tsx
const { setSound, soundEnabled } = useNotifications()

// Activar/desactivar
setSound(!soundEnabled)
```

### Marcar como Leído

```tsx
const { markAsRead, markAllAsRead } = useNotifications()

// Una notificación
markAsRead(notificationId)

// Todas
markAllAsRead()
```

### Limpiar Notificaciones

```tsx
const { clearAll } = useNotifications()

clearAll() // Elimina todas las notificaciones
```

---

## 📊 Props Completos

```typescript
interface Notification {
  id: string              // Auto-generado
  type: NotificationType  // message | announcement | alert | success | info | grade | payment | enrollment | exam | certificate
  title: string          // Título visible
  message: string        // Descripción
  timestamp: Date        // Auto-generado
  read: boolean          // Auto-generado como false
  actionUrl?: string     // URL al hacer click
  icon?: ReactNode       // Icono personalizado
  data?: Record<string, any> // Datos personalizados
  priority?: 'low' | 'medium' | 'high' // Importancia
}

interface Toast {
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
  title?: string
  duration?: number // ms, 0 = no auto-dismiss
  action?: {
    label: string
    onClick: () => void
  }
}
```

---

## 📱 Responsive Design

- **Mobile**: Notificaciones apiladas, toast optimizado
- **Tablet**: Layout centrado
- **Desktop**: Centro de notificaciones en esquina superior derecha

---

## ♿ Accesibilidad

- ✅ WCAG AA compliant
- ✅ ARIA labels en botones
- ✅ Teclado navegable
- ✅ Focus visible
- ✅ Contraste de colores
- ✅ Anouncements para lectores de pantalla

---

## 🔧 Troubleshooting

### Los sonidos no funcionan
- Revisa que `soundEnabled` esté en `true`
- Algunos navegadores requieren interacción del usuario primero
- Verifica que AudioContext está soportado

### Las notificaciones no persisten
- Limpia el localStorage y recarga
- Verifica que localStorage no esté deshabilitado

### No aparecen notificaciones en tiempo real
- Verifica que Supabase está configurado correctamente
- Comprueba que el `userId` es válido
- Revisa la consola por errores

---

## 📚 Referencia Rápida

```tsx
// Notificaciones
import { useNotifications } from '@/components/NotificationCenter'
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications'

// Toast
import { useToast } from '@/components/Toast'

// Uso
const { addNotification } = useNotifications()
const { showToast } = useToast()
useRealtimeNotifications(userId)
```

---

**Última actualización:** 2024-01-XX
**Versión:** 2.0.0
