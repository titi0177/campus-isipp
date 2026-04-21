import { useEffect, useCallback, useRef } from 'react'
import { useNotifications } from '@/components/NotificationCenter'
import { useToast } from '@/components/Toast'
import { supabase } from '@/lib/supabase'

export function useRealtimeNotifications(userId?: string) {
  const { addNotification } = useNotifications()
  const { showToast } = useToast()
  const subscriptionsRef = useRef<Array<() => void>>([])

  // Escuchar cambios en calificaciones - Sin filtro, luego buscar el student_id
  const subscribeToGrades = useCallback(() => {
    if (!userId) return () => {}

    console.log('[Notificaciones] Suscribiendo a calificaciones:', userId)

    const subscription = supabase
      .channel(`grades:all`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'enrollment_grades',
        },
        async (payload) => {
          // Obtener el enrollment para verificar si es del usuario actual
          const enrollmentId = payload.new.enrollment_id
          const { data: enrollment } = await supabase
            .from('enrollments')
            .select('student_id')
            .eq('id', enrollmentId)
            .single()

          if (enrollment?.student_id === userId) {
            console.log('[Notificaciones] Nueva calificación para este usuario:', payload)
            const data = payload.new as any
            addNotification({
              type: 'grade',
              title: '📊 Nueva Calificación',
              message: `Recibiste una calificación: ${data.final_grade || data.partial_grade}/10`,
              priority: 'high',
              data,
              actionUrl: '/dashboard/history',
            })
            showToast(`Calificación registrada: ${data.final_grade || data.partial_grade}/10`, 'success')
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [userId, addNotification, showToast])

  // Escuchar cambios en pagos
  const subscribeToPayments = useCallback(() => {
    if (!userId) return () => {}

    console.log('[Notificaciones] Suscribiendo a pagos:', userId)

    const subscription = supabase
      .channel(`payments:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'payments',
          filter: `student_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[Notificaciones] Nuevo pago:', payload)
          const data = payload.new as any
          addNotification({
            type: 'payment',
            title: '💳 Pago Confirmado',
            message: `Tu pago de $${data.amount} ha sido procesado correctamente`,
            priority: 'high',
            data,
            actionUrl: '/dashboard/payments',
          })
          showToast(`Pago procesado: $${data.amount}`, 'success')
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [userId, addNotification, showToast])

  // Escuchar mensajes nuevos
  const subscribeToMessages = useCallback(() => {
    if (!userId) return () => {}

    console.log('[Notificaciones] Suscribiendo a mensajes:', userId)

    const subscription = supabase
      .channel(`messages:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[Notificaciones] Nuevo mensaje:', payload)
          const data = payload.new as any
          addNotification({
            type: 'message',
            title: '💬 Mensaje Nuevo',
            message: data.content?.substring(0, 100) || 'Tienes un mensaje nuevo',
            priority: 'medium',
            data,
            actionUrl: '/dashboard/messages',
          })
          showToast('Tienes un mensaje nuevo', 'info')
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [userId, addNotification, showToast])

  // Escuchar anuncios - SIN FILTRO (todos los usuarios)
  const subscribeToAnnouncements = useCallback(() => {
    console.log('[Notificaciones] Suscribiendo a anuncios (global)')

    const subscription = supabase
      .channel('public-announcements')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'announcements',
        },
        (payload) => {
          console.log('[Notificaciones] Nuevo anuncio:', payload)
          const data = payload.new as any
          addNotification({
            type: 'announcement',
            title: '📢 Anuncio Nuevo',
            message: data.title || data.description || 'Nuevo anuncio disponible',
            priority: 'medium',
            data,
            actionUrl: '/dashboard/announcements',
          })
          showToast(`Nuevo anuncio: ${data.title || 'sin título'}`, 'info')
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [addNotification, showToast])

  // Escuchar cambios en inscripciones
  const subscribeToEnrollments = useCallback(() => {
    if (!userId) return () => {}

    console.log('[Notificaciones] Suscribiendo a inscripciones:', userId)

    const subscription = supabase
      .channel(`enrollments:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'enrollments',
          filter: `student_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[Notificaciones] Cambio de inscripción:', payload)
          const data = payload.new as any
          const status = data.status?.toLowerCase()

          if (status === 'accepted') {
            addNotification({
              type: 'enrollment',
              title: '✅ Inscripción Aprobada',
              message: `Tu inscripción ha sido aprobada`,
              priority: 'high',
              data,
              actionUrl: '/dashboard/subjects',
            })
            showToast('¡Inscripción aprobada!', 'success')
          } else if (status === 'rejected') {
            addNotification({
              type: 'alert',
              title: '❌ Inscripción Rechazada',
              message: `Tu inscripción ha sido rechazada`,
              priority: 'high',
              data,
            })
            showToast('Inscripción rechazada', 'error')
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [userId, addNotification, showToast])

  // Escuchar actualizaciones de exámenes finales
  const subscribeToExams = useCallback(() => {
    if (!userId) return () => {}

    console.log('[Notificaciones] Suscribiendo a exámenes:', userId)

    const subscription = supabase
      .channel(`exams:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'final_exams',
          filter: `student_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[Notificaciones] Nuevo examen:', payload)
          const data = payload.new as any
          addNotification({
            type: 'exam',
            title: '📝 Examen Programado',
            message: `Te has inscrito para el examen`,
            priority: 'high',
            data,
            actionUrl: '/dashboard/exams',
          })
          showToast('Examen programado exitosamente', 'success')
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [userId, addNotification, showToast])

  // Escuchar certificados
  const subscribeToCertificates = useCallback(() => {
    if (!userId) return () => {}

    console.log('[Notificaciones] Suscribiendo a certificados:', userId)

    const subscription = supabase
      .channel(`certificates:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'certificates',
          filter: `student_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[Notificaciones] Nuevo certificado:', payload)
          const data = payload.new as any
          addNotification({
            type: 'certificate',
            title: '🎓 Certificado Disponible',
            message: `Tu certificado está disponible para descargar`,
            priority: 'medium',
            data,
            actionUrl: '/dashboard/certificates',
          })
          showToast('¡Tu certificado está listo!', 'success')
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [userId, addNotification, showToast])

  // Subscribirse a todos los eventos
  useEffect(() => {
    console.log('[Notificaciones] Iniciando suscripciones con userId:', userId)

    subscriptionsRef.current = [
      subscribeToGrades(),
      subscribeToPayments(),
      subscribeToMessages(),
      subscribeToAnnouncements(),
      subscribeToEnrollments(),
      subscribeToExams(),
      subscribeToCertificates(),
    ]

    return () => {
      console.log('[Notificaciones] Limpiando suscripciones')
      subscriptionsRef.current.forEach(unsub => unsub?.())
    }
  }, [
    subscribeToGrades,
    subscribeToPayments,
    subscribeToMessages,
    subscribeToAnnouncements,
    subscribeToEnrollments,
    subscribeToExams,
    subscribeToCertificates,
  ])
}

export default useRealtimeNotifications
