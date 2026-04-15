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

  // DESKTOP LAYOUT: Sidebar fijo (w-64) + Content scrolleable
  if (!isMobile) {
    return (
      <div className="app-layout-desktop">
        {/* Fixed Sidebar - Left Column */}
        <aside className="app-sidebar-desktop">
          <Sidebar role={role} />
        </aside>

        {/* Main Content Area - Right Column */}
        <div className="app-content-desktop">
          {/* TopNav - Sticky */}
          <TopNav userName={userName} role={role} />

          {/* Scrollable Content */}
          <main className="app-main-scrollable">
            <div className="app-main-padding">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    )
  }

  // MOBILE LAYOUT: Header + Drawer Sidebar + Scrollable Content + BottomNav
  return (
    <div className="app-layout-mobile">
      {/* Header with Menu Button */}
      <header className="app-header-mobile">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="app-menu-button"
          aria-label="Abrir menú"
          aria-expanded={sidebarOpen}
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <h1 className="app-header-title">Campus ISIPP</h1>
      </header>

      {/* Sidebar Drawer Overlay - Mobile Only */}
      {sidebarOpen && (
        <>
          <div
            className="app-sidebar-overlay"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <div className="app-sidebar-drawer">
            <Sidebar role={role} />
          </div>
        </>
      )}

      {/* Scrollable Content - Takes remaining space */}
      <main className="app-main-mobile">
        <div className="app-main-padding-mobile">
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation - Fixed */}
      <BottomNav role={role} />
    </div>
  )
}
