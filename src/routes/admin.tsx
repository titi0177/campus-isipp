import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { AppLayout } from '@/components/AppLayout'
import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'
import { homePathForRole, isStaffRole } from '@/lib/roles'

export const Route = createFileRoute('/admin')({
  beforeLoad: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw redirect({ to: '/login' })
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!isStaffRole(profile?.role)) {
      throw redirect({ to: homePathForRole(profile?.role) })
    }
  },
  component: AdminLayout,
})

function AdminLayout() {
  const [userName, setUserName] = useState('')
  
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserName(user.user_metadata?.full_name || user.email || '')
    })
  }, [])

  return (
    <AppLayout role="admin" userName={userName}>
      <Outlet />
    </AppLayout>
  )
}
