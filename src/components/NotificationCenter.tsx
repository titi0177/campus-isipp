import React, { createContext, useContext, useState, useCallback } from 'react'
import { Bell, X, MessageCircle, AlertCircle, CheckCircle, Info } from 'lucide-react'

export type NotificationType = 'message' | 'announcement' | 'alert' | 'success' | 'info'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: Date
  read: boolean
  actionUrl?: string
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  markAsRead: (id: string) => void
  dismissNotification: (id: string) => void
  clearAll: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
    }
    setNotifications((prev) => [newNotification, ...prev])

    // Auto-dismiss after 5 seconds for non-critical notifications
    if (notification.type !== 'alert') {
      setTimeout(() => {
        dismissNotification(newNotification.id)
      }, 5000)
    }
  }, [])

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }, [])

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        dismissNotification,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return context
}

// Notification Bell Component
export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, dismissNotification } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'message':
        return <MessageCircle className="w-5 h-5 text-blue-600" />
      case 'announcement':
        return <Info className="w-5 h-5 text-purple-600" />
      case 'alert':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      default:
        return <Bell className="w-5 h-5 text-slate-600" />
    }
  }

  const getColor = (type: NotificationType) => {
    switch (type) {
      case 'message':
        return 'bg-blue-50 border-l-4 border-blue-600'
      case 'announcement':
        return 'bg-purple-50 border-l-4 border-purple-600'
      case 'alert':
        return 'bg-red-50 border-l-4 border-red-600'
      case 'success':
        return 'bg-green-50 border-l-4 border-green-600'
      default:
        return 'bg-slate-50 border-l-4 border-slate-400'
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:text-slate-900 transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl border border-slate-200 z-50 max-h-96 overflow-y-auto">
          <div className="sticky top-0 bg-gradient-to-r from-slate-50 to-slate-100 p-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-bold text-slate-900">Notificaciones</h3>
            {notifications.length > 0 && (
              <button
                onClick={() => {
                  notifications.forEach((n) => markAsRead(n.id))
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
              >
                Marcar todas como leído
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <Bell className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>No hay notificaciones</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${getColor(notification.type)} ${
                    !notification.read ? 'bg-opacity-100' : 'bg-opacity-50'
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">{getIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-slate-900">{notification.title}</h4>
                      <p className="text-sm text-slate-700 mt-1">{notification.message}</p>
                      <p className="text-xs text-slate-500 mt-2">
                        {notification.timestamp.toLocaleTimeString('es-AR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        dismissNotification(notification.id)
                      }}
                      className="flex-shrink-0 text-slate-400 hover:text-slate-600"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
