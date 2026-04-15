import { Outlet, useRouterState } from '@tanstack/react-router'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'

interface AppLayoutProps {
  role?: 'admin' | 'student' | 'professor' | 'treasurer'
}

export function AppLayout({ role = 'student' }: AppLayoutProps) {
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

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Menu Button - Both mobile and desktop */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md hover:bg-gray-100 transition-colors"
        aria-label="Toggle menu"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Modal/Overlay style */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 overflow-hidden pointer-events-none">
          <div className="absolute inset-y-0 left-0 w-64 bg-white shadow-lg overflow-y-auto pointer-events-auto">
            <Sidebar role={role} />
          </div>
        </div>
      )}

      {/* Main Content - Full width */}
      <div className="flex-1 overflow-auto flex flex-col w-full">
        {/* Add padding on mobile to account for hamburger menu and bottom nav */}
        <div className={`flex-1 overflow-auto ${isMobile ? 'pt-16 pb-20' : 'pt-16'}`}>
          <Outlet />
        </div>
      </div>

      {/* Bottom Navigation - Mobile only */}
      {isMobile && <BottomNav role={role} />}
    </div>
  )
}
