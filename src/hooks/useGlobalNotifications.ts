/**
 * Hook para suscripciones GLOBALES (sin dependencia de usuario)
 * Se crea una sola vez cuando monta el componente
 */

import { useEffect, useRef } from 'react'
import { useNotifications } from '@/components/NotificationCenter'
import { useToast } from '@/components/Toast'
import { supabase } from '@/lib/supabase'

export function useGlobalNotifications() {
  const { addNotification } = useNotifications()
  const { showToast } = useToast()
  const subscriptionRef = useRef<any>(null)

  useEffect(() => {
    // Prevenir duplicaciones: si ya existe una suscripción, no crear otra
    if (subscriptionRef.current) {
      console.log('[GlobalNotifications] Suscripción ya activa, ignorando creación duplicada')
      return
    }

    console.log('[GlobalNotifications] Creando suscripción global a anuncios')

    // Crear canal con nombre único usando timestamp para evitar colisiones
    const channelName = `global-announcements-${Date.now()}`

    subscriptionRef.current = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'announcements',
        },
        (payload) => {
          console.log('[GlobalNotifications] 📢 Nuevo anuncio recibido:', payload.new)
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
      .subscribe((status) => {
        console.log('[GlobalNotifications] Estado de suscripción:', status)
      })

    // Cleanup: unsubscribe cuando se desmonta
    return () => {
      console.log('[GlobalNotifications] Limpiando suscripción global')
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
        subscriptionRef.current = null
      }
    }
  }, []) // Sin dependencias - se crea una sola vez
}

export default useGlobalNotifications
