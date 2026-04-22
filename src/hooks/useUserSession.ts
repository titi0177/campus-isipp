import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function useUserSession() {
  useEffect(() => {
    const updateSession = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user?.id) return

        let userName = user.email?.split('@')[0] || 'User'
        let userRole = 'student'

        // Determinar rol basándose en si existe en la tabla students o professors
        // Usar una consulta simple sin filtros complejos
        try {
          const { count: studentCount } = await supabase
            .from('students')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)

          if (studentCount && studentCount > 0) {
            const { data: student } = await supabase
              .from('students')
              .select('first_name, last_name')
              .eq('user_id', user.id)
              .limit(1)

            if (student && student.length > 0) {
              userName = `${student[0].first_name} ${student[0].last_name}`
              userRole = 'student'
            }
          } else {
            const { count: profCount } = await supabase
              .from('professors')
              .select('id', { count: 'exact', head: true })
              .eq('user_id', user.id)

            if (profCount && profCount > 0) {
              const { data: professor } = await supabase
                .from('professors')
                .select('first_name, last_name')
                .eq('user_id', user.id)
                .limit(1)

              if (professor && professor.length > 0) {
                userName = `${professor[0].first_name} ${professor[0].last_name}`
                userRole = 'professor'
              }
            } else {
              userRole = 'admin'
            }
          }
        } catch (err) {
          console.error('Error determining user role:', err)
        }

        // Simple update approach - just update, don't try to insert
        const { error } = await supabase
          .from('user_sessions')
          .update({
            user_name: userName,
            user_role: userRole,
            user_email: user.email,
            last_seen: new Date().toISOString(),
          })
          .eq('user_id', user.id)

        // If update didn't find a record, insert
        if (error || !user.id) {
          try {
            await supabase
              .from('user_sessions')
              .insert({
                user_id: user.id,
                user_name: userName,
                user_role: userRole,
                user_email: user.email,
                last_seen: new Date().toISOString(),
              })
          } catch (insertErr) {
            console.error('Error inserting session:', insertErr)
          }
        }
      } catch (err) {
        console.error('Error updating user session:', err)
      }
    }

    updateSession()
    const interval = setInterval(updateSession, 30000)

    return () => clearInterval(interval)
  }, [])
}
