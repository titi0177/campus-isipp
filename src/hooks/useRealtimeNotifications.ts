import { useEffect, useCallback } from 'react'
import { useNotifications } from '@/components/NotificationCenter'
import { useToast } from '@/components/Toast'
import { supabase } from '@/lib/supabase'
import { MessageCircle, BookOpen, DollarSign, Award, FileText, CheckCircle } from 'lucide-react'

export function useRealtimeNotifications(userId?: string) {
  const { addNotification } = useNotifications()
  const { showToast } = useToast()

  // Escuchar cambios en calificaciones
  const subscribeToGrades = useCallback(() => {
    if (!userId) return

    const subscription = supabase
      .channel(`grades:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'enrollment_grades',
          filter: `student_id=eq.${userId}`,
        },
        (payload) => {
          const data = payload.new as any
          addNotification({
            type: 'grade',
            title: '📊 Nueva Calificación',
            message: `Recibiste una calificación: ${data.grade}/10 en ${data.subject || 'una asignatura'}`,
            priority: 'high',
            data,
            icon: <Award size={20} />,
          })

          showToast(`Calificación registrada: ${data.grade}/10`, 'success')
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [userId, addNotification, showToast])

  // Escuchar cambios en pagos
  const subscribeToPayments = useCallback(() => {
    if (!userId) return

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
          const data = payload.new as any
          addNotification({
            type: 'payment',
            title: '💳 Pago Confirmado',
            message: `Tu pago de $${data.amount} ha sido procesado correctamente`,
            priority: 'high',
            data,
            icon: <DollarSign size={20} />,
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
    if (!userId) return

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
          const data = payload.new as any
          addNotification({
            type: 'message',
            title: '💬 Mensaje Nuevo',
            message: data.content?.substring(0, 100) || 'Tienes un mensaje nuevo',
            priority: 'medium',
            data,
            icon: <MessageCircle size={20} />,
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

  // Escuchar anuncios
  const subscribeToAnnouncements = useCallback(() => {
    const subscription = supabase
      .channel('announcements')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'announcements',
        },
        (payload) => {
          const data = payload.new as any
          addNotification({
            type: 'announcement',
            title: '📢 Anuncio Nuevo',
            message: data.title,
            priority: 'medium',
            data,
            icon: <FileText size={20} />,
            actionUrl: '/dashboard/announcements',
          })

          showToast(`Nuevo anuncio: ${data.title}`, 'info')
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [addNotification, showToast])

  // Escuchar cambios en inscripciones
  const subscribeToEnrollments = useCallback(() => {
    if (!userId) return

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
          const data = payload.new as any
          const status = data.status?.toLowerCase()

          if (status === 'accepted') {
            addNotification({
              type: 'enrollment',
              title: '✅ Inscripción Aprobada',
              message: `Tu inscripción a ${data.subject} ha sido aprobada`,
              priority: 'high',
              data,
              icon: <CheckCircle size={20} />,
              actionUrl: '/dashboard/subjects',
            })

            showToast('¡Inscripción aprobada!', 'success')
          } else if (status === 'rejected') {
            addNotification({
              type: 'alert',
              title: '❌ Inscripción Rechazada',
              message: `Tu inscripción a ${data.subject} ha sido rechazada`,
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
    if (!userId) return

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
          const data = payload.new as any
          addNotification({
            type: 'exam',
            title: '📝 Examen Programado',
            message: `Te has inscrito para el examen de ${data.subject} el ${data.exam_date}`,
            priority: 'high',
            data,
            icon: <FileText size={20} />,
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
    if (!userId) return

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
          const data = payload.new as any
          addNotification({
            type: 'certificate',
            title: '🎓 Certificado Disponible',
            message: `Tu certificado de ${data.name} está disponible para descargar`,
            priority: 'medium',
            data,
            icon: <Award size={20} />,
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
    const unsubscribes = [
      subscribeToGrades(),
      subscribeToPayments(),
      subscribeToMessages(),
      subscribeToAnnouncements(),
      subscribeToEnrollments(),
      subscribeToExams(),
      subscribeToCertificates(),
    ]

    return () => {
      unsubscribes.forEach(unsub => unsub?.())
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
