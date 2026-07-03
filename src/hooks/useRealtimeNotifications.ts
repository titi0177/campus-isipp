import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function useRealtimeNotifications(studentId: string, onNotificationReceived?: (notification: any) => void) {
  useEffect(() => {
    if (!studentId) return

    const channel = supabase
      .channel(`notifications:${studentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `student_id=eq.${studentId}`,
        },
        (payload) => {
          console.log('[NOTIFICATIONS] Realtime update:', payload)
          if (onNotificationReceived) {
            onNotificationReceived(payload.new)
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [studentId, onNotificationReceived])
}
