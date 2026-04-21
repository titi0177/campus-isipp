import { useNotifications } from '@/components/NotificationCenter'
import { useToast } from '@/components/Toast'
import { MessageCircle, Award, DollarSign, CheckCircle, AlertCircle, FileText } from 'lucide-react'

/**
 * Componente para probar notificaciones
 * Importar en cualquier página para agregar botones de prueba
 */

export function NotificationTestButtons() {
  const { addNotification } = useNotifications()
  const { showToast } = useToast()

  return (
    <div className="mt-8 p-6 bg-slate-100 rounded-lg border-2 border-slate-300">
      <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
        🧪 Botones de Prueba de Notificaciones
        <span className="text-xs bg-yellow-200 text-yellow-900 px-2 py-1 rounded-full font-semibold">DEV</span>
      </h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        <button
          onClick={() => {
            addNotification({
              type: 'message',
              title: '💬 Mensaje del Profesor',
              message: 'Te enviaron un mensaje sobre la tarea',
              priority: 'medium',
              actionUrl: '/dashboard/messages',
              icon: <MessageCircle size={20} />,
            })
            showToast('Mensaje de prueba enviado', 'info')
          }}
          className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-bold transition-all"
        >
          Mensaje
        </button>

        <button
          onClick={() => {
            addNotification({
              type: 'grade',
              title: '📊 Calificación: 9/10',
              message: 'Calificación registrada en Programación',
              priority: 'high',
              actionUrl: '/dashboard/history',
              icon: <Award size={20} />,
            })
            showToast('¡Excelente calificación! 9/10', 'success')
          }}
          className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-all"
        >
          Calificación
        </button>

        <button
          onClick={() => {
            addNotification({
              type: 'payment',
              title: '💳 Pago Confirmado',
              message: 'Tu pago de $5000 fue procesado',
              priority: 'high',
              actionUrl: '/dashboard/payments',
              icon: <DollarSign size={20} />,
            })
            showToast('Pago procesado: $5000', 'success')
          }}
          className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-bold transition-all"
        >
          Pago
        </button>

        <button
          onClick={() => {
            addNotification({
              type: 'enrollment',
              title: '✅ Inscripción Aprobada',
              message: 'Tu inscripción a Algoritmos fue aprobada',
              priority: 'high',
              actionUrl: '/dashboard/subjects',
              icon: <CheckCircle size={20} />,
            })
            showToast('¡Inscripción aprobada!', 'success')
          }}
          className="px-3 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-xs font-bold transition-all"
        >
          Inscripción
        </button>

        <button
          onClick={() => {
            addNotification({
              type: 'exam',
              title: '📝 Examen Programado',
              message: 'Examen el 20 de diciembre a las 14:00',
              priority: 'high',
              actionUrl: '/dashboard/exams',
              icon: <FileText size={20} />,
            })
            showToast('Examen programado exitosamente', 'success')
          }}
          className="px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-xs font-bold transition-all"
        >
          Examen
        </button>

        <button
          onClick={() => {
            addNotification({
              type: 'alert',
              title: '⚠️ Alerta de Vencimiento',
              message: 'Tu cuota vence el 15 de diciembre',
              priority: 'high',
              actionUrl: '/dashboard/payments',
            })
            showToast('Recuerda pagar antes del 15', 'warning')
          }}
          className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition-all"
        >
          Alerta
        </button>

        <button
          onClick={() => {
            addNotification({
              type: 'certificate',
              title: '🎓 Certificado Listo',
              message: 'Tu certificado está disponible',
              priority: 'medium',
              actionUrl: '/dashboard/certificates',
              icon: <Award size={20} />,
            })
            showToast('Certificado listo para descargar', 'success')
          }}
          className="px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-xs font-bold transition-all"
        >
          Certificado
        </button>

        <button
          onClick={() => {
            addNotification({
              type: 'announcement',
              title: '📢 Anuncio Importante',
              message: 'La biblioteca estará cerrada el lunes',
              priority: 'medium',
              actionUrl: '/dashboard/announcements',
              icon: <FileText size={20} />,
            })
            showToast('Nuevo anuncio disponible', 'info')
          }}
          className="px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-xs font-bold transition-all"
        >
          Anuncio
        </button>
      </div>
      
      <p className="text-xs text-slate-600 mt-4 p-3 bg-white rounded border border-slate-200">
        💡 <strong>Nota:</strong> Estos botones son solo para pruebas. En producción, las notificaciones aparecerán automáticamente cuando haya cambios en tiempo real.
      </p>
    </div>
  )
}

export default NotificationTestButtons
