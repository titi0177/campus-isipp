import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { Filter, ChevronDown, ChevronUp } from 'lucide-react'

export const Route = createFileRoute('/admin/compliance-report')({
  component: ComplianceReportPage,
})

type ComplianceIssue = {
  id: string
  student_id: string
  student_name: string
  program_id: string
  program_name: string
  year: number
  subject_id: string
  subject_name: string
  issue_type: 'asistencia' | 'regularidad' | 'correlativa'
  details: string
}

type StudentSummary = {
  id: string
  name: string
  year: number
  program_name: string
  program_id: string
  subjects: {
    id: string
    name: string
    status: string
    attendance: number | null
    partial_grade: number | null
    issues: string[]
  }[]
}

function ComplianceReportPage() {
  const [issues, setIssues] = useState<ComplianceIssue[]>([])
  const [studentSummaries, setStudentSummaries] = useState<StudentSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [programs, setPrograms] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [selectedProgram, setSelectedProgram] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedIssueType, setSelectedIssueType] = useState('')
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'summary' | 'details'>('summary')

  const { showToast } = useToast()

  useEffect(() => {
    loadFilters()
  }, [])

  async function loadFilters() {
    try {
      const { data: programsData } = await supabase
        .from('programs')
        .select('id, name')
        .order('name')

      const { data: subjectsData } = await supabase
        .from('subjects')
        .select('id, name, program_id')
        .order('name')

      setPrograms(programsData || [])
      setSubjects(subjectsData || [])
    } catch (err) {
      console.error('Error loading filters:', err)
      showToast('Error al cargar filtros', 'error')
    }
  }

  async function loadReport() {
    setLoading(true)
    try {
      const issues: ComplianceIssue[] = []
      const studentSummariesMap = new Map<string, StudentSummary>()

      // Query 1: Traer estudiantes con todos sus datos en un JOIN
      let query = supabase
        .from('students')
        .select(`
          id,
          first_name,
          last_name,
          program_id,
          year,
          program:programs(name),
          enrollments(
            id,
            subject_id,
            subject:subjects(id, name, program_id, year),
            attendance(percentage),
            enrollment_grades(partial_grade, partial_status, final_status)
          )
        `)

      if (selectedProgram) {
        query = query.eq('program_id', selectedProgram)
      }
      if (selectedYear) {
        query = query.eq('year', parseInt(selectedYear))
      }

      const { data: students, error: studentsError } = await query

      if (studentsError) {
        showToast('Error al cargar alumnos', 'error')
        setLoading(false)
        return
      }

      if (!students || students.length === 0) {
        showToast('No hay alumnos con los filtros seleccionados', 'info')
        setLoading(false)
        return
      }

      // Query 2: Traer TODAS las correlativas de una sola vez
      const { data: allCorrelatives, error: corrError } = await supabase
        .from('subject_correlatives')
        .select('subject_id, requires_subject_id, required_status')

      if (corrError) {
        showToast('Error al cargar correlativas', 'error')
        setLoading(false)
        return
      }

      // Crear mapa de correlativas para búsqueda rápida O(1)
      const correlativesMap = new Map<string, any[]>()
      allCorrelatives?.forEach(corr => {
        const key = corr.subject_id
        if (!correlativesMap.has(key)) {
          correlativesMap.set(key, [])
        }
        correlativesMap.get(key)!.push(corr)
      })

      // Query 3: Traer TODOS los enrollments de ALL estudiantes (para validar correlativas)
      const studentIds = students.map(s => s.id)
      const { data: allEnrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select('student_id, subject_id, enrollment_grades(final_status)')
        .in('student_id', studentIds)

      if (enrollError) {
        showToast('Error al cargar enrollments', 'error')
        setLoading(false)
        return
      }

      // Crear índice: student_id -> { subject_id -> final_status }
      const studentEnrollmentsMap = new Map<string, Map<string, string | null>>()
      allEnrollments?.forEach(enr => {
        if (!studentEnrollmentsMap.has(enr.student_id)) {
          studentEnrollmentsMap.set(enr.student_id, new Map())
        }
        const finalStatus = Array.isArray(enr.enrollment_grades)
          ? enr.enrollment_grades[0]?.final_status
          : enr.enrollment_grades?.final_status
        studentEnrollmentsMap.get(enr.student_id)!.set(enr.subject_id, finalStatus || null)
      })

      // Procesar todo en memoria
      students.forEach(student => {
        const enrollments = student.enrollments || []
        const studentKey = student.id
        
        // Inicializar resumen del estudiante
        if (!studentSummariesMap.has(studentKey)) {
          studentSummariesMap.set(studentKey, {
            id: student.id,
            name: `${student.last_name}, ${student.first_name}`,
            year: student.year,
            program_name: (student.program as any)?.name || '',
            program_id: student.program_id,
            subjects: []
          })
        }

        const summary = studentSummariesMap.get(studentKey)!

        enrollments.forEach((enrollment: any) => {
          const subject = enrollment.subject
          const gradeRecord = Array.isArray(enrollment.enrollment_grades)
            ? enrollment.enrollment_grades[0]
            : enrollment.enrollment_grades
          const finalStatus = gradeRecord?.final_status
          const partialStatus = gradeRecord?.partial_status

          // ✅ FILTRO: Saltar si está aprobado
          if (finalStatus && ['aprobado', 'promocionado'].includes(finalStatus)) {
            return
          }
          
          // ✅ FILTRO: Saltar en_curso SOLO si es del año actual del alumno
          // Mostrar en_curso de años anteriores (para ver qué debe regularizar)
          // Verifica: si no tiene final_status Y no tiene partial_status Y es del año actual = inscripto sin notas
          if (!finalStatus && !partialStatus && subject.year === student.year) {
            return
          }

          const attendance = Array.isArray(enrollment.attendance)
            ? enrollment.attendance[0]?.percentage
            : enrollment.attendance?.percentage
          const partialGrade = gradeRecord?.partial_grade

          // Aplicar filtro de materia
          if (selectedSubject && subject.id !== selectedSubject) return

          // Recolectar incumplimientos para esta inscripción
          const issuesList: string[] = []

          // ASISTENCIA
          if (!attendance || attendance < 60) {
            issuesList.push(`Asistencia: ${attendance ?? 0}%`)
          }

          // REGULARIDAD
          if (!partialGrade || partialGrade < 6) {
            issuesList.push(`Nota Parcial: ${partialGrade ? Math.round(partialGrade * 100) / 100 : '—'}`)
          }

          // CORRELATIVAS
          const correlatives = correlativesMap.get(subject.id) || []
          correlatives.forEach(corr => {
            const requiredStatus = corr.required_status || 'aprobado'
            const studentSubjectEnrollments = studentEnrollmentsMap.get(student.id)
            const corrFinalStatus = studentSubjectEnrollments?.get(corr.requires_subject_id) || null
            const corrSubject = subjects.find(s => s.id === corr.requires_subject_id)

            if (requiredStatus === 'aprobado') {
              if (!corrFinalStatus || !['aprobado', 'promocionado'].includes(corrFinalStatus)) {
                issuesList.push(`Correlativa: ${corrSubject?.name || 'N/A'} no aprobada`)
              }
            } else if (requiredStatus === 'regular') {
              if (!corrFinalStatus || !['aprobado', 'promocionado', 'regular'].includes(corrFinalStatus)) {
                issuesList.push(`Correlativa: ${corrSubject?.name || 'N/A'} no regularizada`)
              }
            }
          })

          // Solo agregar si hay incumplimientos O si está regularizado/desaprobado de años anteriores
          if (issuesList.length > 0) {
            summary.subjects.push({
              id: subject.id,
              name: subject.name,
              status: partialStatus || finalStatus || 'en_curso',
              attendance: attendance,
              partial_grade: partialGrade,
              issues: issuesList
            })

            // También agregar a tabla de detalles (para vista detallada)
            if (!selectedIssueType || selectedIssueType === 'asistencia' || selectedIssueType === 'regularidad' || selectedIssueType === 'correlativa') {
              issuesList.forEach(issueDetail => {
                let issueType: 'asistencia' | 'regularidad' | 'correlativa' = 'regularidad'
                if (issueDetail.includes('Asistencia')) issueType = 'asistencia'
                if (issueDetail.includes('Correlativa')) issueType = 'correlativa'

                if (!selectedIssueType || selectedIssueType === issueType) {
                  issues.push({
                    id: `${student.id}-${subject.id}-${issueType}`,
                    student_id: student.id,
                    student_name: `${student.last_name}, ${student.first_name}`,
                    program_id: student.program_id,
                    program_name: (student.program as any)?.name || '',
                    year: student.year,
                    subject_id: subject.id,
                    subject_name: subject.name,
                    issue_type: issueType,
                    details: issueDetail,
                  })
                }
              })
            }
          }
        })
      })

      // Filtrar solo alumnos que tienen al menos 1 materia adeudada
      const filteredSummaries = Array.from(studentSummariesMap.values()).filter(s => s.subjects.length > 0)

      setIssues(issues)
      setStudentSummaries(filteredSummaries)
      showToast(`${filteredSummaries.length} alumnos con incumplimientos`, 'info')
    } catch (err) {
      console.error('Error loading report:', err)
      showToast('Error al generar reporte', 'error')
    } finally {
      setLoading(false)
    }
  }

  const filteredSubjects = selectedProgram
    ? subjects.filter(s => s.program_id === selectedProgram)
    : subjects

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'regular':
        return 'bg-blue-100 text-blue-700 border-blue-300'
      case 'desaprobado':
        return 'bg-red-100 text-red-700 border-red-300'
      case 'en_curso':
        return 'bg-purple-100 text-purple-700 border-purple-300'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'regular':
        return 'Regular'
      case 'desaprobado':
        return 'Desaprobado'
      case 'en_curso':
        return 'En Curso'
      default:
        return status
    }
  }

  const getIssueColor = (type: string) => {
    switch (type) {
      case 'asistencia':
        return 'bg-red-100 text-red-700 border-red-300'
      case 'regularidad':
        return 'bg-orange-100 text-orange-700 border-orange-300'
      case 'correlativa':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  const getIssueLabel = (type: string) => {
    switch (type) {
      case 'asistencia':
        return 'Asistencia'
      case 'regularidad':
        return 'Regularidad'
      case 'correlativa':
        return 'Correlativa'
      default:
        return type
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-slate-900">Reporte de Incumplimientos</h1>
        <p className="text-slate-600 mt-2">Alumnos adeudados: materias sin aprobar con regularidades faltantes, asistencia baja o correlativas pendientes</p>
      </div>

      <div className="card p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-blue-600" />
          <h2 className="font-bold text-lg text-blue-900">Filtros</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Carrera</label>
            <select
              value={selectedProgram}
              onChange={(e) => {
                setSelectedProgram(e.target.value)
                setSelectedSubject('')
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas</option>
              {programs.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Año</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              <option value="1">1ro</option>
              <option value="2">2do</option>
              <option value="3">3ro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Materia</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              disabled={!selectedProgram && filteredSubjects.length === 0}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value="">Todas</option>
              {filteredSubjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo Incumplimiento</label>
            <select
              value={selectedIssueType}
              onChange={(e) => setSelectedIssueType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              <option value="asistencia">Asistencia</option>
              <option value="regularidad">Regularidad</option>
              <option value="correlativa">Correlativa</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={loadReport}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg text-white font-bold py-2 rounded-lg transition-all disabled:opacity-50"
            >
              {loading ? 'Generando...' : 'Generar Reporte'}
            </button>
          </div>
        </div>
      </div>

      {/* Vista Resumen */}
      {studentSummaries.length > 0 && (
        <div className="card p-4">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setViewMode('summary')}
              className={`px-4 py-2 rounded font-semibold transition ${
                viewMode === 'summary'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Resumen por Alumno
            </button>
            <button
              onClick={() => setViewMode('details')}
              className={`px-4 py-2 rounded font-semibold transition ${
                viewMode === 'details'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Tabla Detallada
            </button>
          </div>

          {viewMode === 'summary' && (
            <div className="space-y-3">
              {studentSummaries.map(student => (
                <div key={student.id} className="border border-gray-300 rounded-lg overflow-hidden bg-white">
                  <button
                    onClick={() => setExpandedStudent(expandedStudent === student.id ? null : student.id)}
                    className="w-full px-4 py-3 bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200 flex items-center justify-between font-semibold text-gray-900 transition"
                  >
                    <div className="flex items-center gap-3 flex-1 text-left">
                      {expandedStudent === student.id ? (
                        <ChevronUp size={20} className="text-blue-600" />
                      ) : (
                        <ChevronDown size={20} className="text-gray-600" />
                      )}
                      <div>
                        <span>{student.name}</span>
                        <span className="text-sm text-gray-600 ml-4">
                          {student.year}° año • {student.program_name} • {student.subjects.length} materia(s) adeudada(s)
                        </span>
                      </div>
                    </div>
                  </button>

                  {expandedStudent === student.id && (
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 space-y-3">
                      {student.subjects.map(subject => (
                        <div key={subject.id} className="bg-white p-3 rounded border border-gray-200">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <p className="font-semibold text-gray-900">{subject.name}</p>
                              <span className={`inline-block mt-1 px-2 py-1 rounded text-xs font-bold border ${getStatusColor(subject.status)}`}>
                                {getStatusLabel(subject.status)}
                              </span>
                            </div>
                          </div>
                          <div className="text-sm text-gray-700 space-y-1 mb-2">
                            {subject.attendance !== null && (
                              <p>Asistencia: <span className={subject.attendance < 60 ? 'text-red-600 font-bold' : 'text-green-600'}>{subject.attendance}%</span></p>
                            )}
                            {subject.partial_grade !== null && (
                              <p>Nota Parcial: <span className={subject.partial_grade < 6 ? 'text-red-600 font-bold' : 'text-green-600'}>{Math.round(subject.partial_grade * 100) / 100}</span></p>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {subject.issues.map((issue, idx) => (
                              <span
                                key={idx}
                                className="inline-flex px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-700 border border-red-300"
                              >
                                ⚠ {issue}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {viewMode === 'details' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-700 to-slate-900 text-white">
                    <th className="px-4 py-3 text-left font-bold">Alumno</th>
                    <th className="px-4 py-3 text-left font-bold">Carrera</th>
                    <th className="px-4 py-3 text-center font-bold">Año</th>
                    <th className="px-4 py-3 text-left font-bold">Materia</th>
                    <th className="px-4 py-3 text-left font-bold">Tipo</th>
                    <th className="px-4 py-3 text-left font-bold">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {issues.map((issue, idx) => (
                    <tr key={issue.id} className={idx % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100'}>
                      <td className="px-4 py-3 font-medium text-gray-900">{issue.student_name}</td>
                      <td className="px-4 py-3 text-gray-700">{issue.program_name}</td>
                      <td className="px-4 py-3 text-center text-gray-700 font-semibold">{issue.year}°</td>
                      <td className="px-4 py-3 text-gray-700">{issue.subject_name}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${getIssueColor(issue.issue_type)}`}>
                          {getIssueLabel(issue.issue_type)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 text-xs">{issue.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="p-4 bg-slate-50 border-t border-gray-200 mt-4">
            <p className="text-sm font-semibold text-slate-700">
              {viewMode === 'summary' ? (
                <>Alumnos adeudados: <span className="text-indigo-600">{studentSummaries.length}</span></>
              ) : (
                <>Total de incumplimientos: <span className="text-indigo-600">{issues.length}</span></>
              )}
            </p>
          </div>
        </div>
      )}

      {studentSummaries.length === 0 && !loading && (
        <div className="card p-8 text-center bg-green-50 border-2 border-green-200">
          <p className="text-green-800 font-semibold">No se encontraron alumnos adeudados. ¡Todos al día!</p>
        </div>
      )}
    </div>
  )
}
