import { Link, useRouterState } from '@tanstack/react-router'
import { useState } from 'react'
import {
  LayoutDashboard, Users, BookOpen, GraduationCap, UserCheck,
  ClipboardList, Star, Calendar, FileText, Bell, Settings,
  BookMarked, BarChart3, ClipboardCheck, Link2, MessageCircle, DollarSign, MoreHorizontal, X
} from 'lucide-react'
import { useUnreadMessages } from '@/hooks/useUnreadMessages'

const studentNav = [
  { label: 'Inicio', href: '/dashboard', icon: <LayoutDashboard size={20} /> },
  { label: 'Cursadas', href: '/dashboard/subjects', icon: <BookOpen size={20} /> },
  { label: 'Horario', href: '/dashboard/schedules', icon: <Calendar size={20} /> },
  { label: 'Exámenes', href: '/dashboard/exams', icon: <BookMarked size={20} /> },
  { label: 'Mensajes', href: '/dashboard/messages', icon: <MessageCircle size={20} /> },
  { label: 'Más', href: '#', icon: <MoreHorizontal size={20} />, isMore: true },
]

const professorNav = [
  { label: 'Inicio', href: '/professor', icon: <LayoutDashboard size={20} /> },
  { label: 'Asignaturas', href: '/professor/subjects', icon: <BookOpen size={20} /> },
  { label: 'Calificaciones', href: '/professor/grades', icon: <Star size={20} /> },
  { label: 'Asistencia', href: '/professor/attendance', icon: <ClipboardCheck size={20} /> },
  { label: 'Mensajes', href: '/professor/messages', icon: <MessageCircle size={20} /> },
  { label: 'Más', href: '#', icon: <MoreHorizontal size={20} />, isMore: true },
]

const adminNav = [
  { label: 'Inicio', href: '/admin', icon: <LayoutDashboard size={20} /> },
  { label: 'Estudiantes', href: '/admin/students', icon: <Users size={20} /> },
  { label: 'Docentes', href: '/admin/professors', icon: <UserCheck size={20} /> },
  { label: 'Asignaturas', href: '/admin/subjects', icon: <BookOpen size={20} /> },
  { label: 'Reportes', href: '/admin/reports', icon: <BarChart3 size={20} /> },
  { label: 'Más', href: '#', icon: <MoreHorizontal size={20} />, isMore: true },
]

const treasurerNav = [
  { label: 'Inicio', href: '/treasurer', icon: <LayoutDashboard size={20} /> },
  { label: 'Pagos', href: '/treasurer/payments', icon: <DollarSign size={20} /> },
  { label: 'Configuración', href: '/treasurer/configuration', icon: <Settings size={20} /> },
]

interface BottomNavProps {
  role: 'admin' | 'student' | 'professor' | 'treasurer'
}

export function BottomNav({ role }: BottomNavProps) {
  const router = useRouterState()
  const currentPath = router.location.pathname
  const unreadMessages = useUnreadMessages()
  const [showMoreMenu, setShowMoreMenu] = useState(false)

  let navItems = studentNav

  if (role === 'admin') {
    navItems = adminNav
  } else if (role === 'professor') {
    navItems = professorNav
  } else if (role === 'treasurer') {
    navItems = treasurerNav
  }

  const isActive = (href: string) => {
    if (href === '#') return false
    return currentPath === href || currentPath.startsWith(href.split('/').slice(0, -1).join('/'))
  }

  const primaryItems = navItems.slice(0, navItems.length - 1)
  const moreItem = navItems[navItems.length - 1]

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 md:hidden z-40 border-t shadow-lg"
        style={{
          backgroundColor: 'var(--siu-panel)',
          borderColor: 'var(--siu-border)',
        }}
      >
        <div className="flex justify-around items-stretch">
          {primaryItems.map((item) => {
            const active = isActive(item.href)
            const isBadge = item.href.includes('messages') && unreadMessages > 0

            return (
              <Link
                key={item.href}
                to={item.href}
                className="flex-1 flex flex-col items-center justify-center py-2.5 px-2 relative transition-colors"
                style={{
                  color: active ? 'var(--isipp-bordo)' : 'var(--siu-text-muted)',
                  borderTop: active ? '3px solid var(--isipp-bordo)' : '3px solid transparent',
                  minHeight: '56px',
                }}
                title={item.label}
              >
                <div className="relative flex items-center justify-center">
                  {item.icon}
                  {isBadge && (
                    <span
                      className="absolute -top-1 -right-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-white text-[10px] font-bold"
                      style={{ backgroundColor: '#dc2626' }}
                    >
                      {unreadMessages > 9 ? '9+' : unreadMessages}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-1 text-center font-semibold truncate max-w-full">
                  {item.label}
                </span>
              </Link>
            )
          })}

          {/* More Menu Button */}
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className="flex-1 flex flex-col items-center justify-center py-2.5 px-2 transition-colors relative"
            style={{
              color: showMoreMenu ? 'var(--isipp-bordo)' : 'var(--siu-text-muted)',
              borderTop: showMoreMenu ? '3px solid var(--isipp-bordo)' : '3px solid transparent',
              minHeight: '56px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
            title="Más opciones"
            aria-label="Más opciones"
            aria-expanded={showMoreMenu}
          >
            <div className="relative flex items-center justify-center">
              {showMoreMenu ? <X size={20} /> : <MoreHorizontal size={20} />}
            </div>
            <span className="text-[10px] mt-1 text-center font-semibold truncate">
              {moreItem.label}
            </span>
          </button>
        </div>
      </nav>

      {/* More Menu Modal - Mobile only */}
      {showMoreMenu && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={() => setShowMoreMenu(false)}
            aria-hidden="true"
          />
          <div
            className="fixed bottom-16 left-0 right-0 z-50 md:hidden max-h-96 overflow-y-auto rounded-t-lg shadow-xl"
            style={{
              backgroundColor: 'var(--siu-panel)',
              borderColor: 'var(--siu-border)',
            }}
          >
            <nav className="divide-y" style={{ borderColor: 'var(--siu-border-light)' }}>
              {navItems
                .filter(item => item.href !== '#')
                .map((item) => {
                  const active = isActive(item.href)
                  const isBadge = item.href.includes('messages') && unreadMessages > 0

                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setShowMoreMenu(false)}
                      className="flex items-center gap-3 px-4 py-3 transition-colors"
                      style={{
                        backgroundColor: active ? 'var(--siu-blue-soft)' : 'transparent',
                        color: active ? 'var(--isipp-bordo-dark)' : 'var(--siu-text)',
                      }}
                    >
                      <div className="relative flex items-center justify-center flex-shrink-0">
                        {item.icon}
                        {isBadge && (
                          <span
                            className="absolute -top-2 -right-2 inline-flex h-5 w-5 items-center justify-center rounded-full text-white text-[10px] font-bold"
                            style={{ backgroundColor: '#dc2626' }}
                          >
                            {unreadMessages > 9 ? '9+' : unreadMessages}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-medium flex-1">{item.label}</span>
                      {active && (
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: 'var(--isipp-bordo)' }}
                        />
                      )}
                    </Link>
                  )
                })}
            </nav>
          </div>
        </>
      )}
    </>
  )
}
