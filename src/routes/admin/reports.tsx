import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Bar, Line, Doughnut } from 'react-chartjs-2'
import { Download } from 'lucide-react'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler)

export const Route = createFileRoute('/admin/reports')({
  component: ReportsPage,
})

function ReportsPage() {
  const [gradesBySubject, setGradesBySubject] = useState<any>(null)
  const [passRates, setPassRates] = useState<any>(null)
  const [attendanceData, setAttendanceData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: grades }, { data: attendance }] = await Promise.all([
      supabase.from('enrollments').select('subject:subjects(name), grade:grades(final_grade, status)'),
      supabase.from('enrollments').select('subject:subjects(name), attendance:attendance(percentage)'),
    ])

    if (grades) {
      // Average grade per subject
      const subjectGrades: Record<string, number[]> = {}
      grades.forEach((enr: any) => {
        const name = enr.subject?.name
        if (!name) return
        const fg = enr.grade?.[0]?.final_grade
        if (fg != null) {
          if (!subjectGrades[name]) subjectGrades[name] = []
          subjectGrades[name].push(fg)
        }
      })
      const subjectNames = Object.keys(subjectGrades).slice(0, 10)
      const avgs = subjectNames.map(n => {
        const vals = subjectGrades[n]
        return vals.length > 0 ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2) : '0.00'
      })
      setGradesBySubject({
        labels: subjectNames,
        datasets: [{
          label: 'Promedio de notas',
          data: avgs,
          backgroundColor: '#582c31',
          borderRadius: 4,
        }],
      })

      // Pass rates
      const subjectStatus: Record<string, { passed: number; total: number }> = {}
      grades.forEach((enr: any) => {
        const name = enr.subject?.name
        if (!name) return
        if (!subjectStatus[name]) subjectStatus[name] = { passed: 0, total: 0 }
        subjectStatus[name].total++
        if (['promoted', 'passed'].includes(enr.grade?.[0]?.status)) subjectStatus[name].passed++
      })
      const srNames = Object.keys(subjectStatus).slice(0, 10)
      const rates = srNames.map(n => Math.round((subjectStatus[n].passed / subjectStatus[n].total) * 100))
      setPassRates({
        labels: srNames,
        datasets: [{
          label: '% Aprobados',
          data: rates,
          borderColor: '#582c31',
          backgroundColor: 'rgba(88,44,49,0.12)',
          fill: true,
          tension: 0.4,
        }],
      })
    }

    if (attendance) {
      const ranges = { '0-50%': 0, '51-74%': 0, '75-89%': 0, '90-100%': 0 }
      attendance.forEach((enr: any) => {
        const pct = enr.attendance?.[0]?.percentage
        if (pct == null) return
        if (pct <= 50) ranges['0-50%']++
        else if (pct <= 74) ranges['51-74%']++
        else if (pct <= 89) ranges['75-89%']++
        else ranges['90-100%']++
      })
      setAttendanceData({
        labels: Object.keys(ranges),
        datasets: [{
          data: Object.values(ranges),
          backgroundColor: ['#dc2626', '#d97706', '#16a34a', '#059669'],
        }],
      })
    }

    setLoading(false)
  }

  const exportCSV = async () => {
    const { data } = await supabase
      .from('students')
      .select('first_name, last_name, legajo, dni, email, status, program:programs(name)')
    if (!data) return
    const header = 'Apellido,Nombre,Legajo,DNI,Email,Estado,Carrera\n'
    const rows = data.map((s: any) => `${s.last_name},${s.first_name},${s.legajo},${s.dni},${s.email},${s.status},${s.program?.name || ''}`).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'estudiantes_isipp.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const chartOpts = { responsive: true, plugins: { legend: { display: false } } }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Reportes y Estadísticas</h1>
        <button onClick={exportCSV} className="btn-secondary flex items-center gap-2">
          <Download size={16} /> Exportar Estudiantes CSV
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-6">
          {[...Array(3)].map((_, i) => <div key={i} className="card animate-pulse h-64 bg-gray-100" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Promedio por Materia</h2>
            {gradesBySubject ? <Bar data={gradesBySubject} options={chartOpts} /> : <p className="text-gray-400 text-sm text-center py-8">Sin datos</p>}
          </div>
          <div className="card">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Tasa de Aprobación por Materia (%)</h2>
            {passRates ? <Line data={passRates} options={chartOpts} /> : <p className="text-gray-400 text-sm text-center py-8">Sin datos</p>}
          </div>
          <div className="card">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Distribución de Asistencia</h2>
            {attendanceData ? <Doughnut data={attendanceData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} /> : <p className="text-gray-400 text-sm text-center py-8">Sin datos</p>}
          </div>
        </div>
      )}
    </div>
  )
}
