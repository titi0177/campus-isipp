import { createFileRoute, Link } from '@tanstack/react-router'
import { useCallback, useEffect, useState, memo } from 'react'
import { ReinscriptionModal } from '@/components/ReinscriptionModal'
import { supabase } from '@/lib/supabase'
import { generateRegularCertificate } from '@/utils/generateRegularCertificate'
import { 
  FileText, 
  GraduationCap, 
  CalendarCheck, 
  BookOpen, 
  TrendingUp, 
  Calendar,
  Award,
  Clock,
  ChevronRight,
  Sparkles
} from 'lucide-react'
import StatCard from '@/components/StatCard'
import { CareerProgressBar } from '@/features/student/components/CareerProgressBar'
import { useRealtimeGrades } from '@/hooks/useRealtimeGrades'
import { useRealtimeFinalExams } from '@/hooks/useRealtimeFinalExams'
import { useRealtimeAnnouncements } from '@/hooks/useRealtimeAnnouncements'

export const Route = createFileRoute('/dashboard/')({
  component: DashboardPage,
})

type Row = {
  subject?: { name?: string; code?: string; allows_promotion?: boolean }
  final_grade?: number | null
  partial_grade?: number | null
  final_status?: string
  partial_status?: string
}

const StatCardMemo = memo(function StatCardComp({ 
  label, 
  value, 
  icon: Icon, 
  bg, 
  text,
  subtext
}: {
  label: string
  value: string | number
  icon: any
  bg: string
  text: string
  subtext?: string
}) {
  return (
    <div className={`card p-5 sm:p-6 ${bg} shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className={`text-xs sm:text-sm font-semibold ${text} uppercase tracking-widest`}>{label}</p>
          <p className={`text-3xl sm:text-4xl font-black mt-2 ${text}`}>{value}</p>
          {subtext && <p className="text-xs mt-1 opacity-70">{subtext}</p>}
        </div>
        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-6 h-6 sm:w-7 sm:h-7 opacity-60" />
        </div>
      </div>
    </div>
  )
})

const ExamCard = memo(function ExamCardComp({ 
  exam, 
  idx 
}: {
  exam: any
  idx: number
}) {
  return (
    <div className="flex gap-4 p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-300 group">
      <div className="flex flex-col items-center justify-start flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--siu-blue)] to-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md group-hover:shadow-lg transition-shadow">
          {idx + 1}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 text-sm sm:text-base">{exam.subject?.name ?? 'Materia'}</p>
        <div className="flex gap-3 mt-2 flex-wrap text-xs sm:text-sm text-slate-600">
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {new Date(exam.exam_date).toLocaleDateString('es-AR')}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {new Date(exam.exam_date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
          </span>
          {exam.location && <span className="hidden sm:flex items-center gap-1">📍 {exam.location}</span>}
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-400 transition-colors flex-shrink-0" />
    </div>
  )
})

const GradeRow = memo(function GradeRowComp({ s, index }: { s: Row; index: number }) {
  const fg = s.final_grade
  let status = 'En curso'
  let statusBg = 'bg-slate-100 text-slate-700'
  let statusIcon = '⏳'
  let noteColor = 'text-slate-600'
  
  if (fg != null && fg >= 8 && s.subject?.allows_promotion) {
    status = 'Promocionado'
    statusBg = 'bg-emerald-100 text-emerald-700 font-semibold'
    statusIcon = '⭐'
    noteColor = 'text-emerald-700 font-bold'
  } else if (fg != null && fg >= 6) {
    status = 'Aprobado'
    statusBg = 'bg-blue-100 text-blue-700 font-semibold'
    statusIcon = '✓'
    noteColor = 'text-blue-700 font-bold'
  } else if (fg != null && fg < 6) {
    status = 'Desaprobado'
    statusBg = 'bg-red-100 text-red-700 font-semibold'
    statusIcon = '✗'
    noteColor = 'text-red-700 font-bold'
  } else if (s.partial_status === 'regular') {
    status = 'Regular'
    statusBg = 'bg-yellow-100 text-yellow-700 font-semibold'
    statusIcon = '📖'
  } else if (s.partial_status === 'promocionado') {
    status = 'Promocionado'
    statusBg = 'bg-green-100 text-green-700 font-semibold'
    statusIcon = '🎓'
    noteColor = 'text-green-700 font-bold'
  } else if (s.partial_status === 'desaprobado') {
    status = 'Desaprobado'
    statusBg = 'bg-red-100 text-red-700 font-semibold'
    statusIcon = '✗'
    noteColor = 'text-red-700 font-bold'
  }
  
  return (
    <tr key={index} className="hover:bg-blue-50 transition-colors duration-200 border-b border-slate-100 last:border-b-0">
      <td className="px-3 sm:px-4 py-3 font-medium text-slate-900 text-sm">{s.subject?.name}</td>
      <td className="px-3 sm:px-4 py-3 text-center text-slate-600 text-sm font-medium">{s.partial_grade !== null && s.partial_grade !== undefined ? s.partial_grade.toFixed(1) : '—'}</td>
      <td className="hidden sm:table-cell px-4 py-3 text-center text-slate-600 text-sm font-medium">{fg !== null && fg !== undefined ? fg.toFixed(1) : '—'}</td>
      <td className={`px-3 sm:px-4 py-3 text-center font-black text-lg ${noteColor}`}>{fg !== null && fg !== undefined ? fg.toFixed(1) : '—'}</td>
      <td className="px-3 sm:px-4 py-3 text-center">
        <span className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${statusBg} inline-flex items-center gap-1`}>
          {statusIcon} {status}
        </span>
      </td>
    </tr>
  )
})

function DashboardPage() {
  const [student, setStudent] = useState<any>(null)
  const [showReinscriptionModal, setShowReinscriptionModal] = useState(false)
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

      const [enrollmentsRes, programSubjectsRes, examsRes] = await Promise.all([
        supabase
          .from('enrollments')
          .select(`
            id,
            subject_id,
            subject:subjects(name, code, allows_promotion),
            enrollment_grades(final_grade, partial_grade, final_status, partial_status),
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

      if (enrollmentsRes.data) {
        const mapped: Row[] = enrollmentsRes.data.map((e: any) => {
          const g = Array.isArray(e.enrollment_grades) ? e.enrollment_grades[0] : e.enrollment_grades
          return {
            subject: e.subject,
            final_grade: g?.final_grade,
            partial_grade: g?.partial_grade,
            final_status: g?.final_status,
            partial_status: g?.partial_status,
          }
        })
        setRows(mapped)

        let gpaSum = 0
        let gpaCount = 0
        for (const row of mapped) {
          if (row.final_grade != null && (row.final_status === 'aprobado' || row.final_status === 'promocionado')) {
            gpaSum += row.final_grade
            gpaCount++
          }
        }
        setGpa(gpaCount ? gpaSum / gpaCount : null)

        // Contar solo aprobadas/promocionadas con final_status válido
        const approved = mapped.filter(r => 
          r.final_grade != null && 
          r.final_grade >= 6 && 
          (r.final_status === 'aprobado' || r.final_status === 'promocionado')
        ).length
        
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

  const approved = rows.filter(r => 
    r.final_grade != null && 
    r.final_grade >= 6 && 
    (r.final_status === 'aprobado' || r.final_status === 'promocionado')
  ).length

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--isipp-bordo)] via-red-600 to-[var(--siu-blue)] opacity-90"></div>
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)]"></div>
        
        <div className="relative p-6 sm:p-8 md:p-10 text-white">
          <div className="flex flex-col justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-yellow-300" />
                <p className="text-sm font-semibold uppercase tracking-widest text-yellow-300">Campus ISIPP</p>
              </div>
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-black mb-2">{student.first_name}</h1>
              <p className="text-sm sm:text-base opacity-90 font-medium">
                {student.program?.name ?? 'Carrera'} • Legajo <span className="font-bold">{student.legajo}</span>
              </p>
            </div>
            <div className="flex gap-3 flex-wrap pt-4 border-t border-white/20">
              <Link
                to="/dashboard/enroll-subjects"
                className="bg-white text-[var(--siu-blue)] hover:bg-slate-100 px-5 sm:px-6 py-2.5 rounded-lg font-bold text-sm transition-all shadow-lg hover:shadow-xl active:scale-95"
              >
                + Inscribirse
              </Link>
              <button
                onClick={() => setShowReinscriptionModal(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white px-5 sm:px-6 py-2.5 rounded-lg font-bold text-sm transition-all shadow-lg hover:shadow-xl active:scale-95"
              >
                🔄 Reinscripción
              </button>
              <Link
                to="/dashboard/roadmap"
                className="bg-white/20 hover:bg-white/30 border border-white/40 text-white px-5 sm:px-6 py-2.5 rounded-lg font-semibold text-sm transition-all active:scale-95"
              >
                Plan de estudios
              </Link>
            </div>
          </div>
        </div>
      </div>

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

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
        <StatCardMemo
          label="Promedio"
          value={gpa !== null && gpa !== undefined ? gpa.toFixed(2) : '—'}
          subtext="GPA"
          icon={TrendingUp}
          bg="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200"
          text="text-amber-700"
        />
        <StatCardMemo
          label="Aprobadas"
          value={approved}
          subtext={`de ${progress.total_materias}`}
          icon={Award}
          bg="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200"
          text="text-emerald-700"
        />
        <StatCardMemo
          label="Asistencia"
          value={`${attendancePercent}%`}
          subtext="Promedio"
          icon={CalendarCheck}
          bg="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200"
          text="text-blue-700"
        />
        <StatCardMemo
          label="En Curso"
          value={progress.en_curso}
          subtext={`de ${rows.length}`}
          icon={BookOpen}
          bg="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200"
          text="text-purple-700"
        />
      </div>

      <div className="card overflow-hidden shadow-xl border-0">
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-5 flex items-center gap-3">
          <Calendar className="w-6 h-6 text-white flex-shrink-0" />
          <div className="flex-1">
            <h2 className="text-lg font-bold text-white">Próximas mesas de examen</h2>
            <p className="text-sm text-indigo-100">{upcomingExams.length} mesa{upcomingExams.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="p-6">
          {upcomingExams.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-600 font-semibold text-base">No hay mesas programadas</p>
              <p className="text-sm text-slate-500 mt-2">Las mesas se mostrarán aquí cuando se publiquen</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingExams.map((exam, idx) => (
                <ExamCard key={exam.id} exam={exam} idx={idx} />
              ))}
            </div>
          )}
          <Link 
            to="/dashboard/exams" 
            className="mt-6 inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-bold text-sm transition-colors hover:gap-3"
          >
            Ver todas las mesas <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="card overflow-hidden shadow-xl border-0">
        <div className="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 px-6 py-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-white flex-shrink-0" />
            <div>
              <h2 className="text-lg font-bold text-white">Calificaciones recientes</h2>
              <p className="text-sm text-slate-300">{rows.length} materia{rows.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => generateRegularCertificate(student, student.program)}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-md hover:shadow-lg active:scale-95"
            >
              Certificado
            </button>
            <Link to="/dashboard/certificates" className="text-xs font-bold text-white/80 hover:text-white transition-colors px-2 py-2">
              Más →
            </Link>
          </div>
        </div>
        <div className="p-6 overflow-x-auto">
          {rows.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-600 font-semibold text-base">No hay calificaciones registradas</p>
              <p className="text-sm text-slate-500 mt-2">Tus notas aparecerán aquí cuando los docentes las carguen</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-slate-300 bg-slate-50">
                    <th className="px-6 py-3 text-left font-bold text-slate-700 uppercase tracking-wider text-xs">Materia</th>
                    <th className="px-6 py-3 text-center font-bold text-slate-700 uppercase tracking-wider text-xs">Parcial</th>
                    <th className="hidden sm:table-cell px-6 py-3 text-center font-bold text-slate-700 uppercase tracking-wider text-xs">Final</th>
                    <th className="px-6 py-3 text-center font-bold text-slate-700 uppercase tracking-wider text-xs">Nota</th>
                    <th className="px-6 py-3 text-center font-bold text-slate-700 uppercase tracking-wider text-xs">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s, i) => (
                    <GradeRow key={i} s={s} index={i} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <ReinscriptionModal isOpen={showReinscriptionModal} onClose={() => setShowReinscriptionModal(false)} />
    </div>
  )
}
