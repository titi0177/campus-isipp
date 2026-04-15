import { Link, useRouterState } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard, Users, BookOpen, GraduationCap, UserCheck,
  ClipboardList, Star, Calendar, FileText, Bell, Settings,
  ChevronRight, LogOut, BookMarked, BarChart3, ClipboardCheck,
  Link2, MessageCircle, DollarSign
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useUnreadMessages } from '@/hooks/useUnreadMessages'

const LOGO_SRC = '/logo-isipp.png'
const LOGO_ALT = 'Instituto Superior de Informática Puerto Piray'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  badge?: number
}

const professorNav: NavItem[] = [
  { label: 'Inicio', href: '/professor', icon: <LayoutDashboard size={18} /> },
  { label: 'Mis asignaturas', href: '/professor/subjects', icon: <BookOpen size={18} /> },
  { label: 'Horario de clases', href: '/professor/schedules', icon: <Calendar size={18} /> },
  { label: 'Calificaciones', href: '/professor/grades', icon: <Star size={18} /> },
  { label: 'Asistencia', href: '/professor/attendance', icon: <ClipboardCheck size={18} /> },
  { label: 'Materiales', href: '/professor/materials', icon: <FileText size={18} /> },
  { label: 'Seguridad', href: '/professor/settings', icon: <Settings size={18} /> },
]

const adminNav: NavItem[] = [
  { label: 'Inicio', href: '/admin', icon: <LayoutDashboard size={18} /> },
  { label: 'Estudiantes', href: '/admin/students', icon: <Users size={18} /> },
  { label: 'Propuestas formativas', href: '/admin/programs', icon: <GraduationCap size={18} /> },
  { label: 'Asignaturas', href: '/admin/subjects', icon: <BookOpen size={18} /> },
  { label: 'Docentes', href: '/admin/professors', icon: <UserCheck size={18} /> },
  { label: 'Horarios', href: '/admin/schedules', icon: <Calendar size={18} /> },
  { label: 'Inscripciones a cursadas', href: '/admin/enrollments', icon: <ClipboardList size={18} /> },
  { label: 'Actas / Calificaciones', href: '/admin/grades', icon: <Star size={18} /> },
  { label: 'Asistencia', href: '/admin/attendance', icon: <ClipboardCheck size={18} /> },
  { label: 'Correlativas', href: '/admin/correlatives', icon: <Link2 size={18} /> },
  { label: 'Mesas de exámenes', href: '/admin/final-exams', icon: <BookMarked size={18} /> },
  { label: 'Actas de examen', href: '/admin/exam-records', icon: <FileText size={18} /> },
  { label: 'Novedades', href: '/admin/announcements', icon: <Bell size={18} /> },
  { label: 'Reportes y estadísticas', href: '/admin/reports', icon: <BarChart3 size={18} /> },
  { label: 'Tesorera', href: '/treasurer', icon: <DollarSign size={18} /> },
  { label: 'Parámetros / Seguridad', href: '/admin/settings', icon: <Settings size={18} /> },
]

const studentNav: NavItem[] = [
  { label: 'Inicio', href: '/dashboard', icon: <LayoutDashboard size={18} /> },
  { label: 'Mis cursadas', href: '/dashboard/subjects', icon: <BookOpen size={18} /> },
  { label: 'Mi horario', href: '/dashboard/schedules', icon: <Calendar size={18} /> },
  { label: 'Asistencia', href: '/dashboard/attendance', icon: <ClipboardCheck size={18} /> },
  { label: 'Plan de estudios', href: '/dashboard/roadmap', icon: <GraduationCap size={18} /> },
  { label: 'Historial académico', href: '/dashboard/history', icon: <FileText size={18} /> },
  { label: 'Inscripción a exámenes', href: '/dashboard/exams', icon: <BookMarked size={18} /> },
  { label: 'Estado de pagos', href: '/dashboard/payments', icon: <DollarSign size={18} /> },
  { label: 'Materiales de clase', href: '/dashboard/materials', icon: <BookOpen size={18} /> },
  { label: 'Mensajes', href: '/dashboard/messages', icon: <MessageCircle size={18} /> },
  { label: 'Novedades', href: '/dashboard/announcements', icon: <Bell size={18} /> },
  { label: 'Datos personales', href: '/dashboard/profile', icon: <UserCheck size={18} /> },
]

const treasurerNav: NavItem[] = [
  { label: 'Inicio', href: '/treasurer', icon: <LayoutDashboard size={18} /> },
  { label: 'Configuración', href: '/treasurer/configuration', icon: <DollarSign size={18} /> },
  { label: 'Pagos', href: '/treasurer/payments', icon: <ClipboardList size={18} /> },
  { label: 'Seguridad', href: '/treasurer/settings', icon: <Settings size={18} /> },
]

interface SidebarProps {
  role: 'admin' | 'student' | 'professor' | 'treasurer'
}

export function Sidebar({ role }: SidebarProps) {
  const router = useRouterState()
  const currentPath = router.location.pathname
  const unreadMessages = useUnreadMessages()
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  let navItems: NavItem[] = []
  let menuLabel = 'Menú'

  if (role === 'admin') {
    navItems = adminNav
    menuLabel = 'Menú de administración'
  } else if (role === 'professor') {
    navItems = [...professorNav]
    menuLabel = 'Menú docente'
    const messagesIdx = navItems.findIndex(item => item.href === '/professor/messages')
    if (messagesIdx !== -1 && unreadMessages > 0) {
      navItems[messagesIdx] = { ...navItems[messagesIdx], badge: unreadMessages }
    }
  } else if (role === 'treasurer') {
    navItems = treasurerNav
    menuLabel = 'Menú de Tesorera'
  } else {
    navItems = [...studentNav]
    menuLabel = 'Menú de autogestión'
    const messagesIdx = navItems.findIndex(item => item.href === '/dashboard/messages')
    if (messagesIdx !== -1 && unreadMessages > 0) {
      navItems[messagesIdx] = { ...navItems[messagesIdx], badge: unreadMessages }
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <aside className="sidebar h-full flex flex-col overflow-y-auto">
      {/* Logo Section - Responsive */}
      <div className="siu-sidebar-brand">
        <div className="siu-sidebar-logo-box">
          <img 
            src={LOGO_SRC} 
            alt={LOGO_ALT} 
            className="siu-sidebar-logo" 
            width={isMobile ? 160 : 220} 
            height={isMobile ? 88 : 120}
            loading="lazy"
          />
        </div>
        <p className="mt-2 md:mt-3 text-center text-[10px] md:text-[11px] font-semibold uppercase leading-snug tracking-wide text-white/90">
          Sistema de gestión académica
        </p>
      </div>

      {/* Menu Label */}
      <div className="siu-sidebar-section-label text-xs md:text-sm">
        {menuLabel}
      </div>

      {/* Navigation - Scrollable */}
      <nav className="flex-1 space-y-0.5 py-2 md:py-3 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = currentPath === item.href ||
            (item.href !== '/admin' &&
              item.href !== '/dashboard' &&
              item.href !== '/professor' &&
              currentPath.startsWith(item.href))
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`sidebar-link group touch-target ${isActive ? 'active' : ''}`}
            >
              <span className="relative flex-shrink-0">
                {item.icon}
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </span>
              <span className="flex-1 leading-snug text-sm md:text-base truncate">{item.label}</span>
              {isActive && <ChevronRight size={14} className="opacity-70 flex-shrink-0" />}
            </Link>
          )
        })}
      </nav>

      {/* Logout Button - Fixed at bottom */}
      <div className="mt-auto border-t border-[var(--siu-border-light)] bg-white/60 p-2 md:p-3">
        <button
          type="button"
          onClick={handleLogout}
          className="sidebar-link w-full text-left text-slate-600 hover:text-red-800 touch-target"
        >
          <LogOut size={18} />
          <span className="font-semibold text-sm md:text-base">Cerrar sesión</span>
        </button>
      </div>
    </aside>
  )
}
