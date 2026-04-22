import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function useUserSession() {
  useEffect(() => {
    const updateSession = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user?.id) {
          console.log('❌ No user found')
          return
        }

        console.log('👤 Updating session for user:', user.email)

        let userName = user.email?.split('@')[0] || 'User'
        let userRole = 'student'

        // Determinar rol basándose en si existe en la tabla students o professors
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
              console.log('✅ Found as student:', userName)
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
                console.log('✅ Found as professor:', userName)
              }
            } else {
              userRole = 'admin'
              console.log('✅ Determined as admin')
            }
          }
        } catch (err) {
          console.error('Error determining user role:', err)
        }

        // Simple update approach - just update, don't try to insert
        const { error: updateError, data: updateData } = await supabase
          .from('user_sessions')
          .update({
            user_name: userName,
            user_role: userRole,
            user_email: user.email,
            last_seen: new Date().toISOString(),
          })
          .eq('user_id', user.id)
          .select()

        if (updateError) {
          console.log('⚠️ Update failed, trying insert:', updateError.message)
          // If update didn't find a record, insert
          try {
            const { error: insertError, data: insertData } = await supabase
              .from('user_sessions')
              .insert({
                user_id: user.id,
                user_name: userName,
                user_role: userRole,
                user_email: user.email,
                last_seen: new Date().toISOString(),
              })
              .select()

            if (insertError) {
              console.error('❌ Insert error:', insertError)
            } else {
              console.log('✅ Session inserted successfully')
            }
          } catch (insertErr) {
            console.error('❌ Error inserting session:', insertErr)
          }
        } else {
          console.log('✅ Session updated successfully')
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
