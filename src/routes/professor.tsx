import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { AppLayout } from '@/components/AppLayout'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { homePathForRole } from '@/lib/roles'

const PROFESSOR_ROLES = ['profesor', 'professor', 'admin', 'operador', 'operator']

export const Route = createFileRoute('/professor')({
  beforeLoad: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw redirect({ to: '/login' })
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!PROFESSOR_ROLES.includes(profile?.role || '')) {
      throw redirect({ to: homePathForRole(profile?.role) })
    }
  },
  component: ProfessorLayout,
})

function ProfessorLayout() {
  const [userName, setUserName] = useState('')
  
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserName(user.user_metadata?.full_name || user.email || '')
    })
  }, [])

  return (
    <AppLayout role="professor" userName={userName}>
      <Outlet />
    </AppLayout>
  )
}
