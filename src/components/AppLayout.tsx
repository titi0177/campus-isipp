import { Outlet } from '@tanstack/react-router'
import { Sidebar } from './Sidebar'

interface AppLayoutProps {
  role?: 'admin' | 'student' | 'professor' | 'treasurer'
}

export function AppLayout({ role = 'student' }: AppLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar role={role} />

      {/* Contenido principal */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  )
}
