import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { Filter, AlertCircle } from 'lucide-react'

export const Route = createFileRoute('/admin/advanced-pending')({
  component: AdvancedPendingPage,
})

type AdvancedStudent = {
  id: string
  student_id: string
  student_name: string
  program_id: string
  program_name: string
  current_year: number
  subject_id: string
  subject_name: string
  subject_year: number
  attendance_percentage: number | null
  partial_grade: number | null
  issues: string[]
}

function AdvancedPendingPage() {
  const [students, setStudents] = useState<AdvancedStudent[]>([])
  const [loading, setLoading] = useState(false)
  const [programs, setPrograms] = useState<any[]>([])
  const [selectedProgram, setSelectedProgram] = useState('')
  const [selectedYear, setSelectedYear] = useState('')

  const { showToast } = useToast()

  useEffect(() => {
    loadPrograms()
  }, [])

  async function loadPrograms() {
    try {
      const { data } = await supabase
        .from('programs')
        .select('id, name')
        .order('name')
      setPrograms(data || [])
    } catch (err) {
      console.error('Error loading programs:', err)
      showToast('Error al cargar carreras', 'error')
    }
  }

  async function loadAdvancedPending() {
    setLoading(true)
    try {
      // Traer estudiantes avanzados (año > 1)
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
            subject:subjects(id, name, year),
            attendance(percentage),
            enrollment_grades(partial_grade, partial_status)
          )
        `)
        .gt('year', 1) // Solo año 2 y 3

      if (selectedProgram) {
        query = query.eq('program_id', selectedProgram)
      }
      if (selectedYear) {
        query = query.eq('year', parseInt(selectedYear))
      }

      const { data: studentsData, error } = await query

      if (error) {
        showToast('Error al cargar estudiantes', 'error')
        setLoading(false)
        return
      }

      if (!studentsData || studentsData.length === 0) {
        showToast('No hay estudiantes avanzados con los filtros seleccionados', 'info')
        setStudents([])
        setLoading(false)
        return
      }

      // Procesar: buscar materias de años anteriores con asistencia/regularidad pendiente
      const pendingList: AdvancedStudent[] = []

      studentsData.forEach((student: any) => {
        const enrollments = student.enrollments || []

        enrollments.forEach((enrollment: any) => {
          const subject = enrollment.subject
          const gradeRecord = Array.isArray(enrollment.enrollment_grades)
            ? enrollment.enrollment_grades[0]
            : enrollment.enrollment_grades
          const partialGrade = gradeRecord?.partial_grade
          const partialStatus = gradeRecord?.partial_status

          // Solo materias de años anteriores
          if (subject.year < student.year) {
            const attendance = Array.isArray(enrollment.attendance)
              ? enrollment.attendance[0]?.percentage
              : enrollment.attendance?.percentage

            const issues: string[] = []

            // Detectar asistencia faltante
            if (!attendance || attendance < 60) {
              issues.push(`Asistencia: ${attendance ?? 0}%`)
            }

            // Detectar regularidad faltante
            if (!partialGrade || partialGrade < 6) {
              issues.push(`Regularidad: ${partialGrade ? Math.round(partialGrade * 100) / 100 : 'Falta'}`)
            }

            // Solo agregar si hay algún incumplimiento
            if (issues.length > 0) {
              pendingList.push({
                id: `${student.id}-${subject.id}`,
                student_id: student.id,
                student_name: `${student.last_name}, ${student.first_name}`,
                program_id: student.program_id,
                program_name: student.program?.name || '',
                current_year: student.year,
                subject_id: subject.id,
                subject_name: subject.name,
                subject_year: subject.year,
                attendance_percentage: attendance,
                partial_grade: partialGrade,
                issues: issues,
              })
            }
          }
        })
      })

      setStudents(pendingList)
      showToast(`${pendingList.length} registros con asistencia/regularidad pendiente`, 'info')
    } catch (err) {
      console.error('Error loading advanced pending:', err)
      showToast('Error al generar reporte', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-slate-900">Alumnos Avanzados - Asistencia/Regularidad Pendiente</h1>
        <p className="text-slate-600 mt-2">Estudiantes de años superiores con deuda en asistencia o regularidad de materias de años anteriores</p>
      </div>

      <div className="card p-6 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-red-600" />
          <h2 className="font-bold text-lg text-red-900">Filtros</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Carrera</label>
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Todas</option>
              {programs.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Año Actual</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Todos</option>
              <option value="2">2do</option>
              <option value="3">3ro</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={loadAdvancedPending}
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:shadow-lg text-white font-bold py-2 rounded-lg transition-all disabled:opacity-50"
            >
              {loading ? 'Generando...' : 'Generar Reporte'}
            </button>
          </div>
        </div>
      </div>

      {students.length > 0 ? (
        <div className="card p-0 overflow-hidden rounded-2xl border-2 border-red-200">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-slate-700 to-slate-900 text-white">
                  <th className="px-4 py-3 text-left font-bold">Alumno</th>
                  <th className="px-4 py-3 text-left font-bold">Carrera</th>
                  <th className="px-4 py-3 text-center font-bold">Año Actual</th>
                  <th className="px-4 py-3 text-left font-bold">Materia Pendiente</th>
                  <th className="px-4 py-3 text-center font-bold">Año Materia</th>
                  <th className="px-4 py-3 text-center font-bold">Asistencia</th>
                  <th className="px-4 py-3 text-center font-bold">Regularidad</th>
                  <th className="px-4 py-3 text-left font-bold">Pendiente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {students.map((student, idx) => (
                  <tr key={student.id} className={idx % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100'}>
                    <td className="px-4 py-3 font-medium text-gray-900">{student.student_name}</td>
                    <td className="px-4 py-3 text-gray-700">{student.program_name}</td>
                    <td className="px-4 py-3 text-center font-semibold text-gray-900">{student.current_year}°</td>
                    <td className="px-4 py-3 text-gray-700">{student.subject_name}</td>
                    <td className="px-4 py-3 text-center text-gray-700 font-semibold">{student.subject_year}°</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-1 rounded text-xs font-bold border ${
                        student.attendance_percentage && student.attendance_percentage >= 60
                          ? 'bg-green-100 text-green-700 border-green-300'
                          : 'bg-red-100 text-red-700 border-red-300'
                      }`}>
                        {student.attendance_percentage ? `${Math.round(student.attendance_percentage)}%` : 'Falta'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-1 rounded text-xs font-bold border ${
                        student.partial_grade && student.partial_grade >= 6
                          ? 'bg-green-100 text-green-700 border-green-300'
                          : 'bg-red-100 text-red-700 border-red-300'
                      }`}>
                        {student.partial_grade ? Math.round(student.partial_grade * 100) / 100 : 'Falta'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {student.issues.map((issue, i) => (
                          <span key={i} className="inline-flex px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-700 border border-red-300">
                            ⚠ {issue}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-50 border-t border-gray-200">
            <p className="text-sm font-semibold text-slate-700">
              Total de registros: <span className="text-red-600">{students.length}</span>
            </p>
          </div>
        </div>
      ) : !loading ? (
        <div className="card p-8 text-center bg-green-50 border-2 border-green-200">
          <AlertCircle size={48} className="mx-auto text-green-400 mb-4" />
          <p className="text-green-800 font-semibold">No hay alumnos avanzados con asistencia/regularidad pendiente</p>
        </div>
      ) : null}
    </div>
  )
}
