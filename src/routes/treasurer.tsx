import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { AppLayout } from '@/components/AppLayout'
import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'
import { homePathForRole } from '@/lib/roles'

const TREASURER_ROLES = ['treasurer', 'admin']

export const Route = createFileRoute('/treasurer')({
  beforeLoad: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw redirect({ to: '/login' })
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!TREASURER_ROLES.includes(profile?.role || '')) {
      throw redirect({ to: homePathForRole(profile?.role) })
    }
  },
  component: TreasurerLayout,
})

function TreasurerLayout() {
  const [userName, setUserName] = useState('')
  
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserName(user.user_metadata?.full_name || user.email || '')
    })
  }, [])

  return (
    <AppLayout role="treasurer" userName={userName}>
      <Outlet />
    </AppLayout>
  )
}
