import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { AlertCircle, Filter } from 'lucide-react'

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

function ComplianceReportPage() {
  const [issues, setIssues] = useState<ComplianceIssue[]>([])
  const [loading, setLoading] = useState(false)
  const [programs, setPrograms] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])

  // Filtros
  const [selectedProgram, setSelectedProgram] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedIssueType, setSelectedIssueType] = useState('')

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

      // Obtener todos los alumnos
      let query = supabase
        .from('students')
        .select('id, first_name, last_name, program_id, year, program:programs(name)')

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

      // Para cada alumno, verificar incumplimientos
      for (const student of students) {
        // Obtener inscripciones del alumno
        const { data: enrollments, error: enrollmentsError } = await supabase
          .from('enrollments')
          .select('id, subject_id, subject:subjects(id, name, program_id, year), attendance(percentage), enrollment_grades(partial_grade, partial_status)')
          .eq('student_id', student.id)

        if (enrollmentsError) continue

        if (!enrollments) continue

        for (const enrollment of enrollments) {
          const subject = enrollment.subject as any
          const attendance = Array.isArray(enrollment.attendance)
            ? enrollment.attendance[0]?.percentage
            : enrollment.attendance?.percentage
          const gradeRecord = Array.isArray(enrollment.enrollment_grades)
            ? enrollment.enrollment_grades[0]
            : enrollment.enrollment_grades
          const partialGrade = gradeRecord?.partial_grade
          const partialStatus = gradeRecord?.partial_status

          // Filtrar por materia si está seleccionada
          if (selectedSubject && subject.id !== selectedSubject) continue

          // 1. Verificar asistencia
          if (!selectedIssueType || selectedIssueType === 'asistencia') {
            if (!attendance || attendance < 60) {
              issues.push({
                id: `${student.id}-${subject.id}-asistencia`,
                student_id: student.id,
                student_name: `${student.last_name}, ${student.first_name}`,
                program_id: student.program_id,
                program_name: (student.program as any)?.name || '',
                year: student.year,
                subject_id: subject.id,
                subject_name: subject.name,
                issue_type: 'asistencia',
                details: `Asistencia: ${attendance ?? 0}% (mínimo: 60%)`,
              })
            }
          }

          // 2. Verificar regularidad (parcial)
          if (!selectedIssueType || selectedIssueType === 'regularidad') {
            if (!partialGrade || partialGrade < 6) {
              issues.push({
                id: `${student.id}-${subject.id}-regularidad`,
                student_id: student.id,
                student_name: `${student.last_name}, ${student.first_name}`,
                program_id: student.program_id,
                program_name: (student.program as any)?.name || '',
                year: student.year,
                subject_id: subject.id,
                subject_name: subject.name,
                issue_type: 'regularidad',
                details: `Nota Parcial: ${partialGrade ? Math.round(partialGrade * 100) / 100 : '—'} (mínimo: 6)`,
              })
            }
          }

          // 3. Verificar correlativas
          if (!selectedIssueType || selectedIssueType === 'correlativa') {
            const { data: correlatives } = await supabase
              .from('subject_correlatives')
              .select('requires_subject_id, required_status, requires_subject:requires_subject_id(name)')
              .eq('subject_id', subject.id)

            if (correlatives && correlatives.length > 0) {
              for (const corr of correlatives) {
                const requiredStatus = corr.required_status || 'aprobado'

                const { data: corrEnrollment } = await supabase
                  .from('enrollments')
                  .select('enrollment_grades(final_status)')
                  .eq('student_id', student.id)
                  .eq('subject_id', corr.requires_subject_id)
                  .single()

                const finalStatus = Array.isArray(corrEnrollment?.enrollment_grades)
                  ? corrEnrollment?.enrollment_grades[0]?.final_status
                  : corrEnrollment?.enrollment_grades?.final_status

                if (requiredStatus === 'aprobado') {
                  if (!finalStatus || !['aprobado', 'promocionado'].includes(finalStatus)) {
                    const { data: corrSubject } = await supabase
                      .from('subjects')
                      .select('name')
                      .eq('id', corr.requires_subject_id)
                      .single()

                    issues.push({
                      id: `${student.id}-${subject.id}-corr-${corr.requires_subject_id}`,
                      student_id: student.id,
                      student_name: `${student.last_name}, ${student.first_name}`,
                      program_id: student.program_id,
                      program_name: (student.program as any)?.name || '',
                      year: student.year,
                      subject_id: subject.id,
                      subject_name: subject.name,
                      issue_type: 'correlativa',
                      details: `Requiere APROBADA: ${corrSubject?.name || 'N/A'} (Estado: ${finalStatus || 'Sin cursar'})`,
                    })
                  }
                } else if (requiredStatus === 'regular') {
                  if (!finalStatus || !['aprobado', 'promocionado', 'regular'].includes(finalStatus)) {
                    const { data: corrSubject } = await supabase
                      .from('subjects')
                      .select('name')
                      .eq('id', corr.requires_subject_id)
                      .single()

                    issues.push({
                      id: `${student.id}-${subject.id}-corr-${corr.requires_subject_id}`,
                      student_id: student.id,
                      student_name: `${student.last_name}, ${student.first_name}`,
                      program_id: student.program_id,
                      program_name: (student.program as any)?.name || '',
                      year: student.year,
                      subject_id: subject.id,
                      subject_name: subject.name,
                      issue_type: 'correlativa',
                      details: `Requiere REGULARIZADA: ${corrSubject?.name || 'N/A'} (Estado: ${finalStatus || 'Sin cursar'})`,
                    })
                  }
                }
              }
            }
          }
        }
      }

      setIssues(issues)
      showToast(`Se encontraron ${issues.length} incumplimientos`, 'info')
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
        <p className="text-slate-600 mt-2">Alumnos que no cumplen requisitos de asistencia, regularidad o correlativas</p>
      </div>

      {/* Filtros */}
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

      {/* Resultados */}
      {issues.length === 0 && !loading ? (
        <div className="card p-8 text-center bg-green-50 border-2 border-green-200">
          <p className="text-green-800 font-semibold">No se encontraron incumplimientos con los filtros seleccionados</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
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
                    <td className="px-4 py-3 text-center text-gray-700 font-semibold">{issue.year}ro</td>
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

          <div className="p-4 bg-slate-50 border-t border-gray-200">
            <p className="text-sm font-semibold text-slate-700">
              Total de incumplimientos: <span className="text-indigo-600">{issues.length}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
