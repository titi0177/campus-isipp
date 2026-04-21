import { useNotifications } from '@/components/NotificationCenter'
import { useToast } from '@/components/Toast'
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications'
import { Button } from '@/components/ui/Button'
import { MessageCircle, Award, DollarSign, CheckCircle, AlertCircle, FileText, BookOpen } from 'lucide-react'

/**
 * Ejemplo de uso de notificaciones en tiempo real para estudiantes
 * Integrar este hook en tus páginas principales
 */

export function NotificationExample() {
  const { addNotification } = useNotifications()
  const { showToast, showToastWithAction } = useToast()

  // Usar en tu componente principal:
  // useRealtimeNotifications(userId)

  const handleShowMessageNotification = () => {
    addNotification({
      type: 'message',
      title: '💬 Nuevo Mensaje',
      message: 'El profesor Juan García te envió un mensaje sobre la tarea de programación',
      priority: 'medium',
      actionUrl: '/dashboard/messages',
      icon: <MessageCircle size={20} />,
    })

    showToast('Tienes un mensaje nuevo del profesor', 'info')
  }

  const handleShowGradeNotification = () => {
    addNotification({
      type: 'grade',
      title: '📊 Nueva Calificación',
      message: 'Calificación registrada: 9/10 en Programación Avanzada',
      priority: 'high',
      data: { grade: 9, subject: 'Programación Avanzada' },
      actionUrl: '/dashboard/history',
      icon: <Award size={20} />,
    })

    showToast('¡Excelente calificación! 9/10', 'success')
  }

  const handleShowPaymentNotification = () => {
    addNotification({
      type: 'payment',
      title: '💳 Pago Confirmado',
      message: 'Tu pago de $5000 ha sido procesado correctamente',
      priority: 'high',
      data: { amount: 5000, status: 'completed' },
      actionUrl: '/dashboard/payments',
      icon: <DollarSign size={20} />,
    })

    showToast('Pago procesado exitosamente: $5000', 'success')
  }

  const handleShowEnrollmentNotification = () => {
    addNotification({
      type: 'enrollment',
      title: '✅ Inscripción Aprobada',
      message: 'Tu inscripción a Algoritmos y Estructuras de Datos ha sido aprobada',
      priority: 'high',
      data: { subject: 'Algoritmos y Estructuras de Datos' },
      actionUrl: '/dashboard/subjects',
      icon: <CheckCircle size={20} />,
    })

    showToast('¡Inscripción aprobada!', 'success')
  }

  const handleShowAlertNotification = () => {
    addNotification({
      type: 'alert',
      title: '⚠️ Recordatorio Importante',
      message: 'Tu fecha de vencimiento de pago es el 15 de diciembre',
      priority: 'high',
      data: { dueDate: '2024-12-15' },
      actionUrl: '/dashboard/payments',
    })

    showToast('Recuerda pagar antes del 15 de diciembre', 'warning')
  }

  const handleShowAnnouncementNotification = () => {
    addNotification({
      type: 'announcement',
      title: '📢 Anuncio Institucional',
      message: 'La biblioteca estará cerrada el próximo lunes por mantenimiento',
      priority: 'medium',
      actionUrl: '/dashboard/announcements',
      icon: <FileText size={20} />,
    })

    showToast('Nuevo anuncio disponible', 'info')
  }

  const handleShowExamNotification = () => {
    addNotification({
      type: 'exam',
      title: '📝 Examen Programado',
      message: 'Te has inscrito para el examen de Matemática Discreta el 20 de diciembre',
      priority: 'high',
      data: { subject: 'Matemática Discreta', examDate: '2024-12-20' },
      actionUrl: '/dashboard/exams',
      icon: <FileText size={20} />,
    })

    showToast('Examen programado exitosamente', 'success')
  }

  const handleShowCertificateNotification = () => {
    addNotification({
      type: 'certificate',
      title: '🎓 Certificado Disponible',
      message: 'Tu certificado de finalización de Técnico en Informática está listo',
      priority: 'medium',
      actionUrl: '/dashboard/certificates',
      icon: <Award size={20} />,
    })

    showToast('¡Tu certificado está listo para descargar!', 'success')
  }

  const handleShowToastWithAction = () => {
    showToastWithAction({
      type: 'info',
      title: 'Confirmación Necesaria',
      message: 'Por favor confirma tu inscripción a la cursada de Bases de Datos',
      duration: 0, // No auto-dismiss
      action: {
        label: 'Confirmar Ahora',
        onClick: () => {
          console.log('Inscripción confirmada')
          showToast('Inscripción confirmada exitosamente', 'success')
        },
      },
    })
  }

  return (
    <div className="space-y-4 p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <button
          onClick={handleShowMessageNotification}
          className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-left"
        >
          <MessageCircle className="w-6 h-6 text-blue-600 mb-2" />
          <p className="font-bold text-blue-900">Mensaje Nuevo</p>
          <p className="text-sm text-blue-700">Del profesor</p>
        </button>

        <button
          onClick={handleShowGradeNotification}
          className="p-4 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors text-left"
        >
          <Award className="w-6 h-6 text-amber-600 mb-2" />
          <p className="font-bold text-amber-900">Calificación</p>
          <p className="text-sm text-amber-700">9/10</p>
        </button>

        <button
          onClick={handleShowPaymentNotification}
          className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors text-left"
        >
          <DollarSign className="w-6 h-6 text-green-600 mb-2" />
          <p className="font-bold text-green-900">Pago Confirmado</p>
          <p className="text-sm text-green-700">$5000</p>
        </button>

        <button
          onClick={handleShowEnrollmentNotification}
          className="p-4 bg-cyan-50 border border-cyan-200 rounded-lg hover:bg-cyan-100 transition-colors text-left"
        >
          <CheckCircle className="w-6 h-6 text-cyan-600 mb-2" />
          <p className="font-bold text-cyan-900">Inscripción Aprobada</p>
          <p className="text-sm text-cyan-700">Nueva asignatura</p>
        </button>

        <button
          onClick={handleShowAlertNotification}
          className="p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-left"
        >
          <AlertCircle className="w-6 h-6 text-red-600 mb-2" />
          <p className="font-bold text-red-900">Alerta Importante</p>
          <p className="text-sm text-red-700">Vencimiento próximo</p>
        </button>

        <button
          onClick={handleShowAnnouncementNotification}
          className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors text-left"
        >
          <FileText className="w-6 h-6 text-purple-600 mb-2" />
          <p className="font-bold text-purple-900">Anuncio</p>
          <p className="text-sm text-purple-700">Cierre de biblioteca</p>
        </button>

        <button
          onClick={handleShowExamNotification}
          className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors text-left"
        >
          <FileText className="w-6 h-6 text-indigo-600 mb-2" />
          <p className="font-bold text-indigo-900">Examen Final</p>
          <p className="text-sm text-indigo-700">20 de diciembre</p>
        </button>

        <button
          onClick={handleShowCertificateNotification}
          className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors text-left"
        >
          <Award className="w-6 h-6 text-yellow-600 mb-2" />
          <p className="font-bold text-yellow-900">Certificado</p>
          <p className="text-sm text-yellow-700">Listo para descargar</p>
        </button>

        <button
          onClick={handleShowToastWithAction}
          className="p-4 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors text-left"
        >
          <BookOpen className="w-6 h-6 text-slate-600 mb-2" />
          <p className="font-bold text-slate-900">Toast con Acción</p>
          <p className="text-sm text-slate-700">Confirmación</p>
        </button>
      </div>

      <div className="mt-6 p-4 bg-slate-100 rounded-lg">
        <h3 className="font-bold text-slate-900 mb-2">Instrucciones de Uso</h3>
        <ol className="text-sm text-slate-700 space-y-1">
          <li>1. Haz click en cualquier botón para ver una notificación</li>
          <li>2. Mira el icono de campana en la esquina superior derecha</li>
          <li>3. Las notificaciones aparecen tanto en el centro como en Toast</li>
          <li>4. Las notificaciones se guardan en localStorage</li>
          <li>5. Usa useRealtimeNotifications() para suscribirse a eventos en tiempo real</li>
        </ol>
      </div>
    </div>
  )
}

export default NotificationExample
