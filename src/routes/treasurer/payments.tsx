import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Edit2, Save, X, Download, BarChart3 } from 'lucide-react'
import { calculatePaymentWithSurcharge, formatDateES } from '@/lib/paymentUtils'
import { useExcelExport } from '@/hooks/useExcelExport'

export const Route = createFileRoute('/treasurer/payments')({
  component: TreasurerPayments,
})

interface Payment {
  id: string
  student_id: string
  payment_type: string
  month: number | null
  year: number
  amount: number
  base_amount: number
  status: string
  due_date: string
  paid_at: string | null
  payment_method: string | null
  student_name: string
  increment_percentage: number
}

interface Student {
  id: string
  name: string
  legajo: string
  current_year: number
  payments: Payment[]
}

interface PaymentConfig {
  increment_percentage: number
  monthly_quota_amount: number
  insurance_amount: number
  enrollment_amount: number
}

interface DailySummary {
  date: string
  methods: Record<string, { count: number; total: number }>
  grandTotal: number
}

function TreasurerPayments() {
  const [programs, setPrograms] = useState<Array<{ id: string; name: string; duration_years: number }>>([])
  const [selectedProgram, setSelectedProgram] = useState<string>('')
  const [selectedCareerYear, setSelectedCareerYear] = useState<number | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)
  const [showSummary, setShowSummary] = useState(false)

  const [loading, setLoading] = useState(false)
  const [loadingProgram, setLoadingProgram] = useState(false)
  const [students, setStudents] = useState<Student[]>([])
  const [careerYears, setCareerYears] = useState<number[]>([])
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editAmount, setEditAmount] = useState<number>(0)
  const [editStatus, setEditStatus] = useState<string>('')
  const [editPaymentMethod, setEditPaymentMethod] = useState<string>('efectivo')

  const { exportToExcel } = useExcelExport()

  const paymentMethods = [
    { value: 'efectivo', label: 'Efectivo' },
    { value: 'transferencia', label: 'Transferencia' },
    { value: 'tarjeta_credito', label: 'Tarjeta de Crédito' },
    { value: 'tarjeta_debito', label: 'Tarjeta de Débito' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'otro', label: 'Otro' },
  ]

  // Cargar programas al montar
  useEffect(() => {
    loadPrograms()
  }, [])

  // Cargar estudiantes cuando se selecciona programa
  useEffect(() => {
    if (selectedProgram) {
      loadStudentsByProgram()
    } else {
      setStudents([])
      setCareerYears([])
      setSelectedCareerYear(null)
      setSelectedStudent(null)
    }
  }, [selectedProgram])

  async function loadPrograms() {
    try {
      const { data } = await supabase
        .from('programs')
        .select('id, name, duration_years')
        .order('name')

      if (data) {
        setPrograms(data)
      }
    } catch (err) {
      console.error('Error loading programs:', err)
    }
  }

  async function loadStudentsByProgram() {
    if (!selectedProgram) return

    setLoadingProgram(true)
    try {
      // Obtener datos del programa
      const program = programs.find(p => p.id === selectedProgram)
      if (program) {
        // Generar años de carrera (1 a duration_years)
        const years = Array.from({ length: program.duration_years }, (_, i) => i + 1)
        setCareerYears(years)
      }

      // Cargar configuración de pagos
      const { data: configData } = await supabase
        .from('payment_configuration')
        .select('increment_percentage, monthly_quota_amount, insurance_amount, enrollment_amount')
        .eq('program_id', selectedProgram)
        .single()

      if (configData) {
        setPaymentConfig(configData)
      }

      // Cargar estudiantes de la carrera con su año actual
      const { data: studentsData } = await supabase
        .from('students')
        .select('id, first_name, last_name, legajo, year')
        .eq('program_id', selectedProgram)
        .order('last_name, first_name')

      if (!studentsData) {
        setStudents([])
        setLoadingProgram(false)
        return
      }

      // Cargar TODOS los pagos de todos los estudiantes
      const studentsWithPayments: Student[] = []

      for (const student of studentsData) {
        const { data: paymentsData } = await supabase
          .from('payments')
          .select('*')
          .eq('student_id', student.id)
          .order('due_date', { ascending: true })

        const payments: Payment[] = (paymentsData || []).map((p: any) => {
          // Determinar la cuota base según el tipo de pago
          let baseAmount = p.amount
          if (p.payment_type === 'seguro') {
            baseAmount = configData?.insurance_amount || p.amount
          } else if (p.payment_type === 'inscripcion') {
            baseAmount = configData?.enrollment_amount || p.amount
          } else if (p.payment_type === 'cuota_mensual') {
            baseAmount = configData?.monthly_quota_amount || p.amount
          }

          return {
            id: p.id,
            student_id: p.student_id,
            payment_type: p.payment_type,
            month: p.month,
            year: p.year,
            amount: p.amount,
            base_amount: baseAmount,
            status: p.status,
            due_date: p.due_date,
            paid_at: p.paid_at,
            payment_method: p.payment_method || 'efectivo',
            student_name: `${student.first_name} ${student.last_name}`,
            increment_percentage: configData?.increment_percentage || 15,
          }
        })

        studentsWithPayments.push({
          id: student.id,
          name: `${student.first_name} ${student.last_name}`,
          legajo: student.legajo,
          current_year: student.year,
          payments,
        })
      }

      setStudents(studentsWithPayments)
    } catch (err) {
      console.error('Error loading students:', err)
    } finally {
      setLoadingProgram(false)
    }
  }

  async function updatePayment(
    paymentId: string,
    newAmount: number,
    newStatus: string,
    newPaymentMethod: string
  ) {
    try {
      let updateData: any = {
        amount: newAmount,
        status: newStatus,
        payment_method: newPaymentMethod,
      }

      if (newStatus === 'pagado') {
        updateData.paid_at = new Date().toISOString()
      } else {
        updateData.paid_at = null
      }

      const { error } = await supabase
        .from('payments')
        .update(updateData)
        .eq('id', paymentId)

      if (error) {
        console.error('Error updating payment:', error)
        return
      }

      setStudents((prev) =>
        prev.map((student) => ({
          ...student,
          payments: student.payments.map((p) =>
            p.id === paymentId
              ? {
                  ...p,
                  amount: newAmount,
                  status: newStatus,
                  payment_method: newPaymentMethod,
                  paid_at: newStatus === 'pagado' ? new Date().toISOString() : null,
                }
              : p
          ),
        }))
      )

      setEditingId(null)
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const getPaymentMethodLabel = (method: string) => {
    return paymentMethods.find((m) => m.value === method)?.label || method
  }

  const getCareerYearLabel = (year: number) => {
    const labels: Record<number, string> = {
      1: '1er Año',
      2: '2do Año',
      3: '3er Año',
    }
    return labels[year] || `Año ${year}`
  }

  // Filtrar estudiantes por año de carrera
  const filteredStudents = selectedCareerYear
    ? students.filter((student) => student.current_year === selectedCareerYear)
    : []

  const selectedStudentData = selectedStudent
    ? filteredStudents.find((s) => s.id === selectedStudent)
    : null

  // Calcular resumen diario
  const calculateDailySummary = () => {
    const summary: Record<string, DailySummary> = {}

    students.forEach((student) => {
      student.payments
        .filter((p) => p.status === 'pagado' && p.paid_at)
        .forEach((p) => {
          const date = new Date(p.paid_at!).toLocaleDateString('es-AR')
          if (!summary[date]) {
            summary[date] = {
              date,
              methods: {},
              grandTotal: 0,
            }
          }

          const method = p.payment_method || 'efectivo'
          if (!summary[date].methods[method]) {
            summary[date].methods[method] = { count: 0, total: 0 }
          }

          summary[date].methods[method].count += 1
          summary[date].methods[method].total += p.base_amount
          summary[date].grandTotal += p.base_amount
        })
    })

    return Object.values(summary).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  }

  const exportDailySummaryToExcel = () => {
    const summary = calculateDailySummary()
    const exportData = summary.flatMap((day) => {
      const dayData = [
        {
          Fecha: day.date,
          'Método de Pago': '',
          Cantidad: '',
          Total: '',
        },
      ]

      Object.entries(day.methods).forEach(([method, data]) => {
        dayData.push({
          Fecha: '',
          'Método de Pago': getPaymentMethodLabel(method),
          Cantidad: data.count.toString(),
          Total: `$${data.total.toFixed(2)}`,
        })
      })

      dayData.push({
        Fecha: 'TOTAL DEL DÍA',
        'Método de Pago': '',
        Cantidad: Object.values(day.methods)
          .reduce((sum, m) => sum + m.count, 0)
          .toString(),
        Total: `$${day.grandTotal.toFixed(2)}`,
      })

      dayData.push({
        Fecha: '',
        'Método de Pago': '',
        Cantidad: '',
        Total: '',
      })

      return dayData
    })

    exportToExcel(
      exportData,
      `resumen_pagos_${new Date().toISOString().split('T')[0]}`,
      'Resumen Diario'
    )
  }

  const dailySummary = calculateDailySummary()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Pagos</h1>
          <p className="text-gray-600 text-sm mt-1">
            Selecciona carrera, año de carrera y estudiante para gestionar pagos
          </p>
        </div>
        <button
          onClick={() => setShowSummary(!showSummary)}
          className="btn-primary flex items-center gap-2"
        >
          <BarChart3 size={16} />
          {showSummary ? 'Ver Listado' : 'Ver Resumen Diario'}
        </button>
      </div>

      {/* FILTROS: Carrera, Año de Carrera, Estudiante */}
      <div className="card p-6 space-y-4">
        <h2 className="text-lg font-bold">Filtros</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Seleccionar Carrera */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Carrera
            </label>
            <select
              value={selectedProgram}
              onChange={(e) => {
                setSelectedProgram(e.target.value)
                setSelectedCareerYear(null)
                setSelectedStudent(null)
              }}
              className="form-input w-full"
              disabled={loadingProgram}
            >
              <option value="">-- Selecciona carrera --</option>
              {programs.map((prog) => (
                <option key={prog.id} value={prog.id}>
                  {prog.name}
                </option>
              ))}
            </select>
          </div>

          {/* Seleccionar Año de Carrera */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Año de Carrera
            </label>
            <select
              value={selectedCareerYear || ''}
              onChange={(e) => {
                setSelectedCareerYear(e.target.value ? parseInt(e.target.value) : null)
                setSelectedStudent(null)
              }}
              disabled={!selectedProgram || careerYears.length === 0 || loadingProgram}
              className="form-input w-full disabled:opacity-50"
            >
              <option value="">
                {loadingProgram ? 'Cargando...' : '-- Selecciona año de carrera --'}
              </option>
              {careerYears.map((year) => (
                <option key={year} value={year}>
                  {getCareerYearLabel(year)}
                </option>
              ))}
            </select>
          </div>

          {/* Seleccionar Estudiante */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Estudiante
            </label>
            <select
              value={selectedStudent || ''}
              onChange={(e) => setSelectedStudent(e.target.value)}
              disabled={!selectedCareerYear || filteredStudents.length === 0 || loading}
              className="form-input w-full disabled:opacity-50"
            >
              <option value="">-- Selecciona estudiante --</option>
              {filteredStudents.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} ({student.legajo})
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedCareerYear && filteredStudents.length > 0 && (
          <div className="text-sm text-slate-600 pt-2">
            {filteredStudents.length} estudiante{filteredStudents.length !== 1 ? 's' : ''} en {getCareerYearLabel(selectedCareerYear)}
          </div>
        )}
      </div>

      {/* VISTA PRINCIPAL */}
      {showSummary ? (
        // RESUMEN DIARIO
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={exportDailySummaryToExcel}
              className="btn-primary flex items-center gap-2"
            >
              <Download size={16} />
              Exportar a Excel
            </button>
          </div>

          {dailySummary.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-gray-500">No hay pagos realizados</p>
            </div>
          ) : (
            dailySummary.map((day) => (
              <div key={day.date} className="card p-6">
                <h2 className="text-lg font-bold mb-4 border-b pb-2">{day.date}</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  {Object.entries(day.methods).map(([method, data]) => (
                    <div
                      key={method}
                      className="p-4 bg-slate-50 rounded border border-slate-200"
                    >
                      <p className="text-sm font-semibold text-slate-600 uppercase">
                        {getPaymentMethodLabel(method)}
                      </p>
                      <p className="text-2xl font-bold text-slate-900 mt-2">
                        ${data.total.toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        {data.count} pago{data.count !== 1 ? 's' : ''}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">TOTAL DEL DÍA:</span>
                    <span className="text-2xl font-bold text-green-700">
                      ${day.grandTotal.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mt-2">
                    Total de pagos:{' '}
                    {Object.values(day.methods).reduce((sum, m) => sum + m.count, 0)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        // LISTADO DETALLADO
        <>
          {!selectedStudent ? (
            <div className="card p-8 text-center">
              <p className="text-gray-500">
                {!selectedProgram
                  ? 'Selecciona una carrera para comenzar'
                  : loadingProgram
                    ? 'Cargando datos...'
                    : !selectedCareerYear
                      ? 'Selecciona un año de carrera'
                      : filteredStudents.length === 0
                        ? 'No hay estudiantes en este año de carrera'
                        : 'Selecciona un estudiante para ver sus pagos'}
              </p>
            </div>
          ) : selectedStudentData ? (
            <div className="card p-6">
              <h2 className="text-lg font-bold mb-4 border-b pb-2">
                {selectedStudentData.name} ({selectedStudentData.legajo}) - {getCareerYearLabel(selectedCareerYear!)}
              </h2>

              {selectedStudentData.payments.length === 0 ? (
                <p className="text-gray-500 text-center py-6">
                  No hay pagos registrados para este estudiante
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left py-2 px-2">Tipo</th>
                        <th className="text-left py-2 px-2">Mes/Año</th>
                        <th className="text-right py-2 px-2">Cuota Base</th>
                        <th className="text-left py-2 px-2">Estado</th>
                        <th className="text-left py-2 px-2">Vencimiento</th>
                        <th className="text-left py-2 px-2">Fecha Pago</th>
                        <th className="text-left py-2 px-2">Método</th>
                        <th className="text-left py-2 px-2">Incremento</th>
                        <th className="text-center py-2 px-2">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedStudentData.payments.map((payment) => {
                        const isPaid = payment.status === 'pagado'
                        const surchargeInfo =
                          isPaid && payment.paid_at
                            ? calculatePaymentWithSurcharge(
                                payment.base_amount,
                                payment.due_date,
                                payment.paid_at,
                                payment.increment_percentage
                              )
                            : null

                        return (
                          <tr key={payment.id} className="border-b hover:bg-gray-50">
                            <td className="py-2 px-2 capitalize">
                              {payment.payment_type === 'cuota_mensual'
                                ? 'Cuota'
                                : payment.payment_type === 'seguro'
                                  ? 'Seguro'
                                  : payment.payment_type === 'inscripcion'
                                    ? 'Inscripción'
                                    : payment.payment_type}
                            </td>
                            <td className="py-2 px-2">
                              {payment.month
                                ? `${['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][payment.month - 1]} ${payment.year}`
                                : payment.year}
                            </td>
                            <td className="py-2 px-2 text-right font-semibold text-blue-700">
                              {editingId === payment.id ? (
                                <input
                                  type="number"
                                  value={editAmount}
                                  onChange={(e) => setEditAmount(Number(e.target.value))}
                                  className="form-input w-24"
                                />
                              ) : (
                                `$${payment.base_amount.toFixed(2)}`
                              )}
                            </td>
                            <td className="py-2 px-2">
                              {editingId === payment.id ? (
                                <select
                                  value={editStatus}
                                  onChange={(e) => setEditStatus(e.target.value)}
                                  className="form-input"
                                >
                                  <option value="deudor">Deudor</option>
                                  <option value="pendiente">Pendiente</option>
                                  <option value="pagado">Pagado</option>
                                </select>
                              ) : (
                                <span
                                  className={`px-2 py-1 rounded text-xs font-semibold ${
                                    payment.status === 'pagado'
                                      ? 'bg-green-100 text-green-800'
                                      : payment.status === 'pendiente'
                                        ? 'bg-orange-100 text-orange-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                  }`}
                                >
                                  {payment.status === 'pagado'
                                    ? 'Pagado'
                                    : payment.status === 'pendiente'
                                      ? 'Pendiente'
                                      : 'Deudor'}
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-2">{formatDateES(payment.due_date)}</td>
                            <td className="py-2 px-2">
                              {payment.paid_at ? formatDateES(payment.paid_at) : '-'}
                            </td>
                            <td className="py-2 px-2">
                              {editingId === payment.id ? (
                                <select
                                  value={editPaymentMethod}
                                  onChange={(e) => setEditPaymentMethod(e.target.value)}
                                  className="form-input text-xs"
                                >
                                  {paymentMethods.map((m) => (
                                    <option key={m.value} value={m.value}>
                                      {m.label}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className="text-xs bg-slate-100 px-2 py-1 rounded">
                                  {getPaymentMethodLabel(
                                    payment.payment_method || 'efectivo'
                                  )}
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-2 text-right">
                              {surchargeInfo && surchargeInfo.appliedSurcharge ? (
                                <div className="text-red-600 font-semibold text-xs">
                                  <p>+${surchargeInfo.surcharge.toFixed(2)}</p>
                                  <p>Total: ${surchargeInfo.totalAmount.toFixed(2)}</p>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="py-2 px-2 text-center">
                              {editingId === payment.id ? (
                                <div className="flex gap-2 justify-center">
                                  <button
                                    onClick={() =>
                                      updatePayment(
                                        payment.id,
                                        editAmount,
                                        editStatus,
                                        editPaymentMethod
                                      )
                                    }
                                    className="text-green-600 hover:text-green-800"
                                    title="Guardar"
                                  >
                                    <Save size={16} />
                                  </button>
                                  <button
                                    onClick={() => setEditingId(null)}
                                    className="text-red-600 hover:text-red-800"
                                    title="Cancelar"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setEditingId(payment.id)
                                    setEditAmount(payment.amount)
                                    setEditStatus(payment.status)
                                    setEditPaymentMethod(payment.payment_method || 'efectivo')
                                  }}
                                  className="text-blue-600 hover:text-blue-800"
                                  title="Editar"
                                >
                                  <Edit2 size={16} />
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>

                  <div className="mt-4 pt-4 border-t space-y-2">
                    <div className="font-semibold flex justify-between">
                      <span>Total de Cuota Base:</span>
                      <span className="text-blue-700">
                        $
                        {selectedStudentData.payments
                          .reduce((sum, p) => sum + p.base_amount, 0)
                          .toFixed(2)}
                      </span>
                    </div>
                    {selectedStudentData.payments.some((p) => {
                      const isPaid = p.status === 'pagado'
                      const surchargeInfo =
                        isPaid && p.paid_at
                          ? calculatePaymentWithSurcharge(
                              p.base_amount,
                              p.due_date,
                              p.paid_at,
                              p.increment_percentage
                            )
                          : null
                      return surchargeInfo && surchargeInfo.appliedSurcharge
                    }) && (
                      <div className="text-xs text-red-600 pt-2 border-t">
                        <p className="font-semibold">
                          Nota: Algunos pagos tienen incremento aplicado por pago tardío
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </>
      )}

      <div className="card p-4 bg-blue-50 border border-blue-200 space-y-2">
        <h3 className="font-semibold text-blue-900">ℹ️ Información sobre pagos</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>
            • <strong>Cuota Base:</strong> Es el monto base configurado para esta carrera
            {paymentConfig && (
              <ul className="ml-4 mt-1">
                <li>- Seguro: ${paymentConfig.insurance_amount.toFixed(2)}</li>
                <li>- Inscripción: ${paymentConfig.enrollment_amount.toFixed(2)}</li>
                <li>- Cuota Mensual: ${paymentConfig.monthly_quota_amount.toFixed(2)}</li>
              </ul>
            )}
          </li>
          <li>
            • <strong>Incremento:</strong> Se aplica solo si se paga DESPUÉS del vencimiento Y
            después del primer día hábil a partir del 10 del mes ({paymentConfig?.increment_percentage}%)
          </li>
          <li>
            • Registra el <strong>método de pago</strong> cuando marques un pago como realizado
          </li>
          <li>
            • El <strong>resumen diario</strong> agrupa los pagos por fecha y método de pago
          </li>
        </ul>
      </div>
    </div>
  )
}
