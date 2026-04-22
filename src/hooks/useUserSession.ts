import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function useUserSession() {
  useEffect(() => {
    const updateSession = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Get user name and role
        let userName = user.email?.split('@')[0] || 'User'
        let userRole = 'student'

        const { data: student } = await supabase
          .from('students')
          .select('first_name, last_name')
          .eq('user_id', user.id)
          .maybeSingle()

        if (student) {
          userName = `${student.first_name} ${student.last_name}`
        } else {
          const { data: professor } = await supabase
            .from('professors')
            .select('first_name, last_name')
            .eq('user_id', user.id)
            .maybeSingle()

          if (professor) {
            userName = `${professor.first_name} ${professor.last_name}`
            userRole = 'professor'
          }
        }

        // Upsert session
        await supabase.from('user_sessions').upsert(
          {
            user_id: user.id,
            user_name: userName,
            user_role: userRole,
            user_email: user.email,
            last_seen: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )
      } catch (err) {
        console.error('Error updating user session:', err)
      }
    }

    updateSession()
    const interval = setInterval(updateSession, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [])
}
