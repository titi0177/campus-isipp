import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useUserSession } from '@/hooks/useUserSession'
import { getUserRole, canAccessAdmin } from '@/lib/permissions'
import { StatCard } from '@/components/StatCard'
import { OnlineUsersCard } from '@/components/OnlineUsersCard'
import { EnrollmentAutoEnrollPanel } from '@/components/admin/EnrollmentAutoEnrollPanel'
import { Users, BookOpen, GraduationCap, UserCheck, TrendingUp, Award, AlertCircle } from 'lucide-react'
import { Bar, Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

export const Route = createFileRoute('/admin/')({
  component: AdminDashboard,
})

function AdminDashboard() {
  useUserSession() // Track user session
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [unauthorized, setUnauthorized] = useState(false)
  const [stats, setStats] = useState({ students: 0, subjects: 0, programs: 0, professors: 0, enrollments: 0, avg: 0 })
  const [gradeData, setGradeData] = useState(null)
  const [statusData, setStatusData] = useState(null)
  const [topSubjects, setTopSubjects] = useState([])
  const [recentEnrollments, setRecentEnrollments] = useState([])
  const [recentGrades, setRecentGrades] = useState([])

  useEffect(() => {
    checkAccessAndLoad()
  }, [])

  async function checkAccessAndLoad() {
    try {
      const role = await getUserRole()

      if (!canAccessAdmin(role)) {
        setUnauthorized(true)
        setLoading(false)
        setTimeout(() => navigate({ to: '/dashboard' }), 2000)
        return
      }

      await loadData()
    } catch (err) {
      console.error('Error checking access:', err)
      setUnauthorized(true)
    } finally {
      setLoading(false)
    }
  }

  async function loadData() {
    try {
      const [[s1, s2, s3, s4, s5, s6]] = await Promise.all([
        Promise.all([
          supabase.from('students').select('*', { count: 'exact', head: true }),
          supabase.from('subjects').select('*', { count: 'exact', head: true }),
          supabase.from('programs').select('*', { count: 'exact', head: true }),
          supabase.from('professors').select('*', { count: 'exact', head: true }),
          supabase.from('enrollments').select('*', { count: 'exact', head: true }),
          supabase.from('enrollment_grades').select('final_grade, final_status'),
        ]),
      ])

      const counts = {
        students: s1.count || 0,
        subjects: s2.count || 0,
        programs: s3.count || 0,
        professors: s4.count || 0,
        enrollments: s5.count || 0,
      }

      const grades = s6.data || []
      const avg = grades.length ? (grades.reduce((a, b) => a + (b.final_grade || 0), 0) / grades.length).toFixed(2) : 0

      setStats({ ...counts, avg: parseFloat(avg) })

      // Estado académico
      if (grades.length) {
        const statusCounts = grades.reduce((acc, g) => {
          acc[g.final_status || 'en_curso'] = (acc[g.final_status || 'en_curso'] || 0) + 1
          return acc
        }, {})

        setStatusData({
          labels: ['Promocionado', 'Aprobado', 'Desaprobado', 'En Curso'],
          datasets: [{
            data: [statusCounts['promocionado'] || 0, statusCounts['aprobado'] || 0, statusCounts['desaprobado'] || 0, statusCounts['en_curso'] || 0],
            backgroundColor: ['#16a34a', '#2563eb', '#dc2626', '#d97706'],
          }],
        })

        // Distribución de notas
        const dist = Array(10).fill(0)
        grades.forEach((g) => {
          if (g.final_grade) {
            const i = Math.min(Math.floor(g.final_grade) - 1, 9)
            if (i >= 0) dist[i]++
          }
        })

        setGradeData({
          labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
          datasets: [{ label: 'Cantidad de alumnos', data: dist, backgroundColor: '#582c31', borderRadius: 4 }],
        })
      }

      // Materias más cursadas
      const { data: topData } = await supabase.from('enrollments').select('subject:subjects(name)').limit(50)
      if (topData) {
        const count = topData.reduce((acc, e) => {
          const n = e.subject?.name
          acc[n] = (acc[n] || 0) + 1
          return acc
        }, {})

        setTopSubjects(Object.entries(count).sort((a, b) => b[1] - a[1]).slice(0, 5))
      }

      // Últimas inscripciones
      const { data: recentEnr } = await supabase
        .from('enrollments')
        .select('id, created_at, student:students(first_name, last_name), subject:subjects(name)')
        .order('created_at', { ascending: false })
        .limit(5)

      setRecentEnrollments(recentEnr || [])

      // Últimas notas
      const { data: recentGr } = await supabase
        .from('enrollment_grades')
        .select('final_grade, enrollment:enrollments(student:students(first_name, last_name), subject:subjects(name))')
        .order('created_at', { ascending: false })
        .limit(5)

      setRecentGrades(recentGr || [])
    } catch (err) {
      console.error('Error loading admin data:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (unauthorized) {
    return (
      <div className="card p-8 border-2 border-red-200 bg-red-50 rounded-xl max-w-md">
        <div className="flex items-center gap-3 mb-3">
          <AlertCircle className="text-red-600" size={24} />
          <h2 className="text-lg font-bold text-red-900">Acceso Denegado</h2>
        </div>
        <p className="text-red-800 text-sm">No tienes permisos para acceder al panel de administración.</p>
        <p className="text-xs text-red-600 mt-2">Serás redirigido al dashboard...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-slate-900">Panel de Administración</h1>
        <p className="text-slate-600 mt-2">Resumen operativo del sistema académico</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard title="Estudiantes" value={stats.students} icon={<Users size={24} />} color="bordeaux" />
        <StatCard title="Materias" value={stats.subjects} icon={<BookOpen size={24} />} color="blue" />
        <StatCard title="Carreras" value={stats.programs} icon={<GraduationCap size={24} />} color="green" />
        <StatCard title="Profesores" value={stats.professors} icon={<UserCheck size={24} />} color="orange" />
        <StatCard title="Inscripciones" value={stats.enrollments} icon={<TrendingUp size={24} />} color="purple" />
        <StatCard title="Promedio" value={stats.avg !== null && stats.avg !== undefined ? stats.avg.toFixed(2) : '0.00'} icon={<Award size={24} />} color="bordeaux" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <OnlineUsersCard />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Distribución de Notas</h2>
          {gradeData ? <Bar data={gradeData} options={{ maintainAspectRatio: true }} /> : <p className="text-slate-400">Sin datos</p>}
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Estado Académico</h2>
          {statusData ? <Doughnut data={statusData} /> : <p className="text-slate-400">Sin datos</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <EnrollmentAutoEnrollPanel />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Materias con más alumnos</h2>
          <ul className="space-y-3">
            {topSubjects.map((s, i) => (
              <li key={i} className="flex justify-between items-center p-2 hover:bg-slate-50 rounded transition">
                <span className="text-slate-700">{s[0]}</span>
                <span className="font-bold text-[var(--siu-blue)] bg-blue-100 px-3 py-1 rounded-full text-sm">{s[1]}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Últimas Inscripciones</h2>
          <ul className="space-y-3">
            {recentEnrollments.map((e) => (
              <li key={e.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded transition">
                <span className="text-slate-700 text-sm">{e.student?.first_name} {e.student?.last_name}</span>
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">{e.subject?.name}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
