import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { CreditCard, CheckCircle, AlertCircle } from 'lucide-react'
import { calculatePaymentWithSurcharge, isPaymentOverdue, formatDateES } from '@/lib/paymentUtils'

export const Route = createFileRoute('/dashboard/payments')({
  component: StudentPaymentsPage,
})

type Payment = {
  id: string
  payment_type: string
  month?: number
  year: number
  amount: number
  due_date: string
  paid_at?: string
  status: string
  payment_method?: string
  notes?: string
}

function StudentPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()

  // Nota: El aumento del 15% se aplica si el pago se realiza después del
  // primer día hábil a partir del 10 del mes de vencimiento.
  // Ejemplo: Si el 10 de mayo cae sábado, el primer día hábil es lunes 12,
  // entonces a partir del martes 13 de mayo se aplica el 15%

  useEffect(() => {
    void loadPayments()
  }, [])

  async function loadPayments() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!student) return

      const { data: pays } = await supabase
        .from('payments')
        .select('*')
        .eq('student_id', student.id)
        .order('due_date', { ascending: false })

      setPayments(pays || [])
    } catch (err) {
      console.error('Error:', err)
      showToast('Error cargando pagos', 'error')
    } finally {
      setLoading(false)
    }
  }

  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case 'seguro':
        return 'Seguro'
      case 'inscripcion':
        return 'Inscripción'
      case 'cuota_mensual':
        return 'Cuota Mensual'
      default:
        return type
    }
  }

  const getMonthLabel = (month?: number) => {
    if (!month) return '-'
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    return months[month - 1]
  }

  const totalDeudor = payments
    .filter(p => p.status === 'deudor')
    .reduce((sum, p) => sum + p.amount, 0)

  const totalPagado = payments
    .filter(p => p.status === 'pagado')
    .reduce((sum, p) => sum + p.amount, 0)

  // Pagos críticos (vencidos)
  const criticalPayments = payments.filter(p => isPaymentOverdue(p.due_date, p.status))

  if (loading) {
    return <p className="text-slate-600">Cargando estado de pagos...</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CreditCard size={28} />
          Estado de Pagos
        </h1>
        <p className="text-slate-600 text-sm mt-1">Seguimiento de seguro, inscripción y cuotas mensuales</p>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 bg-red-50 border border-red-200">
          <p className="text-sm text-red-600 font-semibold">Adeudado</p>
          <p className="text-3xl font-bold text-red-900 mt-2">${totalDeudor.toFixed(2)}</p>
          <p className="text-xs text-red-600 mt-1">{payments.filter(p => p.status === 'deudor').length} pendientes</p>
        </div>
        <div className="card p-4 bg-green-50 border border-green-200">
          <p className="text-sm text-green-600 font-semibold">Pagado</p>
          <p className="text-3xl font-bold text-green-900 mt-2">${totalPagado.toFixed(2)}</p>
          <p className="text-xs text-green-600 mt-1">{payments.filter(p => p.status === 'pagado').length} realizados</p>
        </div>
        <div className="card p-4 bg-slate-50 border border-slate-200">
          <p className="text-sm text-slate-600 font-semibold">Total</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">${(totalDeudor + totalPagado).toFixed(2)}</p>
          <p className="text-xs text-slate-600 mt-1">{payments.length} registros</p>
        </div>
      </div>

      {/* Alertas críticas */}
      {criticalPayments.length > 0 && (
        <div className="card p-4 border-l-4 border-l-red-600 bg-red-50">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Pagos Vencidos</h3>
              <p className="text-sm text-red-700 mt-1">
                Tienes {criticalPayments.length} pago(s) vencido(s). Por favor regulariza tu situación.
              </p>
              <p className="text-xs text-red-600 mt-2">
                <strong>Nota:</strong> No podrás inscribirte a exámenes si tienes deuda en pagos con vencimiento menor o igual al mes del examen.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de pagos */}
      {payments.length === 0 ? (
        <div className="card p-6 text-center">
          <p className="text-slate-500">No hay registros de pago cargados.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Tipo</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Período</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Monto</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Vencimiento</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Fecha de Pago</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">Estado</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => {
                  const isPaid = payment.status === 'pagado'
                  const isOverduePayment = isPaymentOverdue(payment.due_date, payment.status)

                  return (
                    <tr
                      key={payment.id}
                      className={`border-b ${
                        isOverduePayment ? 'bg-red-50' : isPaid ? 'bg-green-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {getPaymentTypeLabel(payment.payment_type)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {payment.payment_type === 'cuota_mensual'
                          ? `${getMonthLabel(payment.month)} ${payment.year}`
                          : payment.year}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                        ${payment.amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {formatDateES(payment.due_date)}
                        {isOverduePayment && (
                          <p className="text-xs text-red-600 font-semibold mt-1">VENCIDO</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {payment.paid_at ? (
                          <div>
                            <p className="font-semibold">{formatDateES(payment.paid_at)}</p>
                            {isPaid && payment.paid_at && (
                              (() => {
                                const calc = calculatePaymentWithSurcharge(
                                  payment.amount,
                                  payment.due_date,
                                  payment.paid_at
                                )
                                return calc.appliedSurcharge ? (
                                  <p className="text-xs text-red-600 mt-1">
                                    +${calc.surcharge.toFixed(2)} (aumento por pago tardío)
                                  </p>
                                ) : null
                              })()
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isPaid ? (
                          <div className="flex items-center justify-center gap-1">
                            <CheckCircle size={18} className="text-green-600" />
                            <span className="text-xs font-semibold text-green-700">Pagado</span>
                          </div>
                        ) : payment.status === 'pendiente' ? (
                          <div className="flex items-center justify-center gap-1">
                            <AlertCircle size={18} className="text-orange-600" />
                            <span className="text-xs font-semibold text-orange-700">Pendiente</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <AlertCircle size={18} className="text-red-600" />
                            <span className="text-xs font-semibold text-red-700">Deudor</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Información */}
      <div className="card p-4 bg-blue-50 border border-blue-200 space-y-2">
        <h3 className="font-semibold text-blue-900">ℹ️ Información sobre pagos</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Seguro:</strong> Pago anual obligatorio</li>
          <li>• <strong>Inscripción:</strong> Pago anual por carrera/programa</li>
          <li>• <strong>Cuotas Mensuales:</strong> Abril a diciembre (9 cuotas)</li>
          <li>• <strong>Aumento por demora:</strong> 15% si se paga después del primer día hábil a partir del 10 del mes</li>
          <li>• <strong>Restricción:</strong> No podrás inscribirte a exámenes si tienes pagos adeudados con vencimiento ≤ mes del examen</li>
        </ul>
      </div>
    </div>
  )
}
