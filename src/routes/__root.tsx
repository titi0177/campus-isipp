import { HeadContent, Scripts, createRootRoute, Outlet } from '@tanstack/react-router'
import { ToastProvider } from '@/components/Toast'
import { NotificationProvider } from '@/components/NotificationCenter'
import { useGlobalAnnouncements } from '@/hooks/useGlobalAnnouncements'
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
            <GlobalNotificationsSetup />
            {children}
          </NotificationProvider>
        </ToastProvider>
        <Scripts />
      </body>
    </html>
  )
}

/**
 * Componente que activa las suscripciones globales
 * Se renderiza dentro del NotificationProvider para que funcione
 */
function GlobalNotificationsSetup() {
  useGlobalAnnouncements()
  return null
}
