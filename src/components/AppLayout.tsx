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
    if (isMobile) {
      setSidebarOpen(false)
    }
  }, [router.location.pathname, isMobile])

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden flex-col md:flex-row">
      {/* Mobile Menu Button */}
      {isMobile && (
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md md:hidden hover:bg-gray-100 transition-colors"
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      )}

      {/* Overlay for mobile */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Hidden on mobile, visible on desktop */}
      <div
        className={`
          ${isMobile ? 'hidden' : 'block'}
          md:block md:relative md:h-screen md:w-64 md:flex-shrink-0
        `}
      >
        <Sidebar role={role} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 z-40 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-screen w-64 bg-white shadow-lg overflow-y-auto">
            <Sidebar role={role} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto flex flex-col w-full">
        {/* Add padding on mobile to account for hamburger menu and bottom nav */}
        <div className={`flex-1 overflow-auto ${isMobile ? 'pt-16 pb-20' : ''}`}>
          <Outlet />
        </div>
      </div>

      {/* Bottom Navigation - Mobile only */}
      {isMobile && <BottomNav role={role} />}
    </div>
  )
}
