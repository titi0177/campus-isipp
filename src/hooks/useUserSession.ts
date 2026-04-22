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

        // Check if student
        const { data: student, error: studentError } = await supabase
          .from('students')
          .select('first_name, last_name')
          .eq('user_id', user.id)
          .maybeSingle()

        if (student && !studentError) {
          userName = `${student.first_name} ${student.last_name}`
          userRole = 'student'
        } else {
          // Check if professor
          const { data: professor, error: professorError } = await supabase
            .from('professors')
            .select('first_name, last_name')
            .eq('user_id', user.id)
            .maybeSingle()

          if (professor && !professorError) {
            userName = `${professor.first_name} ${professor.last_name}`
            userRole = 'professor'
          } else {
            userRole = 'admin'
          }
        }

        // Insert or update session (use insert with do nothing on conflict for simpler RLS)
        const { error } = await supabase
          .from('user_sessions')
          .insert({
            user_id: user.id,
            user_name: userName,
            user_role: userRole,
            user_email: user.email,
            last_seen: new Date().toISOString(),
          }, { 
            ignoreDuplicates: false // Allow upsert
          })
          .select()

        // If insert fails due to duplicate, try update
        if (error && error.code === 'PGRST116') {
          await supabase
            .from('user_sessions')
            .update({
              user_name: userName,
              user_role: userRole,
              last_seen: new Date().toISOString(),
            })
            .eq('user_id', user.id)
        }
      } catch (err) {
        console.error('Error updating user session:', err)
      }
    }

    updateSession()
    const interval = setInterval(updateSession, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [])
}
