import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { AppLayout } from '@/components/AppLayout'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { homePathForRole } from '@/lib/roles'

const PROFESSOR_ROLES = ['profesor', 'professor', 'admin', 'operador', 'operator']

export const Route = createFileRoute('/inasistencia-docente')({
  beforeLoad: async () => {
    console.log('🔵 inasistencia-docente.tsx beforeLoad CALLED')
    const { data: { user } } = await supabase.auth.getUser()
    console.log('👤 User:', user?.id)
    if (!user) {
      console.log('❌ No user - redirecting to /login')
      throw redirect({ to: '/login' })
    }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    console.log('👨‍💼 Profile role:', profile?.role)
    if (!PROFESSOR_ROLES.includes(profile?.role || '')) {
      console.log('❌ Invalid role - redirecting')
      throw redirect({ to: homePathForRole(profile?.role) })
    }
    console.log('✅ beforeLoad passed')
  },
  component: InasistenciaLayout,
})

function InasistenciaLayout() {
  console.log('🟡 InasistenciaLayout component RENDERED')
  const [userName, setUserName] = useState('')
  
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserName(user.user_metadata?.full_name || user.email || '')
      }
    })
  }, [])

  return (
    <AppLayout role="professor" userName={userName}>
      <Outlet />
    </AppLayout>
  )
}
