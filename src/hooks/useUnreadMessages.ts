import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export function useUnreadMessages() {
  const [unreadCount, setUnreadCount] = useState(0)

  const loadUnreadCount = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!student) {
        // Es profesor
        const { data: professor } = await supabase
          .from('professors')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle()

        if (!professor) return

        // Contar mensajes no leídos para profesor (enviados por estudiantes)
        const { count } = await supabase
          .from('messages')
          .select('id', { count: 'exact' })
          .eq('sender_type', 'student')
          .eq('read', false)

        setUnreadCount(count || 0)
        return
      }

      // Contar mensajes no leídos para alumno (enviados por profesores)
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact' })
        .eq('sender_type', 'professor')
        .eq('read', false)

      setUnreadCount(count || 0)
    } catch (err) {
      console.error('Error loading unread count:', err)
    }
  }, [])

  useEffect(() => {
    void loadUnreadCount()

    // Suscribirse a cambios en tiempo real
    const subscription = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        () => {
          void loadUnreadCount()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [loadUnreadCount])

  return unreadCount
}
