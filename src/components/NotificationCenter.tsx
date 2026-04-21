import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { Bell, X, MessageCircle, AlertCircle, CheckCircle, Info, Volume2, VolumeX, Trash2, Clock, User, BookOpen, DollarSign, FileText, Award } from 'lucide-react'

export type NotificationType = 'message' | 'announcement' | 'alert' | 'success' | 'info' | 'grade' | 'payment' | 'enrollment' | 'exam' | 'certificate'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: Date
  read: boolean
  actionUrl?: string
  icon?: React.ReactNode
  data?: Record<string, any>
  priority?: 'low' | 'medium' | 'high'
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  dismissNotification: (id: string) => void
  clearAll: () => void
  setSound: (enabled: boolean) => void
  soundEnabled: boolean
  showHistory: boolean
  setShowHistory: (show: boolean) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

// Sonido de notificación
const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1)

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.1)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.1)
  } catch (e) {
    console.log('Audio no disponible')
  }
}

// Vibración
const vibrate = () => {
  if (navigator.vibrate) {
    navigator.vibrate([200, 100, 200])
  }
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [showHistory, setShowHistory] = useState(false)

  // Cargar notificaciones del localStorage
  useEffect(() => {
    const saved = localStorage.getItem('notifications')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setNotifications(parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp),
        })))
      } catch (e) {
        console.error('Error cargando notificaciones', e)
      }
    }

    const soundPref = localStorage.getItem('notificationSound')
    if (soundPref !== null) {
      setSoundEnabled(soundPref === 'true')
    }
  }, [])

  // Guardar notificaciones en localStorage (últimas 100)
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications.slice(0, 100)))
  }, [notifications])

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      timestamp: new Date(),
      read: false,
      priority: notification.priority || 'medium',
    }

    setNotifications((prev) => [newNotification, ...prev])

    // Reproducir sonido y vibración
    if (soundEnabled) {
      playNotificationSound()
      vibrate()
    }

    // Mostrar notificación del navegador
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(newNotification.title, {
        body: newNotification.message,
        icon: '/logo-isipp.png',
        tag: newNotification.id,
      })
    }

    // ✅ CAMBIO: NO auto-dismissar - las notificaciones se quedan permanentes
    // El usuario debe hacer clic en X para eliminarlas
  }, [soundEnabled])

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true }))
    )
  }, [])

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  const setSound = useCallback((enabled: boolean) => {
    setSoundEnabled(enabled)
    localStorage.setItem('notificationSound', String(enabled))
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        dismissNotification,
        clearAll,
        setSound,
        soundEnabled,
        showHistory,
        setShowHistory,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications debe usarse dentro de NotificationProvider')
  }
  return context
}

// Obtener icono por tipo
function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'message':
      return <MessageCircle className="w-5 h-5" />
    case 'announcement':
      return <Info className="w-5 h-5" />
    case 'alert':
      return <AlertCircle className="w-5 h-5" />
    case 'success':
      return <CheckCircle className="w-5 h-5" />
    case 'grade':
      return <Award className="w-5 h-5" />
    case 'payment':
      return <DollarSign className="w-5 h-5" />
    case 'enrollment':
      return <BookOpen className="w-5 h-5" />
    case 'exam':
      return <FileText className="w-5 h-5" />
    case 'certificate':
      return <CheckCircle className="w-5 h-5" />
    default:
      return <Bell className="w-5 h-5" />
  }
}

// Obtener color por tipo
function getNotificationColor(type: NotificationType, priority: 'low' | 'medium' | 'high' = 'medium') {
  if (priority === 'high') {
    return {
      bg: 'bg-red-50',
      border: 'border-l-4 border-red-500',
      icon: 'text-red-600',
      badge: 'bg-red-500',
    }
  }

  switch (type) {
    case 'message':
      return {
        bg: 'bg-blue-50',
        border: 'border-l-4 border-blue-500',
        icon: 'text-blue-600',
        badge: 'bg-blue-500',
      }
    case 'announcement':
      return {
        bg: 'bg-purple-50',
        border: 'border-l-4 border-purple-500',
        icon: 'text-purple-600',
        badge: 'bg-purple-500',
      }
    case 'alert':
      return {
        bg: 'bg-red-50',
        border: 'border-l-4 border-red-500',
        icon: 'text-red-600',
        badge: 'bg-red-500',
      }
    case 'success':
      return {
        bg: 'bg-emerald-50',
        border: 'border-l-4 border-emerald-500',
        icon: 'text-emerald-600',
        badge: 'bg-emerald-500',
      }
    case 'grade':
      return {
        bg: 'bg-amber-50',
        border: 'border-l-4 border-amber-500',
        icon: 'text-amber-600',
        badge: 'bg-amber-500',
      }
    case 'payment':
      return {
        bg: 'bg-green-50',
        border: 'border-l-4 border-green-500',
        icon: 'text-green-600',
        badge: 'bg-green-500',
      }
    case 'enrollment':
      return {
        bg: 'bg-cyan-50',
        border: 'border-l-4 border-cyan-500',
        icon: 'text-cyan-600',
        badge: 'bg-cyan-500',
      }
    case 'exam':
      return {
        bg: 'bg-indigo-50',
        border: 'border-l-4 border-indigo-500',
        icon: 'text-indigo-600',
        badge: 'bg-indigo-500',
      }
    case 'certificate':
      return {
        bg: 'bg-yellow-50',
        border: 'border-l-4 border-yellow-500',
        icon: 'text-yellow-600',
        badge: 'bg-yellow-500',
      }
    default:
      return {
        bg: 'bg-slate-50',
        border: 'border-l-4 border-slate-400',
        icon: 'text-slate-600',
        badge: 'bg-slate-500',
      }
  }
}

// Componente NotificationBell mejorado
export function NotificationBell() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    clearAll,
    soundEnabled,
    setSound,
  } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)

  // Solicitar permiso de notificaciones
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const recentNotifications = notifications.slice(0, 5)
  const hasMore = notifications.length > 5

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-white/90 hover:bg-white/15 rounded-lg transition-all duration-200"
        aria-label="Notificaciones"
        title={`${unreadCount} no leído${unreadCount !== 1 ? 's' : ''}`}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-5 w-5 rounded-full bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold shadow-lg animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel de notificaciones */}
          <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-1rem)] bg-white rounded-lg shadow-2xl border border-[var(--siu-border-light)] z-50 overflow-hidden flex flex-col max-h-[600px]">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-[var(--isipp-bordo)] to-[var(--isipp-bordo-dark)] text-white px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Bell size={20} />
                <h3 className="font-bold text-lg">Notificaciones</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSound(!soundEnabled)}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  title={soundEnabled ? 'Silenciar' : 'Activar sonido'}
                >
                  {soundEnabled ? (
                    <Volume2 size={18} />
                  ) : (
                    <VolumeX size={18} />
                  )}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Tabs/Actions */}
            <div className="border-b border-[var(--siu-border-light)] px-6 py-3 flex items-center justify-between bg-[var(--siu-blue-soft)]/30">
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs font-bold uppercase tracking-wide text-[var(--isipp-bordo)] hover:text-[var(--isipp-bordo-dark)] transition-colors"
                  >
                    Marcar todas como leído
                  </button>
                )}
              </div>
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-red-600 hover:text-red-800 transition-colors"
                >
                  <Trash2 size={14} />
                  Limpiar
                </button>
              )}
            </div>

            {/* Lista de notificaciones */}
            <div className="flex-1 overflow-y-auto divide-y divide-[var(--siu-border-light)]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-[var(--siu-text-muted)]">
                  <Bell size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No hay notificaciones</p>
                  <p className="text-xs mt-1">Volverás a verlas cuando haya novedades</p>
                </div>
              ) : (
                <>
                  {recentNotifications.map((notification) => {
                    const color = getNotificationColor(notification.type, notification.priority)
                    return (
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-[var(--siu-blue-soft)]/30 transition-colors cursor-pointer group ${
                          color.bg
                        } ${color.border} ${!notification.read ? 'bg-opacity-100' : 'bg-opacity-50'}`}
                        onClick={() => {
                          markAsRead(notification.id)
                          if (notification.actionUrl) {
                            window.location.href = notification.actionUrl
                          }
                        }}
                      >
                        <div className="flex gap-3">
                          {/* Icono */}
                          <div className={`flex-shrink-0 mt-1 p-2 rounded-lg ${color.bg} ${color.icon}`}>
                            {notification.icon || getNotificationIcon(notification.type)}
                          </div>

                          {/* Contenido */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className={`font-bold text-sm ${
                                !notification.read ? 'text-slate-900' : 'text-slate-700'
                              }`}>
                                {notification.title}
                              </h4>
                              {!notification.read && (
                                <span className={`flex-shrink-0 w-2 h-2 rounded-full ${color.badge} mt-1.5`} />
                              )}
                            </div>
                            <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-slate-500 mt-2">
                              <Clock size={12} />
                              {notification.timestamp.toLocaleTimeString('es-AR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>

                          {/* Botón cerrar */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              dismissNotification(notification.id)
                            }}
                            className="flex-shrink-0 text-slate-300 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-all"
                            title="Eliminar notificación"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      </div>
                    )
                  })}

                  {hasMore && (
                    <div className="p-4 text-center">
                      <button
                        onClick={() => setIsOpen(false)}
                        className="text-sm font-bold text-[var(--isipp-bordo)] hover:text-[var(--isipp-bordo-dark)] transition-colors"
                      >
                        Ver todas ({notifications.length - 5} más)
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="border-t border-[var(--siu-border-light)] px-6 py-3 bg-slate-50 text-center text-xs text-slate-600">
                {unreadCount > 0 && (
                  <span>
                    <strong>{unreadCount}</strong> sin leer · <strong>{notifications.length}</strong> total
                  </span>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default NotificationBell
