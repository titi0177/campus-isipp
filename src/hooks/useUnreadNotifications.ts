import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function useUnreadNotifications(studentId: string) {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!studentId) return

    const loadUnreadCount = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', studentId)
        .eq('read', false)

      setUnreadCount(count || 0)
    }

    loadUnreadCount()

    // Realtime subscription
    const channel = supabase
      .channel(`unread_notifications:${studentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `student_id=eq.${studentId}`,
        },
        async () => {
          await loadUnreadCount()
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [studentId])

  return unreadCount
}
