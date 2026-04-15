import { Outlet, useRouterState } from '@tanstack/react-router'
import { Sidebar } from './Sidebar'
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
      // Cerrar sidebar en mobile cuando cambia de ruta
      if (mobile) {
        setSidebarOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Cerrar sidebar al cambiar de ruta en mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }, [router.location.pathname, isMobile])

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
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

      {/* Sidebar - Fixed position on mobile, absolute positioning with transform */}
      <div
        className={`
          fixed md:relative z-40 h-screen
          transform transition-transform duration-300 ease-in-out
          ${isMobile ? (sidebarOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}
          md:translate-x-0
          w-64 md:w-64 flex-shrink-0
        `}
      >
        <Sidebar role={role} />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto flex flex-col w-full">
        {/* Add padding on mobile to account for hamburger menu */}
        <div className={`flex-1 overflow-auto ${isMobile ? 'pt-16' : ''}`}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
