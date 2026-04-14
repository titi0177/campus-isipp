import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { CheckCircle2, XCircle, BarChart3, AlertCircle } from 'lucide-react'

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
  const [debugInfo, setDebugInfo] = useState<string>('')

  useEffect(() => {
    void loadAttendance()
  }, [])

  async function loadAttendance() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setDebugInfo('No hay usuario autenticado')
        setLoading(false)
        return
      }

      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!student) {
        setDebugInfo('Estudiante no encontrado')
        setLoading(false)
        return
      }

      const { data: enrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select(`
          id,
          subject_id,
          subject:subjects(id, name, code, year, professor_id),
          attendance(id, enrollment_id, percentage)
        `)
        .eq('student_id', student.id)
        .order('subject_id')

      if (enrollError) {
        setDebugInfo(`Error al obtener inscripciones: ${enrollError.message}`)
        setLoading(false)
        return
      }

      if (!enrollments || enrollments.length === 0) {
        setDebugInfo('No hay inscripciones')
        setSubjects([])
        setLoading(false)
        return
      }

      setDebugInfo(`Inscripciones encontradas: ${enrollments.length}`)

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
      setDebugInfo(`Cargadas ${subjectList.length} materias`)
      setLoading(false)
    } catch (err) {
      console.error('Error loading attendance:', err)
      setDebugInfo(`Error: ${String(err)}`)
      setLoading(false)
    }
  }

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 60) return { 
      bg: 'bg-green-50', 
      border: 'border-green-200', 
      text: 'text-green-700', 
      icon: 'text-green-600',
      status: 'Habilitado para examen'
    }
    return { 
      bg: 'bg-red-50', 
      border: 'border-red-200', 
      text: 'text-red-700', 
      icon: 'text-red-600',
      status: 'No habilitado'
    }
  }

  if (loading) {
    return <p className="text-slate-600">Cargando asistencia...</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 size={28} />
          Mi Asistencia
        </h1>
        <p className="text-slate-600 text-sm mt-1">Porcentaje acumulativo de asistencia (Abril - Diciembre) - Requisito para examen final</p>
      </div>

      {debugInfo && (
        <div className="card p-3 bg-blue-50 border border-blue-200">
          <p className="text-sm text-blue-800">{debugInfo}</p>
        </div>
      )}

      {subjects.length === 0 ? (
        <div className="card p-6 text-center">
          <p className="text-slate-500">No estás inscripto en ninguna materia.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {subjects.map((subject) => {
            const colors = getAttendanceColor(subject.percentage)
            const canTakeExam = subject.percentage >= 60

            return (
              <div
                key={subject.enrollmentId}
                className={`card p-4 border-l-4 ${colors.border}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {subject.subjectCode} - {subject.subjectName}
                    </h3>
                    <p className="text-sm text-slate-600 mt-1">
                      Profesor: {subject.professorName}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">
                      {subject.year}° Año
                    </p>
                  </div>

                  <div className={`text-right p-4 rounded flex flex-col items-center ${colors.bg}`}>
                    <div className="text-3xl font-bold">
                      <span className={colors.text}>{subject.percentage}%</span>
                    </div>
                    <p className={`text-sm font-semibold ${colors.text}`}>
                      {colors.status}
                    </p>
                    <div className="mt-2">
                      {canTakeExam ? (
                        <CheckCircle2 size={24} className={colors.icon} />
                      ) : (
                        <XCircle size={24} className={colors.icon} />
                      )}
                    </div>
                  </div>
                </div>

                {/* Estado de elegibilidad */}
                <div className="mt-4 pt-4 border-t">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        subject.percentage >= 60
                          ? 'bg-green-600'
                          : 'bg-red-600'
                      }`}
                      style={{ width: `${Math.min(subject.percentage, 100)}%` }}
                    />
                  </div>

                  {canTakeExam ? (
                    <p className="text-xs text-green-700 mt-2 flex items-center gap-1">
                      <CheckCircle2 size={14} />
                      ✓ Cumples el requisito mínimo - Puedes inscribirte a examen final
                    </p>
                  ) : (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                      <p className="flex items-center gap-1 font-semibold">
                        <AlertCircle size={14} />
                        No cumples el requisito mínimo
                      </p>
                      <p className="mt-1 ml-5">
                        Necesitas 60% de asistencia para inscribirte a examen final
                      </p>
                      <p className="mt-0.5 ml-5">
                        Te faltan {Math.ceil(60 - subject.percentage)}% de asistencia
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Criterios para examen final */}
      {subjects.length > 0 && (
        <div className="card p-4 bg-slate-50 border border-slate-200">
          <h4 className="font-semibold text-sm text-gray-900 mb-3 flex items-center gap-2">
            <AlertCircle size={16} />
            Requisitos para inscribirse a examen final
          </h4>
          <div className="space-y-2 text-sm text-slate-700">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-600 flex-shrink-0"></div>
              <span><strong>≥60% asistencia</strong> - Requisito MÍNIMO (Este porcentaje)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0"></div>
              <span><strong>≥6 nota parcial</strong> - Debes tener aprobado el parcial</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-600 flex-shrink-0"></div>
              <span><strong>Correlativas aprobadas</strong> - Debes tener aprobadas las materias previas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-600 flex-shrink-0"></div>
              <span><strong>Sin deuda vencida</strong> - No puedes tener deudas antes de la fecha del examen</span>
            </div>
          </div>
          <p className="text-xs text-slate-600 mt-3 italic">
            Si no cumples alguno de estos requisitos, no podrás inscribirte a examen final
          </p>
        </div>
      )}
    </div>
  )
}
