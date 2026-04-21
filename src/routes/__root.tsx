import { HeadContent, Scripts, createRootRoute, Outlet } from '@tanstack/react-router'
import { ToastProvider } from '@/components/Toast'
import { NotificationProvider } from '@/components/NotificationCenter'
import { useGlobalNotifications } from '@/hooks/useGlobalNotifications'
import { useUserNotifications } from '@/hooks/useUserNotifications'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import '../styles.css'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=5' },
      { name: 'description', content: 'Sistema de Gestión Académica ISIPP Puerto Piray' },
      { name: 'theme-color', content: '#003366' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      { name: 'apple-mobile-web-app-title', content: 'ISIPP Campus' },
      { title: 'ISIPP Puerto Piray · Gestión académica' },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Source+Sans+3:ital,wght@0,400;0,600;0,700;1,400&display=swap',
      },
      { rel: 'apple-touch-icon', href: '/logo-isipp.png' },
      { rel: 'icon', type: 'image/png', href: '/favicon.ico' },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <HeadContent />
      </head>
      <body>
        <ToastProvider>
          <NotificationProvider>
            <NotificationSetup />
            {children}
          </NotificationProvider>
        </ToastProvider>
        <Scripts />
      </body>
    </html>
  )
}

/**
 * Componente que maneja TODAS las suscripciones de notificaciones
 * Separación clara: global vs usuario-específico
 */
function NotificationSetup() {
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // ============================================================
  // 1. Obtener userId del usuario autenticado (una sola vez)
  // ============================================================
  useEffect(() => {
    console.log('[NotificationSetup] Obteniendo usuario autenticado...')

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        console.log('[NotificationSetup] ✅ Usuario encontrado:', user.id)
        setUserId(user.id)
      } else {
        console.log('[NotificationSetup] ❌ No hay usuario autenticado')
        setUserId(null)
      }
      setIsLoading(false)
    })

    // Escuchar cambios de autenticación (logout, etc)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[NotificationSetup] Auth cambió - evento:', event)
        if (session?.user) {
          console.log('[NotificationSetup] ✅ Usuario sesión:', session.user.id)
          setUserId(session.user.id)
        } else {
          console.log('[NotificationSetup] ❌ Sesión perdida')
          setUserId(null)
        }
      }
    )

    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe()
      }
    }
  }, [])

  // ============================================================
  // 2. Suscripciones GLOBALES (sin userId)
  // Se crea una sola vez al montar el componente
  // ============================================================
  useGlobalNotifications()

  // ============================================================
  // 3. Suscripciones de USUARIO (dependen de userId)
  // Se crean/limpian cuando userId cambia
  // ============================================================
  useUserNotifications(userId)

  // No renderizar nada, solo efectos secundarios
  return null
}
