import { Link, useRouterState } from '@tanstack/react-router'
import {
  LayoutDashboard, Users, BookOpen, GraduationCap, UserCheck,
  ClipboardList, Star, Calendar, FileText, Bell, Settings,
  BookMarked, BarChart3, ClipboardCheck, Link2, MessageCircle, DollarSign, MoreHorizontal
} from 'lucide-react'
import { useUnreadMessages } from '@/hooks/useUnreadMessages'

const studentNav = [
  { label: 'Inicio', href: '/dashboard', icon: <LayoutDashboard size={20} /> },
  { label: 'Cursadas', href: '/dashboard/subjects', icon: <BookOpen size={20} /> },
  { label: 'Horario', href: '/dashboard/schedules', icon: <Calendar size={20} /> },
  { label: 'Exámenes', href: '/dashboard/exams', icon: <BookMarked size={20} /> },
  { label: 'Mensajes', href: '/dashboard/messages', icon: <MessageCircle size={20} /> },
  { label: 'Más', href: '#', icon: <MoreHorizontal size={20} /> },
]

const professorNav = [
  { label: 'Inicio', href: '/professor', icon: <LayoutDashboard size={20} /> },
  { label: 'Asignaturas', href: '/professor/subjects', icon: <BookOpen size={20} /> },
  { label: 'Calificaciones', href: '/professor/grades', icon: <Star size={20} /> },
  { label: 'Asistencia', href: '/professor/attendance', icon: <ClipboardCheck size={20} /> },
  { label: 'Mensajes', href: '/professor/messages', icon: <MessageCircle size={20} /> },
  { label: 'Más', href: '#', icon: <MoreHorizontal size={20} /> },
]

const adminNav = [
  { label: 'Inicio', href: '/admin', icon: <LayoutDashboard size={20} /> },
  { label: 'Estudiantes', href: '/admin/students', icon: <Users size={20} /> },
  { label: 'Docentes', href: '/admin/professors', icon: <UserCheck size={20} /> },
  { label: 'Asignaturas', href: '/admin/subjects', icon: <BookOpen size={20} /> },
  { label: 'Reportes', href: '/admin/reports', icon: <BarChart3 size={20} /> },
  { label: 'Más', href: '#', icon: <MoreHorizontal size={20} /> },
]

const treasurerNav = [
  { label: 'Inicio', href: '/treasurer', icon: <LayoutDashboard size={20} /> },
  { label: 'Pagos', href: '/treasurer/payments', icon: <DollarSign size={20} /> },
  { label: 'Configuración', href: '/treasurer/configuration', icon: <Settings size={20} /> },
  { label: 'Más', href: '#', icon: <MoreHorizontal size={20} /> },
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
    navItems = adminNav
  } else if (role === 'professor') {
    navItems = professorNav
  } else if (role === 'treasurer') {
    navItems = treasurerNav
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:hidden z-40 bg-white border-t border-slate-200 shadow-lg">
      <div className="flex justify-around">
        {navItems.map((item) => {
          const isActive = currentPath === item.href || currentPath.startsWith(item.href.split('/').slice(0, -1).join('/'))
          const isBadge = item.href.includes('messages') && unreadMessages > 0

          return (
            <Link
              key={item.href}
              to={item.href}
              className={`
                flex flex-col items-center justify-center py-2.5 px-3 flex-1 min-h-[60px] relative
                transition-colors
                ${isActive 
                  ? 'text-[var(--isipp-bordo)] border-t-2 border-t-[var(--isipp-bordo)]' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }
              `}
            >
              <div className="relative flex items-center justify-center">
                {item.icon}
                {isBadge && (
                  <span className="absolute -top-1 -right-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
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
  )
}
