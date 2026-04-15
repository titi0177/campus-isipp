import { createFileRoute, Link } from '@tanstack/react-router'
import { useCallback, useEffect, useState, memo, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { generateRegularCertificate } from '@/utils/generateRegularCertificate'
import { FileText, GraduationCap, CalendarCheck, BookOpen, TrendingUp, Calendar } from 'lucide-react'
import StatCard from '@/components/StatCard'
import { CareerProgressBar } from '@/features/student/components/CareerProgressBar'
import { useRealtimeGrades } from '@/hooks/useRealtimeGrades'
import { useRealtimeFinalExams } from '@/hooks/useRealtimeFinalExams'
import { useRealtimeAnnouncements } from '@/hooks/useRealtimeAnnouncements'

export const Route = createFileRoute('/dashboard/')({
  component: DashboardPage,
})

type Row = {
  subject?: { name?: string; code?: string }
  final_grade?: number | null
  partial_grade?: number | null
  final_exam_grade?: number | null
  status?: string
  allows_promotion?: boolean
}

// Memoized stat card component
const StatCardMemo = memo(function StatCardComp({ 
  label, 
  value, 
  icon: Icon, 
  bg, 
  text 
}: {
  label: string
  value: string | number
  icon: any
  bg: string
  text: string
}) {
  return (
    <div className={`card p-4 sm:p-6 ${bg} shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className={`text-xs sm:text-sm font-semibold ${text} uppercase tracking-wide`}>{label}</p>
          <p className={`text-2xl sm:text-3xl font-bold mt-2`}>{value}</p>
        </div>
        <Icon className="w-6 h-6 sm:w-8 sm:h-8 opacity-80 flex-shrink-0" />
      </div>
    </div>
  )
})

// Memoized exam card component
const ExamCard = memo(function ExamCardComp({ 
  exam, 
  idx 
}: {
  exam: any
  idx: number
}) {
  return (
    <div className="flex gap-3 sm:gap-4 p-3 sm:p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
      <div className="flex flex-col items-center justify-start flex-shrink-0">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[var(--siu-blue)] text-white flex items-center justify-center font-bold text-xs sm:text-sm">
          {idx + 1}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 text-sm sm:text-base truncate">{exam.subject?.name ?? 'Materia'}</p>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 flex gap-2 flex-wrap">
          <span>📅 {new Date(exam.exam_date).toLocaleDateString('es-AR')}</span>
          <span>🕐 {new Date(exam.exam_date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span>
          {exam.location && <span className="hidden sm:inline">📍 {exam.location}</span>}
        </p>
      </div>
    </div>
  )
})

// Memoized grades table row
const GradeRow = memo(function GradeRowComp({ s, index }: { s: Row; index: number }) {
  const fg = s.final_grade
  let status = 'En curso'
  let statusBg = 'bg-slate-100 text-slate-700'
  let noteColor = 'text-slate-600'
  
  if (fg != null && fg >= 8 && s.allows_promotion) {
    status = 'Promocionado'
    statusBg = 'bg-green-100 text-green-700 font-semibold'
    noteColor = 'text-green-700 font-bold'
  } else if (fg != null && fg >= 6) {
    status = 'Aprobado'
    statusBg = 'bg-blue-100 text-blue-700 font-semibold'
    noteColor = 'text-blue-700 font-bold'
  } else if (fg != null && fg < 6) {
    status = 'Desaprobado'
    statusBg = 'bg-red-100 text-red-700 font-semibold'
    noteColor = 'text-red-700 font-bold'
  }
  
  return (
    <tr key={index} className="hover:bg-slate-50 transition-colors">
      <td className="px-2 sm:px-4 py-2 sm:py-3 font-medium text-slate-900 text-xs sm:text-sm truncate">{s.subject?.name}</td>
      <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-slate-600 text-xs sm:text-sm">{s.partial_grade ?? '—'}</td>
      <td className="hidden sm:table-cell px-4 py-3 text-center text-slate-600">{s.final_exam_grade ?? '—'}</td>
      <td className={`px-2 sm:px-4 py-2 sm:py-3 text-center font-bold text-xs sm:text-sm ${noteColor}`}>{fg ?? '—'}</td>
      <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
        <span className={`px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold whitespace-nowrap ${statusBg}`}>{status}</span>
      </td>
    </tr>
  )
})

function DashboardPage() {
  const [student, setStudent] = useState<any>(null)
  const [rows, setRows] = useState<Row[]>([])
  const [attendancePercent, setAttendancePercent] = useState(0)
  const [gpa, setGpa] = useState<number | null>(null)
  const [progress, setProgress] = useState({
    total_materias: 0,
    aprobadas: 0,
    en_curso: 0,
    pendientes: 0,
    porcentaje: 0,
  })
  const [upcomingExams, setUpcomingExams] = useState<any[]>([])

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    try {
      const { data: studentData } = await supabase
        .from('students')
        .select('*, program:programs(name)')
        .eq('user_id', user.id)
        .single()

      if (!studentData) return
      setStudent(studentData)

      // Batch load all related data in parallel
      const [enrollmentsRes, programSubjectsRes, examsRes] = await Promise.all([
        supabase
          .from('enrollments')
          .select(`
            id,
            subject_id,
            subject:subjects(name, code, allows_promotion),
            grades(final_grade, partial_grade, final_grade_exam, status),
            attendance(percentage)
          `)
          .eq('student_id', studentData.id),
        supabase
          .from('subjects')
          .select('id')
          .eq('program_id', studentData.program_id),
        supabase
          .from('final_exams')
          .select('id, exam_date, location, subject:subjects(name)')
          .gte('exam_date', new Date().toISOString())
          .order('exam_date', { ascending: true })
          .limit(6),
      ])

      // Process enrollments
      if (enrollmentsRes.data) {
        const mapped: Row[] = enrollmentsRes.data.map((e: any) => {
          const g = Array.isArray(e.grades) ? e.grades[0] : e.grades
          return {
            subject: e.subject,
            final_grade: g?.final_grade,
            partial_grade: g?.partial_grade,
            final_exam_grade: g?.final_grade_exam,
            status: g?.status,
            allows_promotion: e.subject?.allows_promotion,
          }
        })
        setRows(mapped)

        // Calculate GPA from mapped data
        let gpaSum = 0
        let gpaCount = 0
        for (const row of mapped) {
          if (row.final_grade != null && (row.status === 'passed' || row.status === 'promoted')) {
            gpaSum += row.final_grade
            gpaCount++
          }
        }
        setGpa(gpaCount ? gpaSum / gpaCount : null)

        // Calculate progress
        const approved = mapped.filter(r => r.final_grade != null && r.final_grade >= 6).length
        const enCurso = mapped.filter(r => r.final_grade == null).length
        const pendientes = mapped.filter(r => r.final_grade != null && r.final_grade < 6).length
        const totalMaterias = programSubjectsRes.data?.length ?? 0
        const porcentaje = totalMaterias > 0 ? Math.round((approved / totalMaterias) * 100) : 0

        setProgress({
          total_materias: totalMaterias,
          aprobadas: approved,
          en_curso: enCurso,
          pendientes,
          porcentaje,
        })

        // Calculate average attendance
        let attSum = 0
        let attCount = 0
        for (const e of enrollmentsRes.data) {
          const att = Array.isArray(e.attendance) ? e.attendance[0] : e.attendance
          const p = att?.percentage
          if (p != null) {
            attSum += p
            attCount++
          }
        }
        setAttendancePercent(attCount ? Math.round(attSum / attCount) : 0)
      }

      // Set exams
      if (examsRes.data) {
        setUpcomingExams(examsRes.data)
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  useRealtimeGrades(loadData)
  useRealtimeFinalExams(loadData)
  useRealtimeAnnouncements(loadData)

  if (!student) return null

  const approved = rows.filter(
    (s) =>
      s.final_grade != null &&
      s.final_grade >= 6 &&
      s.status &&
      ['promoted', 'passed', 'regular'].includes(s.status),
  ).length

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Hero Header - Responsive */}
      <div className="bg-gradient-to-r from-[var(--isipp-bordo)] to-[var(--siu-blue)] rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 text-white shadow-lg">
        <div className="flex flex-col justify-between gap-3 sm:gap-4">
          <div>
            <p className="text-xs sm:text-sm font-medium opacity-90 mb-1 sm:mb-2">Bienvenido de nuevo</p>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold truncate">{student.first_name}</h1>
            <p className="text-xs sm:text-sm opacity-80 mt-2 truncate">
              {student.program?.name ?? 'Carrera'} • Legajo: {student.legajo}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link
              to="/dashboard/enroll-subjects"
              className="bg-white/20 hover:bg-white/30 border border-white/40 text-white px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all active:scale-95"
            >
              + Inscribirse
            </Link>
            <Link
              to="/dashboard/roadmap"
              className="bg-white/20 hover:bg-white/30 border border-white/40 text-white px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all active:scale-95"
            >
              Plan de estudios
            </Link>
          </div>
        </div>
      </div>

      {/* Career Progress */}
      <div>
        <CareerProgressBar
          careerName={student.program?.name ?? 'Tu carrera'}
          porcentaje={progress.porcentaje}
          aprobadas={progress.aprobadas}
          enCurso={progress.en_curso}
          pendientes={progress.pendientes}
          totalMaterias={progress.total_materias}
        />
      </div>

      {/* Stats Grid - Responsive columns */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
        <StatCardMemo
          label="Promedio"
          value={gpa != null ? gpa.toFixed(2) : '—'}
          icon={TrendingUp}
          bg="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200/50"
          text="text-amber-700"
        />
        <StatCardMemo
          label="Aprobadas"
          value={approved}
          icon={GraduationCap}
          bg="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200/50"
          text="text-emerald-700"
        />
        <StatCardMemo
          label="Asistencia"
          value={`${attendancePercent}%`}
          icon={CalendarCheck}
          bg="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200/50"
          text="text-blue-700"
        />
        <StatCardMemo
          label="En curso"
          value={rows.length}
          icon={BookOpen}
          bg="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200/50"
          text="text-purple-700"
        />
      </div>

      {/* Upcoming Exams */}
      <div className="card overflow-hidden shadow-md">
        <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-2 sm:gap-3">
          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white flex-shrink-0" />
          <h2 className="text-base sm:text-lg font-bold text-white truncate">Próximas mesas de examen</h2>
        </div>
        <div className="p-3 sm:p-6">
          {upcomingExams.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <Calendar className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300 mx-auto mb-2 sm:mb-3" />
              <p className="text-slate-600 font-medium text-sm sm:text-base">No hay mesas programadas</p>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">Las mesas se mostrarán aquí cuando se publiquen</p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {upcomingExams.map((exam, idx) => (
                <ExamCard key={exam.id} exam={exam} idx={idx} />
              ))}
            </div>
          )}
          <Link to="/dashboard/exams" className="mt-3 sm:mt-4 inline-flex items-center gap-2 text-[var(--siu-blue)] hover:text-[var(--siu-navy)] font-semibold text-xs sm:text-sm transition-colors">
            Ver todas las mesas →
          </Link>
        </div>
      </div>

      {/* Recent Grades */}
      <div className="card overflow-hidden shadow-md">
        <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white flex-shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-white truncate">Calificaciones recientes</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => generateRegularCertificate(student, student.program)}
              className="bg-white/20 hover:bg-white/30 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded text-[10px] sm:text-xs font-semibold transition-colors flex-shrink-0"
            >
              Certificado
            </button>
            <Link to="/dashboard/certificates" className="text-[10px] sm:text-xs font-semibold text-white/80 hover:text-white transition-colors flex-shrink-0">
              Más →
            </Link>
          </div>
        </div>
        <div className="p-3 sm:p-6 overflow-x-auto">
          {rows.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300 mx-auto mb-2 sm:mb-3" />
              <p className="text-slate-600 font-medium text-sm sm:text-base">No hay calificaciones registradas</p>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">Tus notas aparecerán aquí cuando los docentes las carguen</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-3 sm:-mx-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    <th className="px-2 sm:px-4 py-2 sm:py-3">Materia</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-center">Parcial</th>
                    <th className="hidden sm:table-cell px-4 py-3 text-center">Final</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-center">Nota</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((s, i) => (
                    <GradeRow key={i} s={s} index={i} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
