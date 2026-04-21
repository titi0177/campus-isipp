import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * Componente de debug para verificar si las notificaciones en tiempo real funcionan
 * Agrega esto temporalmente en tu página para probar
 */

export function NotificationsDebug() {
  const [status, setStatus] = useState<string>('Inicializando...')
  const [logs, setLogs] = useState<string[]>([])

  useEffect(() => {
    const addLog = (msg: string) => {
      console.log('[DEBUG]', msg)
      setLogs(prev => [...prev.slice(-9), `[${new Date().toLocaleTimeString()}] ${msg}`])
    }

    addLog('Debug iniciado')

    // Verificar conexión a Supabase
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        addLog(`✅ Usuario autenticado: ${data.user.id}`)
        setStatus('Conectado')
      } else {
        addLog('❌ No hay usuario autenticado')
        setStatus('No autenticado')
      }
    })

    // Suscribirse a anuncios para debug
    addLog('📢 Suscribiendo a anuncios...')
    const channel = supabase
      .channel('debug-announcements')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'announcements',
        },
        (payload) => {
          addLog(`🔔 EVENTO RECIBIDO: ${payload.eventType}`)
          addLog(`Datos: ${JSON.stringify(payload.new || payload.old)}`)
        }
      )
      .on('subscribe', () => {
        addLog('✅ Suscripción exitosa a anuncios')
      })
      .on('error', (err) => {
        addLog(`❌ Error: ${err}`)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      addLog('Limpiando debug')
    }
  }, [])

  return (
    <div className="fixed bottom-4 right-4 bg-slate-900 text-white rounded-lg p-4 w-96 max-h-80 overflow-hidden z-50 shadow-2xl border border-green-500">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-green-500">
        <h3 className="font-bold text-sm">🐛 Debug Notificaciones</h3>
        <span className={`text-xs px-2 py-1 rounded ${status === 'Conectado' ? 'bg-green-600' : 'bg-red-600'}`}>
          {status}
        </span>
      </div>

      <div className="overflow-y-auto max-h-64 space-y-1 font-mono text-xs">
        {logs.map((log, i) => (
          <div key={i} className={`${
            log.includes('❌') ? 'text-red-400' :
            log.includes('✅') ? 'text-green-400' :
            log.includes('🔔') ? 'text-yellow-400' :
            'text-slate-400'
          }`}>
            {log}
          </div>
        ))}
      </div>

      <div className="mt-3 pt-2 border-t border-slate-700 text-xs text-slate-400">
        💡 Abre la consola (F12) para ver más detalles
      </div>
    </div>
  )
}

export default NotificationsDebug
