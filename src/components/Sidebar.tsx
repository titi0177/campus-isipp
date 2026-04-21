import { Link, useRouterState } from '@tanstack/react-router'
import { useEffect, useState, useCallback } from 'react'
import {
  LayoutDashboard, Users, BookOpen, GraduationCap, UserCheck,
  ClipboardList, Star, Calendar, FileText, Bell, Settings,
  ChevronRight, LogOut, BookMarked, BarChart3, ClipboardCheck,
  Link2, MessageCircle, DollarSign, Award
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
  { label: 'Certificados', href: '/dashboard/certificates', icon: <Award size={18} /> },
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
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" && window.innerWidth < 768)

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

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }, [])

  const isActive = useCallback((href: string) => {
    return currentPath === href ||
      (href !== '/admin' &&
        href !== '/dashboard' &&
        href !== '/professor' &&
        href !== '/treasurer' &&
        currentPath.startsWith(href))
  }, [currentPath])

  return (
    <aside className="sidebar h-screen flex flex-col pb-20 md:pb-0 bg-gradient-to-b from-[var(--siu-sidebar-bg)] to-white shadow-sm" style={{ backgroundColor: 'var(--siu-sidebar-bg)' }}>
      {/* Logo Section - Responsive */}
      <div className="siu-sidebar-brand flex-shrink-0 bg-gradient-to-r from-[var(--isipp-bordo)] to-[var(--isipp-bordo-dark)] shadow-md">
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
        <p className="mt-2 md:mt-3 text-center text-[10px] md:text-[11px] font-bold uppercase leading-snug tracking-widest text-white/95">
          Sistema de gestión académica
        </p>
      </div>

      {/* Menu Label */}
      <div className="siu-sidebar-section-label text-xs md:text-sm flex-shrink-0 bg-gradient-to-r from-[var(--isipp-bordo-soft)] to-transparent">
        {menuLabel}
      </div>

      {/* Navigation - Scrollable */}
      <nav className="flex-1 space-y-0.5 py-2 md:py-3 overflow-y-auto px-2">
        {navItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`sidebar-link group touch-target transition-all duration-200 ${active ? 'active' : ''}`}
              style={active ? {
                backgroundColor: 'var(--siu-panel)',
                color: 'var(--isipp-bordo-dark)',
                boxShadow: 'inset 4px 0 0 var(--isipp-bordo), 0 2px 6px rgba(44, 21, 24, 0.08)',
                border: '1px solid var(--siu-border-light)',
              } : {
                color: 'var(--siu-blue)',
              }}
            >
              <span className="relative flex-shrink-0">
                {item.icon}
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-red-600 text-white text-[10px] font-bold shadow-sm">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </span>
              <span className="flex-1 leading-snug text-sm md:text-base truncate">{item.label}</span>
              {active && <ChevronRight size={14} className="opacity-80 flex-shrink-0 transition-all duration-200" />}
            </Link>
          )
        })}
      </nav>

      {/* Logout Button - Always visible at bottom, not affected by scroll */}
      <div className="mt-auto border-t border-[var(--siu-border-light)] bg-gradient-to-r from-red-50 to-white p-2 md:p-3 m-2 rounded-lg shadow-sm">
        <button
          type="button"
          onClick={handleLogout}
          className="sidebar-link w-full text-left text-red-700 hover:text-red-900 active:text-red-950 hover:bg-red-100/50 touch-target transition-all duration-200 flex items-center gap-3 rounded-md"
        >
          <LogOut size={18} className="flex-shrink-0" />
          <span className="font-bold text-sm md:text-base flex-1">Cerrar sesión</span>
        </button>
      </div>
    </aside>
  )
}
