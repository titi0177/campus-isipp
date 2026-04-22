import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Users, Clock, LogOut } from 'lucide-react'

type OnlineUser = {
  user_id: string
  user_name: string
  user_role: 'student' | 'professor' | 'admin'
  user_email: string
  last_seen: string
}

export function OnlineUsersCard() {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOnlineUsers()
    const interval = setInterval(loadOnlineUsers, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [])

  async function loadOnlineUsers() {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

      console.log('📊 Loading online users since:', fiveMinutesAgo)

      const { data, error } = await supabase
        .from('user_sessions')
        .select('user_id, user_name, user_role, user_email, last_seen')
        .gt('last_seen', fiveMinutesAgo)
        .order('last_seen', { ascending: false })

      if (error) {
        console.error('❌ Error fetching user_sessions:', error)
        return
      }

      console.log('✅ Found users:', data?.length || 0, data)
      setOnlineUsers(data || [])
    } catch (err) {
      console.error('Error loading online users:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (role: string) => {
    if (role === 'admin') return 'bg-red-100 text-red-700 border-red-300'
    if (role === 'professor') return 'bg-purple-100 text-purple-700 border-purple-300'
    return 'bg-blue-100 text-blue-700 border-blue-300'
  }

  const getRoleLabel = (role: string) => {
    if (role === 'admin') return 'Admin'
    if (role === 'professor') return 'Profesor'
    return 'Estudiante'
  }

  const getTimeSince = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)
    if (seconds < 60) return 'Ahora'
    if (seconds < 3600) return `Hace ${Math.floor(seconds / 60)}m`
    return `Hace ${Math.floor(seconds / 3600)}h`
  }

  if (loading) {
    return (
      <div className="card p-6 bg-white rounded-xl border border-slate-200 shadow-md">
        <div className="flex items-center gap-3 mb-4">
          <Users size={24} className="text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-900">Usuarios en Línea</h2>
        </div>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-slate-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6 bg-white rounded-xl border border-slate-200 shadow-md">
      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <Users size={24} className="text-indigo-600" />
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">{onlineUsers.length}</span>
          </div>
        </div>
        <h2 className="text-lg font-bold text-slate-900">Usuarios en Línea</h2>
      </div>

      {onlineUsers.length === 0 ? (
        <div className="text-center py-8">
          <LogOut size={32} className="mx-auto text-slate-300 mb-2" />
          <p className="text-slate-500 text-sm">Sin usuarios activos</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {onlineUsers.map(user => (
            <div
              key={user.user_id}
              className={`p-3 rounded-lg border-2 flex items-center justify-between ${getStatusColor(user.user_role)}`}
            >
              <div className="flex-1">
                <p className="font-semibold text-sm">{user.user_name}</p>
                <p className="text-xs opacity-75">{user.user_email}</p>
              </div>
              <div className="flex items-center gap-2 ml-3">
                <span className="text-xs font-semibold px-2 py-1 bg-white/50 rounded">
                  {getRoleLabel(user.user_role)}
                </span>
                <div className="flex items-center gap-1 text-xs opacity-75">
                  <Clock size={12} />
                  {getTimeSince(user.last_seen)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="text-xs text-slate-500 mt-4 text-center border-t pt-3">
        Se actualiza cada 5 segundos • Activos en últimos 5 minutos
      </div>
    </div>
  )
}
