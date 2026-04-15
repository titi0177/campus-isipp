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

  // Desktop layout: sidebar + content
  if (!isMobile) {
    return (
      <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--siu-page-bg)' }}>
        {/* Sidebar - Always visible on desktop */}
        <div className="w-64 flex-shrink-0 border-r overflow-y-auto" style={{ borderColor: 'var(--siu-border)' }}>
          <Sidebar role={role} />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto">
            <div className="p-4 sm:p-5 md:p-6">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Mobile layout: hamburger menu + full-screen overlay sidebar + bottom nav
  return (
    <div className="flex h-screen overflow-hidden flex-col" style={{ backgroundColor: 'var(--siu-page-bg)' }}>
      {/* Menu Button - Mobile only */}
      <button
        onClick={toggleSidebar}
        className="fixed top-3 left-3 z-50 p-2.5 rounded-lg shadow-md transition-all hover:shadow-lg active:scale-95"
        style={{
          backgroundColor: 'var(--siu-panel)',
          color: 'var(--isipp-bordo)'
        }}
        aria-label={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
        title={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Overlay for sidebar */}
      {sidebarOpen && (
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

      {/* Main Content Area - Mobile */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto">
          <div className="pt-16 pb-20 px-3 sm:px-4">
            <Outlet />
          </div>
        </div>
      </div>

      {/* Bottom Navigation - Mobile only */}
      <BottomNav role={role} />
    </div>
  )
}
