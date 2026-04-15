import { Link, useRouterState } from '@tanstack/react-router'
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
  { label: 'Asistencia', href: '/dashboard/attendance', icon: <ClipboardCheck size={20} /> },
  { label: 'Plan de estudios', href: '/dashboard/roadmap', icon: <GraduationCap size={20} /> },
  { label: 'Historial', href: '/dashboard/history', icon: <FileText size={20} /> },
  { label: 'Exámenes', href: '/dashboard/exams', icon: <BookMarked size={20} /> },
  { label: 'Pagos', href: '/dashboard/payments', icon: <DollarSign size={20} /> },
  { label: 'Materiales', href: '/dashboard/materials', icon: <BookOpen size={20} /> },
  { label: 'Mensajes', href: '/dashboard/messages', icon: <MessageCircle size={20} /> },
  { label: 'Novedades', href: '/dashboard/announcements', icon: <Bell size={20} /> },
  { label: 'Perfil', href: '/dashboard/profile', icon: <UserCheck size={20} /> },
]

const professorNav = [
  { label: 'Inicio', href: '/professor', icon: <LayoutDashboard size={20} /> },
  { label: 'Asignaturas', href: '/professor/subjects', icon: <BookOpen size={20} /> },
  { label: 'Horario', href: '/professor/schedules', icon: <Calendar size={20} /> },
  { label: 'Calificaciones', href: '/professor/grades', icon: <Star size={20} /> },
  { label: 'Asistencia', href: '/professor/attendance', icon: <ClipboardCheck size={20} /> },
  { label: 'Materiales', href: '/professor/materials', icon: <FileText size={20} /> },
  { label: 'Mensajes', href: '/professor/messages', icon: <MessageCircle size={20} /> },
  { label: 'Seguridad', href: '/professor/settings', icon: <Settings size={20} /> },
]

const adminNav = [
  { label: 'Inicio', href: '/admin', icon: <LayoutDashboard size={20} /> },
  { label: 'Estudiantes', href: '/admin/students', icon: <Users size={20} /> },
  { label: 'Programas', href: '/admin/programs', icon: <GraduationCap size={20} /> },
  { label: 'Asignaturas', href: '/admin/subjects', icon: <BookOpen size={20} /> },
  { label: 'Docentes', href: '/admin/professors', icon: <UserCheck size={20} /> },
  { label: 'Horarios', href: '/admin/schedules', icon: <Calendar size={20} /> },
  { label: 'Inscripciones', href: '/admin/enrollments', icon: <ClipboardList size={20} /> },
  { label: 'Calificaciones', href: '/admin/grades', icon: <Star size={20} /> },
  { label: 'Asistencia', href: '/admin/attendance', icon: <ClipboardCheck size={20} /> },
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

  let navItems = studentNav

  if (role === 'admin') {
    navItems = adminNav.filter(item => item.href !== '#')
  } else if (role === 'professor') {
    navItems = professorNav
  } else if (role === 'treasurer') {
    navItems = treasurerNav
  }

  const isActive = (href: string) => {
    if (href === '#') return false
    return currentPath === href || currentPath.startsWith(href.split('/').slice(0, -1).join('/'))
  }

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t shadow-lg"
        style={{
          backgroundColor: 'var(--siu-panel)',
          borderColor: 'var(--siu-border)',
        }}
      >
        <div className="flex justify-around items-stretch overflow-x-auto">
          {navItems.map((item) => {
            const active = isActive(item.href)
            const isBadge = item.href.includes('messages') && unreadMessages > 0

            return (
              <Link
                key={item.href}
                to={item.href}
                className="flex flex-col items-center justify-center py-2.5 px-2 relative transition-colors flex-shrink-0"
                style={{
                  color: active ? 'var(--isipp-bordo)' : 'var(--siu-text-muted)',
                  borderTop: active ? '3px solid var(--isipp-bordo)' : '3px solid transparent',
                  minHeight: '56px',
                  minWidth: '56px',
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
        </div>
      </nav>
    </>
  )
}
