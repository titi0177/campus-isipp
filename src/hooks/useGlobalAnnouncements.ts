import { useEffect, useRef } from 'react'
import { useNotifications } from '@/components/NotificationCenter'
import { useToast } from '@/components/Toast'
import { supabase } from '@/lib/supabase'

/**
 * Hook separado SOLO para anuncios globales
 * Se debe llamar en el componente raíz para que funcione para todos
 */
export function useGlobalAnnouncements() {
  const { addNotification } = useNotifications()
  const { showToast } = useToast()
  const subscriptionRef = useRef<any>(null)

  useEffect(() => {
    console.log('[Anuncios Globales] Iniciando suscripción a anuncios')

    // Crear suscripción
    const subscription = supabase
      .channel('global-announcements-' + Date.now())
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'announcements',
        },
        (payload) => {
          console.log('[Anuncios Globales] 🔔 EVENTO RECIBIDO:', payload)
          const data = payload.new as any

          // Mostrar notificación
          addNotification({
            type: 'announcement',
            title: '📢 Anuncio Nuevo',
            message: data.title || data.description || 'Nuevo anuncio disponible',
            priority: 'medium',
            data,
            actionUrl: '/dashboard/announcements',
          })

          // Mostrar toast
          showToast(`Nuevo anuncio: ${data.title || 'sin título'}`, 'info')
          console.log('[Anuncios Globales] ✅ Notificación enviada')
        }
      )
      .subscribe((status) => {
        console.log('[Anuncios Globales] Estado:', status)
      })

    subscriptionRef.current = subscription

    return () => {
      console.log('[Anuncios Globales] Limpiando suscripción')
      subscription.unsubscribe()
    }
  }, [addNotification, showToast])
}

export default useGlobalAnnouncements
