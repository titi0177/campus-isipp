import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Check, X, AlertCircle } from 'lucide-react'

type StudentStatus = {
  enrollment_id: string
  student_name: string
  subject_name: string
  partial_grade?: number
  final_grade?: number
  partial_status?: string
  final_status?: string
  status: string
}

export function StudentStatusDisplay() {
  const [statuses, setStatuses] = useState<StudentStatus[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStatuses()
  }, [])

  const loadStatuses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!student) return

      const { data } = await supabase
        .from('enrollments')
        .select(`
          id,
          status,
          subject:subjects(name),
          grades:enrollment_grades(
            partial_grade,
            final_grade,
            partial_status,
            final_status
          )
        `)
        .eq('student_id', student.id)

      if (data) {
        const formatted = data.map((e: any) => {
          const grade = Array.isArray(e.grades) ? e.grades[0] : e.grades
          return {
            enrollment_id: e.id,
            student_name: '',
            subject_name: e.subject?.name || 'Materia desconocida',
            partial_grade: grade?.partial_grade,
            final_grade: grade?.final_grade,
            partial_status: grade?.partial_status,
            final_status: grade?.final_status,
            status: e.status,
          }
        })
        setStatuses(formatted)
      }

      setLoading(false)
    } catch (err) {
      console.error('Error loading statuses:', err)
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
      promocionado: {
        bg: 'bg-green-100',
        text: 'text-green-700',
        icon: <Check size={16} />,
        label: 'Promocionado',
      },
      aprobado: {
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        icon: <Check size={16} />,
        label: 'Aprobado',
      },
      regular: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-700',
        icon: <AlertCircle size={16} />,
        label: 'Regular',
      },
      desaprobado: {
        bg: 'bg-red-100',
        text: 'text-red-700',
        icon: <X size={16} />,
        label: 'Desaprobado',
      },
      en_curso: {
        bg: 'bg-gray-100',
        text: 'text-gray-700',
        icon: <AlertCircle size={16} />,
        label: 'En Curso',
      },
    }

    const badge = badges[status] || badges.en_curso
    return (
      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${badge.bg} ${badge.text} font-semibold text-xs`}>
        {badge.icon}
        {badge.label}
      </div>
    )
  }

  if (loading) {
    return <div className="text-center py-4">Cargando estados...</div>
  }

  if (statuses.length === 0) {
    return (
      <div className="card p-6 text-center bg-blue-50 border border-blue-200">
        <p className="text-blue-700 font-medium">No tienes materias inscritas</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="card p-4 bg-gradient-to-r from-indigo-50 to-blue-50 border-2 border-indigo-200">
        <h3 className="font-bold text-indigo-900 mb-2">Estado de Tus Materias</h3>
        <p className="text-sm text-indigo-800">
          Aquí se muestra tu progreso en cada materia según las calificaciones cargadas
        </p>
      </div>

      <div className="grid gap-3">
        {statuses.map(status => (
          <div
            key={status.enrollment_id}
            className="card p-4 bg-white border border-gray-200 flex items-center justify-between"
          >
            <div>
              <p className="font-bold text-gray-900">{status.subject_name}</p>
              <div className="mt-1 space-y-1 text-sm text-gray-600">
                {status.partial_grade && (
                  <p>Promedio Parcial: <span className="font-bold text-gray-900">{status.partial_grade.toFixed(1)}</span></p>
                )}
                {status.final_grade && (
                  <p>Nota Final: <span className="font-bold text-gray-900">{status.final_grade.toFixed(1)}</span></p>
                )}
              </div>
            </div>
            <div>
              {getStatusBadge(status.status)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
