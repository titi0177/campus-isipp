import { createFileRoute, Link } from '@tanstack/react-router'
import { DollarSign, Lock, Users, TrendingUp, Settings } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'

export const Route = createFileRoute('/treasurer/')({
  component: TreasurerIndex,
})

function TreasurerIndex() {
  const [stats, setStats] = useState({ totalStudents: 0, totalPayments: 0, totalOwed: 0, totalPaid: 0 })
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    try {
      // Total students
      const { count: studentCount } = await supabase
        .from('students')
        .select('*', { count: 'exact' })

      // Total payments
      const { data: paymentsData } = await supabase.from('payments').select('*')
      const payments = paymentsData || []

      const totalOwed = payments
        .filter(p => p.status === 'deudor' || p.status === 'revision')
        .reduce((sum, p) => sum + (p.amount || 0), 0)

      const totalPaid = payments
        .filter(p => p.status === 'pagado')
        .reduce((sum, p) => sum + (p.amount || 0), 0)

      setStats({
        totalStudents: studentCount || 0,
        totalPayments: payments.length,
        totalOwed,
        totalPaid,
      })
    } catch (err) {
      console.error('Error:', err)
      showToast('Error cargando estadísticas', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <p className="text-slate-600">Cargando...</p>
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <DollarSign size={32} />
          Panel de Tesorería
        </h1>
        <p className="text-slate-600 mt-2">
          Bienvenido al módulo de gestión de pagos y cobranzas
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-6 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Estudiantes</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">{stats.totalStudents}</p>
            </div>
            <Users size={32} className="text-blue-200" />
          </div>
        </div>

        <div className="card p-6 bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">Pagado</p>
              <p className="text-3xl font-bold text-green-900 mt-2">${stats.totalPaid !== null && stats.totalPaid !== undefined ? stats.totalPaid.toFixed(0) : '0'}</p>
            </div>
            <TrendingUp size={32} className="text-green-200" />
          </div>
        </div>

        <div className="card p-6 bg-gradient-to-br from-red-50 to-red-100 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">Adeudado</p>
              <p className="text-3xl font-bold text-red-900 mt-2">${stats.totalOwed !== null && stats.totalOwed !== undefined ? stats.totalOwed.toFixed(0) : '0'}</p>
            </div>
            <DollarSign size={32} className="text-red-200" />
          </div>
        </div>

        <div className="card p-6 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Total Movimientos</p>
              <p className="text-3xl font-bold text-purple-900 mt-2">{stats.totalPayments}</p>
            </div>
            <DollarSign size={32} className="text-purple-200" />
          </div>
        </div>
      </div>

      {/* Actions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/treasurer/payments"
          className="card p-6 hover:shadow-lg transition border-2 border-slate-200 hover:border-blue-400"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign size={24} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Gestión de Pagos</h3>
              <p className="text-sm text-slate-600 mt-1">Ver y editar pagos de estudiantes</p>
            </div>
          </div>
        </Link>

        <Link
          to="/treasurer/configuration"
          className="card p-6 hover:shadow-lg transition border-2 border-slate-200 hover:border-blue-400"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-100 rounded-lg">
              <Settings size={24} className="text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Configuración</h3>
              <p className="text-sm text-slate-600 mt-1">Montos por carrera e incrementos</p>
            </div>
          </div>
        </Link>

        <Link
          to="/treasurer/settings"
          className="card p-6 hover:shadow-lg transition border-2 border-slate-200 hover:border-blue-400"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Lock size={24} className="text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Seguridad</h3>
              <p className="text-sm text-slate-600 mt-1">Cambia tu contraseña</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card p-6 bg-blue-50 border border-blue-200">
          <h3 className="font-semibold text-slate-900 mb-3">📊 Estadísticas Rápidas</h3>
          <ul className="space-y-2 text-sm text-slate-700">
            <li>✓ Total de movimientos: <strong>{stats.totalPayments}</strong></li>
            <li>✓ Monto recaudado: <strong>${stats.totalPaid !== null && stats.totalPaid !== undefined ? stats.totalPaid.toFixed(2) : '0.00'}</strong></li>
            <li>✓ Deuda pendiente: <strong>${stats.totalOwed !== null && stats.totalOwed !== undefined ? stats.totalOwed.toFixed(2) : '0.00'}</strong></li>
            <li>✓ Tasa de cobranza: <strong>
              {stats.totalPaid + stats.totalOwed > 0
                ? ((stats.totalPaid / (stats.totalPaid + stats.totalOwed)) * 100).toFixed(1)
                : 0}%
            </strong></li>
          </ul>
        </div>

        <div className="card p-6 bg-green-50 border border-green-200">
          <h3 className="font-semibold text-slate-900 mb-3">💡 Acciones Disponibles</h3>
          <ul className="space-y-2 text-sm text-slate-700">
            <li>→ Ir a <Link to="/treasurer/payments" className="text-blue-600 hover:underline font-semibold">Gestión de Pagos</Link></li>
            <li>→ Ver <Link to="/treasurer/settings" className="text-blue-600 hover:underline font-semibold">Configuración de Seguridad</Link></li>
            <li>→ Cambiar contraseña desde Configuración</li>
            <li>→ Registrar nuevos pagos por estudiante</li>
          </ul>
        </div>
      </div>
    </div>
  )
}