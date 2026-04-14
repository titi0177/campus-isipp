import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { Sidebar } from '@/components/Sidebar'
import { TopNav } from '@/components/TopNav'
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
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Sidebar role="professor" />
      <div className="ml-64 flex min-h-screen flex-1 flex-col">
        <TopNav userName={userName} role="professor" />
        <main className="flex-1 overflow-auto border-t border-slate-200 p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
