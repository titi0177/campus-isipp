import { Outlet, useRouterState } from '@tanstack/react-router'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { useState, useEffect, useCallback } from 'react'
import { Menu, X } from 'lucide-react'

interface AppLayoutProps {
  role?: 'admin' | 'student' | 'professor' | 'treasurer'
}

export function AppLayout({ role = 'student' }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const router = useRouterState()

  const handleResize = useCallback(() => {
    const mobile = window.innerWidth < 768
    setIsMobile(mobile)
    if (mobile) {
      setSidebarOpen(false)
    }
  }, [])

  useEffect(() => {
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [handleResize])

  useEffect(() => {
    setSidebarOpen(false)
  }, [router.location.pathname])

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev)
  }, [])

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--siu-page-bg)' }}>
      {/* Menu Button - Mobile only */}
      <button
        onClick={toggleSidebar}
        className="fixed top-3 md:top-4 left-3 md:left-4 z-50 md:hidden p-2.5 rounded-lg shadow-md transition-all hover:shadow-lg active:scale-95"
        style={{
          backgroundColor: 'var(--siu-panel)',
          color: 'var(--isipp-bordo)'
        }}
        aria-label={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
        title={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar - Desktop always visible, Mobile as overlay */}
      <div className="hidden md:flex md:w-64 md:flex-shrink-0 md:border-r" style={{ borderColor: 'var(--siu-border)' }}>
        <Sidebar role={role} />
      </div>

      {/* Mobile Overlay for sidebar */}
      {isMobile && sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-30 transition-opacity"
            onClick={closeSidebar}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 z-40 w-64 overflow-y-auto shadow-xl" style={{ backgroundColor: 'var(--siu-sidebar-bg)' }}>
            <Sidebar role={role} />
          </div>
        </>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Content with proper padding for mobile */}
        <div className="flex-1 overflow-auto">
          <div className={isMobile ? 'pt-16 pb-20 px-3 sm:px-4' : 'p-4 sm:p-5 md:p-6'}>
            <Outlet />
          </div>
        </div>
      </div>

      {/* Bottom Navigation - Mobile only */}
      {isMobile && <BottomNav role={role} />}
    </div>
  )
}
