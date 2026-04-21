import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { AppLayout } from '@/components/AppLayout'
import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'
import { homePathForRole } from '@/lib/roles'
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw redirect({ to: '/login' })
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const dest = homePathForRole(profile?.role)
    if (dest !== '/dashboard') throw redirect({ to: dest })
  },
  component: DashboardLayout,
})

function DashboardLayout() {
  const [userName, setUserName] = useState('')
  const [userId, setUserId] = useState('')
  
  // Cargar datos del usuario
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserName(user.user_metadata?.full_name || user.email || '')
        setUserId(user.id)
      }
    })
  }, [])

  // Activar notificaciones en tiempo real cuando tenemos el userId
  useRealtimeNotifications(userId || undefined)

  return (
    <AppLayout role="student" userName={userName}>
      <Outlet />
    </AppLayout>
  )
}
