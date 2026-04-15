import { Outlet, useRouterState } from '@tanstack/react-router'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { TopNav } from './TopNav'
import { useState, useEffect, useCallback } from 'react'
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

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ backgroundColor: 'var(--siu-page-bg)' }}>
      {/* DESKTOP: Sidebar fijo a la izquierda */}
      <div className="hidden md:flex md:w-64 md:flex-shrink-0 md:flex-col h-full overflow-hidden" style={{ backgroundColor: 'var(--siu-sidebar-bg)', borderRight: `1px solid var(--siu-border)` }}>
        <Sidebar role={role} />
      </div>

      {/* MOBILE: Sidebar overlay */}
      {isMobile && sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-30"
            onClick={closeSidebar}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 z-40 w-64 overflow-y-auto flex flex-col h-full" style={{ backgroundColor: 'var(--siu-sidebar-bg)' }}>
            <Sidebar role={role} />
          </div>
        </>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* TopNav - Desktop only */}
        <div className="hidden md:block">
          <TopNav userName={userName} role={role} />
        </div>

        {/* Mobile Header with Menu Button */}
        {isMobile && (
          <div className="flex items-center gap-3 px-3 py-3 border-b" style={{ backgroundColor: 'var(--siu-panel)', borderColor: 'var(--siu-border)' }}>
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
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <div className={isMobile ? 'px-3 sm:px-4 py-4 pb-20' : 'p-4 sm:p-5 md:p-6'}>
            <Outlet />
          </div>
        </div>
      </div>

      {/* Bottom Nav - Mobile only */}
      {isMobile && <BottomNav role={role} />}
    </div>
  )
}
