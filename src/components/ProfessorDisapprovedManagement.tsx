import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { AlertCircle, Check } from 'lucide-react'

type DisapprovedStudent = {
  id: string
  enrollment_id: string
  student_id: string
  student_name: string
  legajo: string
  subject_name: string
  subject_code: string
  attempt_number: number
  division?: string
  partial_grade: number
  final_grade: number
  final_status: string
  completed_at?: string
}

type Props = {
  subjectId: string
}

export function ProfessorDisapprovedManagement({ subjectId }: Props) {
  const [disapprovedStudents, setDisapprovedStudents] = useState<DisapprovedStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadDisapprovedStudents()
  }, [subjectId])

  const loadDisapprovedStudents = async () => {
    try {
      let { data, error: err } = await supabase
        .from('enrollment_grades')
        .select(`
          id,
          enrollment_id,
          partial_grade,
          final_grade,
          final_status,
          enrollments!inner(
            id,
            student_id,
            attempt_number,
            division,
            student:students(first_name, last_name, legajo),
            subject:subjects(id, name, code)
          )
        `)
        .eq('enrollments.subject_id', subjectId)
        .eq('final_status', 'desaprobado')

      if (err) {
        console.error('Error loading disapproved students:', err)
        setError('Error al cargar desaprobados: ' + err.message)
        setLoading(false)
        return
      }

      if (data) {
        const formatted = data.map((r: any) => ({
          id: r.id,
          enrollment_id: r.enrollment_id,
          student_id: r.enrollments.student_id,
          student_name: `${r.enrollments.student.last_name}, ${r.enrollments.student.first_name}`,
          legajo: r.enrollments.student.legajo || 'S/N',
          subject_name: r.enrollments.subject.name,
          subject_code: r.enrollments.subject.code,
          attempt_number: r.enrollments.attempt_number || 1,
          division: r.enrollments.division,
          partial_grade: r.partial_grade,
          final_grade: r.final_grade,
          final_status: r.final_status,
          completed_at: r.created_at,
        }))
        setDisapprovedStudents(formatted)
      }

      setLoading(false)
    } catch (err) {
      console.error('Error:', err)
      setError('Error al cargar datos: ' + String(err))
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="card p-6 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-200 border-t-indigo-600 mb-4"></div>
        <p className="text-slate-600">Cargando desaprobados...</p>
      </div>
    )
  }

  if (disapprovedStudents.length === 0) {
    return (
      <div className="card p-6 text-center bg-green-50 border border-green-200">
        <p className="text-green-700 font-medium">No hay alumnos desaprobados en esta materia</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex gap-2">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <div className="card p-4 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200">
        <h3 className="font-bold text-red-900 mb-2">Alumnos Desaprobados</h3>
        <p className="text-sm text-red-900">
          <strong>{disapprovedStudents.length}</strong> estudiante{disapprovedStudents.length !== 1 ? 's' : ''} desaprobado{disapprovedStudents.length !== 1 ? 's' : ''} en esta materia
        </p>
      </div>

      <div className="card p-4 bg-blue-50 border-2 border-blue-200">
        <h3 className="font-bold text-blue-900 mb-2">Reinscripcion - Accion del Alumno</h3>
        <p className="text-sm text-blue-900">
          Los alumnos desaprobados pueden reinscribirse como recursantes desde su Dashboard. 
          Ve a: <strong>Dashboard → Reinscripcion</strong> para completar el proceso.
        </p>
      </div>

      <div className="card p-0 overflow-hidden rounded-2xl border-2 border-red-200 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-red-600 to-orange-600 text-white">
                <th className="px-4 py-3 text-left font-bold">Legajo</th>
                <th className="px-4 py-3 text-left font-bold">Alumno</th>
                <th className="px-4 py-3 text-center font-bold">Materia</th>
                <th className="px-4 py-3 text-center font-bold">Intento</th>
                <th className="px-4 py-3 text-center font-bold">Promedio</th>
                <th className="px-4 py-3 text-center font-bold">Nota Final</th>
                <th className="px-4 py-3 text-center font-bold">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {disapprovedStudents.map((student, idx) => (
                <tr key={student.enrollment_id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 font-semibold text-gray-900">{student.legajo}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{student.student_name}</td>
                  <td className="px-4 py-3 text-center text-gray-700">
                    <span className="inline-block bg-blue-100 text-blue-900 px-2 py-1 rounded-full text-xs font-bold">
                      {student.subject_code}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-gray-900">
                    <span className="inline-block bg-yellow-100 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold">
                      {student.attempt_number}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-gray-900">
                    {student.partial_grade !== null && student.partial_grade !== undefined ? Number(student.partial_grade).toFixed(1) : '-'}
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-red-700">
                    {student.final_grade !== null && student.final_grade !== undefined ? Number(student.final_grade).toFixed(1) : '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                      Desaprobado
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-4 bg-blue-50 border-2 border-blue-200">
        <h3 className="font-bold text-blue-900 mb-2">Informacion:</h3>
        <ul className="text-sm text-blue-900 space-y-1">
          <li>Los alumnos desaprobados aparecen aqui con promedio menor a 6</li>
          <li>Pueden reinscribirse accediendo a su Dashboard → Reinscripcion</li>
          <li>Se crean como recursantes (2do intento) automaticamente</li>
          <li>Conservan su historial del primer intento</li>
        </ul>
      </div>
    </div>
  )
}
