import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Bell, CheckCircle2, AlertCircle, BookOpen, Calendar, X } from 'lucide-react'
import type { Announcement } from '@/types'
import { useRealtimeAnnouncements } from '@/hooks/useRealtimeAnnouncements'
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications'
import { useToast } from '@/components/Toast'

export const Route = createFileRoute('/dashboard/announcements')({
  component: AnnouncementsPage,
})

type NotificationType = 'nota_parcial' | 'nota_final' | 'mesas' | 'clase_cancelada' | 'all'

type Notification = {
  id: string
  student_id: string
  type: string
  title: string
  description: string
  subject_id?: string
  subject_name?: string
  read: boolean
  created_at: string
}

function AnnouncementsPage() {
  const [activeTab, setActiveTab] = useState<'announcements' | 'notifications'>('announcements')
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [student, setStudent] = useState<any>(null)
  const [filterType, setFilterType] = useState<NotificationType>('all')
  const [hasMoreNotifications, setHasMoreNotifications] = useState(false)
  const [notificationLimit, setNotificationLimit] = useState(10)
  const { showToast } = useToast()

  // Load announcements
  const loadAnnouncements = useCallback(async () => {
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .order('date', { ascending: false })
    setAnnouncements((data as Announcement[]) || [])
  }, [])

  // Load notifications
  const loadNotifications = useCallback(async (limit: number = 10) => {
    if (!student?.id) return

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('student_id', student.id)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit + 1) // +1 para detectar si hay más

    const { data } = await query

    if (data) {
      setHasMoreNotifications(data.length > limit)
      setNotifications((data as Notification[]).slice(0, limit))
    }
  }, [student?.id])

  // Cargar estudiante
  useEffect(() => {
    const loadStudent = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: studentData } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', user.id)
          .single()
        if (studentData) {
          setStudent(studentData)
        }
      }
      setLoading(false)
    }
    loadStudent()
  }, [])

  // Load initial data
  useEffect(() => {
    void loadAnnouncements()
  }, [loadAnnouncements])

  useEffect(() => {
    if (student?.id) {
      void loadNotifications(notificationLimit)
    }
  }, [student?.id, loadNotifications, notificationLimit])

  // Realtime hooks
  useRealtimeAnnouncements(loadAnnouncements)
  
  const handleNewNotification = useCallback((notification: Notification) => {
    setNotifications(prev => [notification, ...prev].slice(0, notificationLimit))
    
    // Toast notification
    const icon = getNotificationIcon(notification.type)
    showToast(`${icon} ${notification.title}`, 'info')
  }, [notificationLimit, showToast])

  useRealtimeNotifications(student?.id, handleNewNotification)

  // Mark as read
  const handleMarkAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)

    if (!error) {
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
    }
  }

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
    if (unreadIds.length === 0) return

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .in('id', unreadIds)

    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'nota_parcial_1':
      case 'nota_parcial_2':
      case 'nota_parcial_3':
      case 'nota_parcial_4':
      case 'nota_parcial_5':
      case 'nota_parcial_6':
      case 'nota_parcial':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700'
      case 'nota_final':
        return 'bg-green-50 border-green-200 text-green-700'
      case 'mesas':
        return 'bg-blue-50 border-blue-200 text-blue-700'
      case 'clase_cancelada':
        return 'bg-red-50 border-red-200 text-red-700'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700'
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'nota_parcial_1':
      case 'nota_parcial_2':
      case 'nota_parcial_3':
      case 'nota_parcial_4':
      case 'nota_parcial_5':
      case 'nota_parcial_6':
      case 'nota_parcial':
        return '🟡'
      case 'nota_final':
        return '🟢'
      case 'mesas':
        return '🔵'
      case 'clase_cancelada':
        return '🔴'
      default:
        return '⚪'
    }
  }

  const getNotificationBadge = (type: string) => {
    switch (type) {
      case 'nota_parcial_1':
      case 'nota_parcial_2':
      case 'nota_parcial_3':
      case 'nota_parcial_4':
      case 'nota_parcial_5':
      case 'nota_parcial_6':
      case 'nota_parcial':
        return 'Nota Parcial'
      case 'nota_final':
        return 'Nota Final'
      case 'mesas':
        return 'Mesas Disponibles'
      case 'clase_cancelada':
        return 'Clase Cancelada'
      default:
        return 'Notificación'
    }
  }

  const filteredNotifications = notifications.filter(n => {
    if (filterType === 'all') return true
    if (filterType === 'nota_parcial') return n.type.startsWith('nota_parcial')
    return n.type === filterType
  })

  const unreadCount = notifications.filter(n => !n.read).length

  if (loading) {
    return <div className="card p-6 text-center">Cargando...</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Anuncios & Notificaciones</h1>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('announcements')}
          className={`px-6 py-3 font-bold text-sm border-b-2 transition-colors ${
            activeTab === 'announcements'
              ? 'border-b-indigo-600 text-indigo-600'
              : 'border-b-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          📢 Anuncios Institucionales
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-6 py-3 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'notifications'
              ? 'border-b-indigo-600 text-indigo-600'
              : 'border-b-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          🔔 Mis Notificaciones {unreadCount > 0 && <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>}
        </button>
      </div>

      {/* Anuncios Institucionales */}
      {activeTab === 'announcements' && (
        <div>
          {announcements.length === 0 ? (
            <div className="card text-center py-12 text-gray-400">No hay anuncios disponibles.</div>
          ) : (
            <div className="space-y-4">
              {announcements.map(ann => (
                <div key={ann.id} className="card hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="bg-red-50 p-3 rounded-xl flex-shrink-0">
                      <Bell size={20} className="text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-gray-900">{ann.title}</h3>
                        <span className="text-xs text-gray-400 flex-shrink-0">{new Date(ann.date).toLocaleDateString('es-AR')}</span>
                      </div>
                      <p className="text-gray-600 text-sm mt-2 leading-relaxed">{ann.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mis Notificaciones */}
      {activeTab === 'notifications' && (
        <div className="space-y-4">
          {/* Filtros */}
          <div className="card p-4 bg-gradient-to-r from-indigo-50 to-blue-50 border-2 border-indigo-200">
            <p className="text-sm font-semibold text-gray-700 mb-3">Filtrar por tipo:</p>
            <div className="flex gap-2 flex-wrap">
              {(['all', 'nota_parcial', 'nota_final', 'mesas', 'clase_cancelada'] as NotificationType[]).map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    filterType === type
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-indigo-600 border border-indigo-300 hover:bg-indigo-50'
                  }`}
                >
                  {type === 'all' ? 'Todas' : type === 'nota_parcial' ? 'Notas Parciales' : type === 'nota_final' ? 'Notas Finales' : type === 'mesas' ? 'Mesas' : 'Clases Canceladas'}
                </button>
              ))}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="mt-3 text-sm text-indigo-600 hover:text-indigo-700 font-semibold"
              >
                ✓ Marcar todas como leídas
              </button>
            )}
          </div>

          {/* Notificaciones */}
          {filteredNotifications.length === 0 ? (
            <div className="card text-center py-12 text-gray-400">
              No hay notificaciones de este tipo.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map(notif => (
                <div
                  key={notif.id}
                  className={`card p-4 border-l-4 transition-all ${
                    notif.read ? 'opacity-75 bg-gray-50' : 'bg-white shadow-md'
                  } ${getNotificationColor(notif.type)}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{getNotificationIcon(notif.type)}</span>
                        <span className={`inline-block text-xs font-bold px-2 py-1 rounded ${
                          notif.read
                            ? 'bg-gray-200 text-gray-700'
                            : 'bg-indigo-200 text-indigo-700'
                        }`}>
                          {notif.read ? '✓ Leída' : '● No leída'}
                        </span>
                        <span className="text-xs font-semibold text-gray-600">{getNotificationBadge(notif.type)}</span>
                      </div>
                      <h3 className="font-semibold text-gray-900">{notif.title}</h3>
                      <p className="text-gray-700 text-sm mt-2">{notif.description}</p>
                      {notif.subject_name && (
                        <p className="text-xs text-gray-600 mt-2">
                          <BookOpen size={12} className="inline mr-1" />
                          {notif.subject_name}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(notif.created_at).toLocaleDateString('es-AR')} a las {new Date(notif.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    {!notif.read && (
                      <button
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="flex-shrink-0 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded transition-colors"
                      >
                        Marcar leído
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Load more */}
              {hasMoreNotifications && (
                <button
                  onClick={() => setNotificationLimit(prev => prev + 10)}
                  className="w-full py-2 text-indigo-600 hover:text-indigo-700 font-semibold text-sm border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
                >
                  Cargar más notificaciones
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
