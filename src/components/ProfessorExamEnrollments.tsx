import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { AlertCircle, Users } from 'lucide-react'

type ExamStudent = {
  first_name: string
  last_name: string
  exam_date: string
}

type Props = {
  subjectId: string
}

export function ProfessorExamEnrollments({ subjectId }: Props) {
  const [students, setStudents] = useState<ExamStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const formatExamDate = (dateString: string): string => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    const day = date.getDate()
    const monthNames = [
      'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
      'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
    ]
    const month = monthNames[date.getMonth()]
    const year = date.getFullYear()
    return `${day} de ${month} de ${year}`
  }

  useEffect(() => {
    loadExamStudents()
  }, [subjectId])

  const loadExamStudents = async () => {
    try {
      setLoading(true)
      setError('')

      const { data, error: err } = await supabase
        .from('exam_enrollments')
        .select(`
          final_exams!inner(subject_id, exam_date),
          student:students(first_name, last_name)
        `)
        .eq('final_exams.subject_id', subjectId)
        .order('student(last_name)')

      if (err) {
        console.error('Error loading exam students:', err)
        setError('Error al cargar alumnos inscritos a examen final')
        setStudents([])
        setLoading(false)
        return
      }

      const formatted = data?.map(e => ({
        first_name: e.student.first_name,
        last_name: e.student.last_name,
        exam_date: e.final_exams.exam_date,
      })) || []

      setStudents(formatted)
      setLoading(false)
    } catch (err) {
      console.error('Error:', err)
      setError('Error inesperado al cargar alumnos')
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="card p-6 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-200 border-t-indigo-600 mb-4"></div>
        <p className="text-slate-600">Cargando alumnos inscritos a examen final...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card p-6 bg-red-50 border border-red-200 flex gap-3">
        <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-red-900">Error</p>
          <p className="text-sm text-red-700 mt-1">{error}</p>
        </div>
      </div>
    )
  }

  if (students.length === 0) {
    return (
      <div className="card p-12 text-center bg-blue-50 border-2 border-blue-200">
        <Users size={48} className="mx-auto text-blue-400 mb-4 opacity-50" />
        <p className="text-gray-600 font-medium text-lg">No hay alumnos inscritos a examen final</p>
        <p className="text-sm text-gray-500 mt-2">Cuando se agreguen inscripciones, aparecerán aquí</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="card p-6 bg-gradient-to-r from-cyan-50 to-blue-50 border-2 border-cyan-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900 mb-1 text-lg">Alumnos Inscritos a Examen Final</h3>
            <p className="text-sm text-gray-700">Lista de estudiantes inscriptos en la mesa de examen</p>
          </div>
          <Users size={40} className="text-cyan-600 opacity-20" />
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-6 py-3 font-bold flex items-center justify-between">
          <span>Total: {students.length} alumnos inscritos</span>
        </div>

        <div className="divide-y divide-gray-200">
          {students.map((student, idx) => (
            <div
              key={idx}
              className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4 flex-grow">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white flex items-center justify-center font-bold text-sm">
                  {idx + 1}
                </div>
                <div className="flex-grow">
                  <p className="font-semibold text-gray-900">
                    {student.last_name}, {student.first_name}
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-medium text-gray-600">
                  {formatExamDate(student.exam_date)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-4 bg-blue-50 border border-blue-200">
        <p className="text-sm text-blue-900">
          <span className="font-semibold">Total de inscritos:</span> {students.length} alumno{students.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  )
}
