import { Outlet, useRouterState } from '@tanstack/react-router'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { TopNav } from './TopNav'
import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'

interface AppLayoutProps {
  role?: 'admin' | 'student' | 'professor' | 'treasurer'
  userName?: string
}

export function AppLayout({ role = 'student', userName = 'Usuario' }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const router = useRouterState()

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) {
        setSidebarOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    setSidebarOpen(false)
  }, [router.location.pathname])

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)
  const closeSidebar = () => setSidebarOpen(false)

  // DESKTOP LAYOUT
  if (!isMobile) {
    return (
      <div className="flex h-screen w-full" style={{ backgroundColor: 'var(--siu-page-bg)' }}>
        {/* Sidebar - Fijo a la izquierda */}
        <div className="w-64 flex-shrink-0 overflow-y-auto" style={{ backgroundColor: 'var(--siu-sidebar-bg)', borderRight: `1px solid var(--siu-border)` }}>
          <Sidebar role={role} />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col h-screen">
          {/* TopNav */}
          <div className="flex-shrink-0">
            <TopNav userName={userName} role={role} />
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 sm:p-5 md:p-6">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // MOBILE LAYOUT
  return (
    <div className="flex flex-col h-screen w-full" style={{ backgroundColor: 'var(--siu-page-bg)' }}>
      {/* Mobile Header */}
      <div className="flex-shrink-0 flex items-center gap-3 px-3 py-3 border-b" style={{ backgroundColor: 'var(--siu-panel)', borderColor: 'var(--siu-border)' }}>
        <button
          onClick={toggleSidebar}
          className="p-2.5 rounded-lg transition-all hover:shadow-lg active:scale-95"
          style={{
            backgroundColor: 'var(--siu-page-bg)',
            color: 'var(--isipp-bordo)'
          }}
          aria-label={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <h2 className="text-sm font-semibold text-slate-900 truncate">Campus ISIPP</h2>
      </div>

      {/* Sidebar Overlay - Mobile */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-30"
            onClick={closeSidebar}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 z-40 w-64 overflow-y-auto flex flex-col" style={{ backgroundColor: 'var(--siu-sidebar-bg)', marginTop: '56px' }}>
            <Sidebar role={role} />
          </div>
        </>
      )}

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="px-3 sm:px-4 py-4">
          <Outlet />
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav role={role} />
    </div>
  )
}
