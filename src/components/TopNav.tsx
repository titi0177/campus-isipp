import { Bell, User, ChevronDown, LogOut } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'
import { NotificationBell } from '@/components/NotificationCenter'

const LOGO_SRC = '/logo-isipp.png'

interface TopNavProps {
  userName?: string
  role?: 'admin' | 'student' | 'professor' | 'treasurer'
}

export function TopNav({ userName = 'Usuario', role }: TopNavProps) {
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  const moduleLine =
    role === 'admin'
      ? 'Módulo de administración del sistema'
      : role === 'professor'
        ? 'Módulo docente — cursadas y evaluaciones'
        : role === 'treasurer'
          ? 'Módulo de tesorería — gestión de pagos'
          : 'Módulo de autogestión y consultas académicas'

  const announcementsPath =
    role === 'admin'
      ? '/admin/announcements'
      : role === 'professor'
        ? '/professor/announcements'
        : role === 'treasurer'
          ? '/treasurer'
          : '/dashboard/announcements'

  const settingsPath =
    role === 'admin'
      ? '/admin/settings'
      : role === 'professor'
        ? '/professor/settings'
        : role === 'treasurer'
          ? '/treasurer/settings'
          : '/dashboard/profile'

  const settingsLabel =
    role === 'admin'
      ? 'Parámetros y contraseña'
      : role === 'professor'
        ? 'Seguridad y contraseña'
        : role === 'treasurer'
          ? 'Seguridad y contraseña'
          : 'Mis datos personales'

  const roleLabel =
    role === 'admin'
      ? 'Administración'
      : role === 'professor'
        ? 'Docente'
        : role === 'treasurer'
          ? 'Tesorería'
          : 'Alumno'

  return (
    <header className="siu-topnav hidden md:flex bg-gradient-to-r from-[var(--isipp-bordo)] to-[var(--isipp-bordo-dark)] shadow-lg">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <img src={LOGO_SRC} alt="" className="siu-topnav-logo" width={140} height={48} loading="lazy" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h1 className="siu-topnav-title truncate text-sm leading-tight sm:text-base font-bold">
            Instituto Superior de Informática Puerto Piray
          </h1>
          <p className="siu-topnav-muted hidden truncate sm:block text-xs">{moduleLine}</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <NotificationBell />
        {/* Logout button for mobile */}
        <button
          onClick={handleLogout}
          className="md:hidden flex items-center justify-center rounded-md p-2 text-white/90 hover:bg-white/15 active:bg-white/25 transition-colors duration-200"
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
        >
          <LogOut size={20} />
        </button>
        <Link
          to={announcementsPath}
          className="rounded-md p-2 text-white/90 transition-colors duration-200 hover:bg-white/15 active:bg-white/25"
          title="Novedades"
        >
          <Bell size={20} />
        </Link>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 rounded-md py-1.5 pl-1.5 pr-2 text-white transition-colors duration-200 hover:bg-white/15 active:bg-white/25"
            aria-haspopup="menu"
            aria-expanded={showMenu}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-md border border-white/30 bg-white/10">
              <User size={17} className="text-white" />
            </div>
            <div className="hidden text-left md:block">
              <div className="max-w-[160px] truncate text-sm font-semibold leading-tight">
                {userName}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/70">
                {roleLabel}
              </div>
            </div>
            <ChevronDown size={14} className={`text-white/70 transition-transform duration-200 ${showMenu ? 'rotate-180' : ''}`} />
          </button>

          {showMenu && (
            <div
              className="absolute right-0 top-full z-50 mt-2 w-56 border shadow-xl overflow-hidden rounded-lg"
              style={{
                backgroundColor: 'var(--siu-panel)',
                borderColor: 'var(--siu-border)',
                boxShadow: '0 10px 25px rgba(44, 21, 24, 0.15)'
              }}
              role="menu"
            >
              <Link
                to={settingsPath}
                className="block px-4 py-3 text-sm font-medium transition-colors duration-200 hover:bg-[var(--siu-blue-soft)] border-b border-[var(--siu-border-light)]"
                style={{ color: 'var(--siu-text)' }}
                onClick={() => setShowMenu(false)}
              >
                ⚙️ {settingsLabel}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="block w-full px-4 py-3 text-left text-sm font-semibold transition-colors duration-200 hover:bg-red-50 flex items-center gap-2"
                style={{ color: '#7f1d1d' }}
              >
                <LogOut size={16} />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
