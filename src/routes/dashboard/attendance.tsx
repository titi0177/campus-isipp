import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { CheckCircle2, XCircle, BarChart3, AlertCircle, TrendingUp, Clock } from 'lucide-react'

export const Route = createFileRoute('/dashboard/attendance')({
  component: StudentAttendancePage,
})

type SubjectAttendance = {
  enrollmentId: string
  subjectId: string
  subjectName: string
  subjectCode: string
  year: number
  professorName: string
  percentage: number
}

function StudentAttendancePage() {
  const [subjects, setSubjects] = useState<SubjectAttendance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void loadAttendance()
  }, [])

  async function loadAttendance() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!student) {
        setLoading(false)
        return
      }

      const { data: enrollments } = await supabase
        .from('enrollments')
        .select(`
          id,
          subject_id,
          subject:subjects(id, name, code, year, professor_id),
          attendance(id, enrollment_id, percentage)
        `)
        .eq('student_id', student.id)
        .order('subject_id')

      if (!enrollments || enrollments.length === 0) {
        setSubjects([])
        setLoading(false)
        return
      }

      const profIds = [...new Set(
        enrollments
          .map((e: any) => e.subject?.professor_id)
          .filter(Boolean)
      )]

      let professors: Record<string, any> = {}
      if (profIds.length > 0) {
        const { data: profsData } = await supabase
          .from('professors')
          .select('id, name')
          .in('id', profIds)
        profsData?.forEach((p: any) => { professors[p.id] = p })
      }

      const subjectList = enrollments.map((enr: any) => {
        const att = Array.isArray(enr.attendance) ? enr.attendance[0] : enr.attendance
        const percentage = att?.percentage ?? 0
        const prof = enr.subject?.professor_id ? professors[enr.subject.professor_id] : null

        return {
          enrollmentId: enr.id,
          subjectId: enr.subject_id,
          subjectName: enr.subject?.name ?? 'Sin nombre',
          subjectCode: enr.subject?.code ?? 'N/A',
          year: enr.subject?.year ?? 1,
          professorName: prof?.name || 'Sin asignar',
          percentage,
        }
      })

      setSubjects(subjectList)
      setLoading(false)
    } catch (err) {
      console.error('Error loading attendance:', err)
      setLoading(false)
    }
  }

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 80) return {
      bg: 'from-emerald-50 to-teal-50',
      border: 'border-emerald-600',
      text: 'text-emerald-700',
      icon: 'text-emerald-600',
      badge: 'bg-emerald-100 text-emerald-700',
      status: 'Excelente',
      canExam: true
    }
    if (percentage >= 60) return {
      bg: 'from-green-50 to-emerald-50',
      border: 'border-green-600',
      text: 'text-green-700',
      icon: 'text-green-600',
      badge: 'bg-green-100 text-green-700',
      status: 'Habilitado',
      canExam: true
    }
    if (percentage >= 50) return {
      bg: 'from-amber-50 to-yellow-50',
      border: 'border-amber-600',
      text: 'text-amber-700',
      icon: 'text-amber-600',
      badge: 'bg-amber-100 text-amber-700',
      status: 'En riesgo',
      canExam: false
    }
    return {
      bg: 'from-red-50 to-rose-50',
      border: 'border-red-600',
      text: 'text-red-700',
      icon: 'text-red-600',
      badge: 'bg-red-100 text-red-700',
      status: 'No habilitado',
      canExam: false
    }
  }

  const stats = {
    total: subjects.length,
    canTakeExam: subjects.filter(s => s.percentage >= 60).length,
    average: subjects.length > 0 ? Math.round(subjects.reduce((a, b) => a + b.percentage, 0) / subjects.length) : 0
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl p-8 text-white shadow-2xl animate-pulse">
          <h1 className="text-4xl font-black mb-2 h-12 bg-white/20 rounded w-1/2"></h1>
          <p className="text-emerald-100 h-6 bg-white/10 rounded w-2/3"></p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header Hero */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl p-8 text-white shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-emerald-100 text-sm font-semibold mb-2">Seguimiento Académico</p>
            <h1 className="text-5xl font-black mb-3">Mi Asistencia</h1>
            <p className="text-emerald-100 text-lg max-w-2xl">Porcentaje acumulativo (Abril - Diciembre). Necesitas 60% mínimo para rendir examen final</p>
          </div>
          <TrendingUp size={80} className="opacity-20" />
        </div>
      </div>

      {/* Stats Cards */}
      {subjects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-6 border-l-4 border-l-indigo-600 bg-gradient-to-br from-indigo-50 to-blue-50">
            <p className="text-xs text-indigo-600 font-bold mb-3 uppercase tracking-wide">TOTAL MATERIAS</p>
            <p className="text-4xl font-black text-indigo-700">{stats.total}</p>
            <p className="text-sm text-indigo-600 mt-2">Con seguimiento de asistencia</p>
          </div>

          <div className="card p-6 border-l-4 border-l-green-600 bg-gradient-to-br from-green-50 to-emerald-50">
            <p className="text-xs text-green-600 font-bold mb-3 uppercase tracking-wide">HABILITADAS EXAMEN</p>
            <p className="text-4xl font-black text-green-700">{stats.canTakeExam}</p>
            <p className="text-sm text-green-600 mt-2">Con 60%+ de asistencia</p>
          </div>

          <div className="card p-6 border-l-4 border-l-purple-600 bg-gradient-to-br from-purple-50 to-pink-50">
            <p className="text-xs text-purple-600 font-bold mb-3 uppercase tracking-wide">PROMEDIO ASISTENCIA</p>
            <p className="text-4xl font-black text-purple-700">{stats.average}%</p>
            <p className="text-sm text-purple-600 mt-2">Promedio general</p>
          </div>
        </div>
      )}

      {subjects.length === 0 ? (
        <div className="card p-16 text-center rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200">
          <BarChart3 size={64} className="mx-auto text-gray-400 mb-6" />
          <p className="text-gray-600 text-xl font-semibold">No tienes materias inscriptas</p>
          <p className="text-gray-500 mt-2">Inscríbete en materias para ver tu asistencia</p>
        </div>
      ) : (
        <div className="space-y-4">
          {subjects
            .sort((a, b) => b.percentage - a.percentage)
            .map((subject) => {
              const colors = getAttendanceColor(subject.percentage)
              const canTakeExam = subject.percentage >= 60
              const needed = Math.max(0, 60 - subject.percentage)

              return (
                <div
                  key={subject.enrollmentId}
                  className={`card p-6 border-2 ${colors.border} bg-gradient-to-br ${colors.bg} hover:shadow-lg transition-all`}
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-black text-gray-900 text-lg">{subject.subjectCode}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${colors.badge}`}>
                          {colors.status}
                        </span>
                      </div>
                      <p className="text-gray-700 font-semibold">{subject.subjectName}</p>
                      <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                        <Clock size={16} />
                        <span>Profesor: <strong>{subject.professorName}</strong></span>
                      </div>
                    </div>

                    <div className={`text-center p-6 rounded-2xl flex flex-col items-center justify-center ${colors.bg} border-2 ${colors.border}`}>
                      <div className={`text-5xl font-black ${colors.text}`}>
                        {subject.percentage}%
                      </div>
                      <p className={`text-sm font-bold ${colors.text} mt-1`}>
                        {canTakeExam ? '✓ Habilitado' : '✗ No habilitado'}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4 pt-4 border-t-2 border-gray-200">
                    <div className="w-full bg-gray-300 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${
                          subject.percentage >= 80 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                          subject.percentage >= 60 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                          subject.percentage >= 50 ? 'bg-gradient-to-r from-amber-500 to-yellow-500' :
                          'bg-gradient-to-r from-red-500 to-rose-500'
                        }`}
                        style={{ width: `${Math.min(subject.percentage, 100)}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center mt-3 text-sm">
                      <div>
                        {canTakeExam ? (
                          <p className={`flex items-center gap-1 font-bold ${colors.text}`}>
                            <CheckCircle2 size={18} />
                            ✓ Cumples requisito mínimo
                          </p>
                        ) : (
                          <div>
                            <p className={`flex items-center gap-1 font-bold ${colors.text}`}>
                              <XCircle size={18} />
                              ✗ No cumples requisito
                            </p>
                            <p className={`text-xs ${colors.text} mt-1 ml-6`}>
                              Te faltan <strong>{needed}%</strong> de asistencia
                            </p>
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-gray-600 bg-white/60 px-3 py-1 rounded-full font-semibold">
                        Año {subject.year}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
        </div>
      )}

      {/* Info & Requirements */}
      {subjects.length > 0 && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Requisitos */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 border-2 border-blue-200">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle size={24} className="text-blue-600 flex-shrink-0 mt-1" />
              <h3 className="text-2xl font-black text-gray-900">Requisitos para Examen Final</h3>
            </div>

            <div className="space-y-3">
              <div className="flex gap-3 p-3 bg-white/70 rounded-lg">
                <div className="text-2xl flex-shrink-0">60%</div>
                <div>
                  <p className="font-bold text-gray-900">Asistencia Mínima</p>
                  <p className="text-sm text-gray-600">Necesitas al menos 60% de asistencia acumulada</p>
                </div>
              </div>

              <div className="flex gap-3 p-3 bg-white/70 rounded-lg">
                <div className="text-2xl flex-shrink-0">6.0</div>
                <div>
                  <p className="font-bold text-gray-900">Nota Parcial</p>
                  <p className="text-sm text-gray-600">Debes tener aprobado el parcial (≥6 puntos)</p>
                </div>
              </div>

              <div className="flex gap-3 p-3 bg-white/70 rounded-lg">
                <div className="text-2xl flex-shrink-0">✓</div>
                <div>
                  <p className="font-bold text-gray-900">Correlativas</p>
                  <p className="text-sm text-gray-600">Todas las materias previas deben estar aprobadas</p>
                </div>
              </div>

              <div className="flex gap-3 p-3 bg-white/70 rounded-lg">
                <div className="text-2xl flex-shrink-0">💳</div>
                <div>
                  <p className="font-bold text-gray-900">Sin Deuda</p>
                  <p className="text-sm text-gray-600">No puedes tener deudas vencidas</p>
                </div>
              </div>
            </div>

            <p className="text-xs text-blue-700 italic mt-4 p-3 bg-blue-100/50 rounded-lg">
              ⚠️ Si no cumples TODOS estos requisitos, no podrás inscribirte a examen final
            </p>
          </div>

          {/* Tips */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-8 border-2 border-amber-200">
            <div className="flex items-start gap-3 mb-4">
              <TrendingUp size={24} className="text-amber-600 flex-shrink-0 mt-1" />
              <h3 className="text-2xl font-black text-gray-900">Consejos Importantes</h3>
            </div>

            <div className="space-y-3">
              <div className="flex gap-3 p-3 bg-white/70 rounded-lg">
                <span className="text-xl font-bold text-amber-600">📌</span>
                <div>
                  <p className="font-bold text-gray-900 text-sm">Planifica bien tu asistencia</p>
                  <p className="text-xs text-gray-600">Cada falta afecta tu porcentaje acumulado</p>
                </div>
              </div>

              <div className="flex gap-3 p-3 bg-white/70 rounded-lg">
                <span className="text-xl font-bold text-amber-600">⏰</span>
                <div>
                  <p className="font-bold text-gray-900 text-sm">Avisa con anticipación</p>
                  <p className="text-xs text-gray-600">Si necesitas faltar, comunícate con el profesor</p>
                </div>
              </div>

              <div className="flex gap-3 p-3 bg-white/70 rounded-lg">
                <span className="text-xl font-bold text-amber-600">🎯</span>
                <div>
                  <p className="font-bold text-gray-900 text-sm">Supera el mínimo</p>
                  <p className="text-xs text-gray-600">Intenta llegar al 80%+ para tener holgura</p>
                </div>
              </div>

              <div className="flex gap-3 p-3 bg-white/70 rounded-lg">
                <span className="text-xl font-bold text-amber-600">✓</span>
                <div>
                  <p className="font-bold text-gray-900 text-sm">Revisa regularmente</p>
                  <p className="text-xs text-gray-600">Comprueba tu asistencia cada semana</p>
                </div>
              </div>
            </div>

            <p className="text-xs text-amber-700 italic mt-4 p-3 bg-amber-100/50 rounded-lg">
              💡 La constancia es clave. Una buena asistencia facilita tus aprobaciones
            </p>
          </div>
        </div>
      )}
    </div>
  )
}