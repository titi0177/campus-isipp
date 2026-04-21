/**
 * Hook para suscripciones de USUARIO (con dependencia de userId)
 * Se crea/limpia cuando userId cambia
 */

import { useEffect, useRef } from 'react'
import { useNotifications } from '@/components/NotificationCenter'
import { useToast } from '@/components/Toast'
import { supabase } from '@/lib/supabase'

export function useUserNotifications(userId: string | null | undefined) {
  const { addNotification } = useNotifications()
  const { showToast } = useToast()
  const subscriptionsRef = useRef<Array<any>>([])

  useEffect(() => {
    // Si no hay userId, no crear suscripciones
    if (!userId) {
      console.log('[UserNotifications] userId no disponible, saltando suscripciones')
      return
    }

    console.log('[UserNotifications] Creando suscripciones para usuario:', userId)

    const subscriptions: any[] = []

    // ============================================================
    // 1. SUSCRIPCIÓN A CALIFICACIONES
    // ============================================================
    const gradesChannel = supabase
      .channel(`grades:${userId}:${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'enrollment_grades',
        },
        async (payload) => {
          // Verificar que la calificación es para este usuario
          const enrollmentId = payload.new.enrollment_id
          const { data: enrollment } = await supabase
            .from('enrollments')
            .select('student_id')
            .eq('id', enrollmentId)
            .single()

          if (enrollment?.student_id === userId) {
            console.log('[UserNotifications] 📊 Nueva calificación:', payload.new)
            const data = payload.new as any

            addNotification({
              type: 'grade',
              title: '📊 Nueva Calificación',
              message: `Calificación: ${data.final_grade || data.partial_grade}/10`,
              priority: 'high',
              data,
              actionUrl: '/dashboard/history',
            })

            showToast(
              `Calificación registrada: ${data.final_grade || data.partial_grade}/10`,
              'success'
            )
          }
        }
      )
      .subscribe((status) => {
        console.log('[UserNotifications] Estado - Calificaciones:', status)
      })

    subscriptions.push(gradesChannel)

    // ============================================================
    // 2. SUSCRIPCIÓN A PAGOS
    // ============================================================
    const paymentsChannel = supabase
      .channel(`payments:${userId}:${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'payments',
          filter: `student_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[UserNotifications] 💳 Nuevo pago:', payload.new)
          const data = payload.new as any

          addNotification({
            type: 'payment',
            title: '💳 Pago Confirmado',
            message: `Tu pago de $${data.amount} ha sido procesado`,
            priority: 'high',
            data,
            actionUrl: '/dashboard/payments',
          })

          showToast(`Pago procesado: $${data.amount}`, 'success')
        }
      )
      .subscribe((status) => {
        console.log('[UserNotifications] Estado - Pagos:', status)
      })

    subscriptions.push(paymentsChannel)

    // ============================================================
    // 3. SUSCRIPCIÓN A MENSAJES
    // ============================================================
    const messagesChannel = supabase
      .channel(`messages:${userId}:${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[UserNotifications] 💬 Nuevo mensaje:', payload.new)
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
      .subscribe((status) => {
        console.log('[UserNotifications] Estado - Mensajes:', status)
      })

    subscriptions.push(messagesChannel)

    // ============================================================
    // 4. SUSCRIPCIÓN A INSCRIPCIONES
    // ============================================================
    const enrollmentsChannel = supabase
      .channel(`enrollments:${userId}:${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'enrollments',
          filter: `student_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[UserNotifications] ✅ Cambio de inscripción:', payload.new)
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
      .subscribe((status) => {
        console.log('[UserNotifications] Estado - Inscripciones:', status)
      })

    subscriptions.push(enrollmentsChannel)

    // ============================================================
    // 5. SUSCRIPCIÓN A EXÁMENES
    // ============================================================
    const examsChannel = supabase
      .channel(`exams:${userId}:${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'final_exams',
          filter: `student_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[UserNotifications] 📝 Nuevo examen:', payload.new)
          const data = payload.new as any

          addNotification({
            type: 'exam',
            title: '📝 Examen Programado',
            message: `Examen programado`,
            priority: 'high',
            data,
            actionUrl: '/dashboard/exams',
          })

          showToast('Examen programado exitosamente', 'success')
        }
      )
      .subscribe((status) => {
        console.log('[UserNotifications] Estado - Exámenes:', status)
      })

    subscriptions.push(examsChannel)

    // ============================================================
    // 6. SUSCRIPCIÓN A CERTIFICADOS
    // ============================================================
    const certificatesChannel = supabase
      .channel(`certificates:${userId}:${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'certificates',
          filter: `student_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[UserNotifications] 🎓 Nuevo certificado:', payload.new)
          const data = payload.new as any

          addNotification({
            type: 'certificate',
            title: '🎓 Certificado Disponible',
            message: `Tu certificado está disponible`,
            priority: 'medium',
            data,
            actionUrl: '/dashboard/certificates',
          })

          showToast('¡Tu certificado está listo!', 'success')
        }
      )
      .subscribe((status) => {
        console.log('[UserNotifications] Estado - Certificados:', status)
      })

    subscriptions.push(certificatesChannel)

    // Guardar referencias para cleanup
    subscriptionsRef.current = subscriptions

    console.log(`[UserNotifications] ✅ ${subscriptions.length} suscripciones creadas`)

    // ============================================================
    // CLEANUP: Unsubscribe cuando userId cambia o desmonta
    // ============================================================
    return () => {
      console.log('[UserNotifications] Limpiando todas las suscripciones')

      subscriptionsRef.current.forEach((channel, index) => {
        channel.unsubscribe()
        console.log(`[UserNotifications] Unsubscribed de suscripción ${index + 1}`)
      })

      subscriptionsRef.current = []
    }
  }, [userId, addNotification, showToast]) // Dependencia en userId - se recrea si cambia
}

export default useUserNotifications
