import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Calendar, MapPin, User } from 'lucide-react'
import { useToast } from '@/components/Toast'

export const Route = createFileRoute('/dashboard/exams')({
  component: ExamsPage,
})

function ExamsPage() {

  const [exams, setExams] = useState<any[]>([])
  const [student, setStudent] = useState<any>(null)
  const [registrations, setRegistrations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const { showToast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {

    try {

      setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!studentData) {
        showToast({
          type: 'error',
          message: 'No se encontró el estudiante'
        })
        return
      }

      setStudent(studentData)

      const { data: examsData } = await supabase
        .from('final_exams')
        .select(`
          *,
          subject:subjects(name),
          professor:professors(name)
        `)
        .eq('is_open', true)
        .order('exam_date', { ascending: true })

      setExams(examsData || [])

      const { data: regData } = await supabase
        .from('final_exam_registrations')
        .select('*')
        .eq('student_id', studentData.id)

      setRegistrations(regData || [])

    } catch (error) {

      showToast({
        type: 'error',
        message: 'Error cargando mesas'
      })

    } finally {
      setLoading(false)
    }

  }

  function isRegistered(examId: string) {
    return registrations.some(r => r.final_exam_id === examId)
  }

  async function seatsInfo(examId: string, maxStudents: number) {

    const { count } = await supabase
      .from('final_exam_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('final_exam_id', examId)

    return {
      count: count || 0,
      max: maxStudents || null
    }
  }

  function examClosed(examDate: string) {

    const exam = new Date(examDate)
    const now = new Date()

    const diff = exam.getTime() - now.getTime()
    const hours = diff / (1000 * 60 * 60)

    return hours < 24
  }

  async function registerExam(exam: any) {

    if (!student) return

    if (isRegistered(exam.id)) {
      showToast({
        type: 'info',
        message: 'Ya estás inscripto'
      })
      return
    }

    if (examClosed(exam.exam_date)) {
      showToast({
        type: 'error',
        message: 'La inscripción cierra 24 hs antes del examen'
      })
      return
    }

    const seats = await seatsInfo(exam.id, exam.max_students)

    if (seats.max && seats.count >= seats.max) {

      showToast({
        type: 'error',
        message: 'No hay cupos disponibles'
      })

      return
    }

    const { error } = await supabase
      .from('final_exam_registrations')
      .insert({
        final_exam_id: exam.id,
        student_id: student.id,
        status: 'registered'
      })

    if (error) {

      showToast({
        type: 'error',
        message: error.message
      })

      return
    }

    showToast({
      type: 'success',
      message: 'Inscripción realizada'
    })

    loadData()
  }

  async function cancelRegistration(examId: string) {

    const { error } = await supabase
      .from('final_exam_registrations')
      .delete()
      .eq('final_exam_id', examId)
      .eq('student_id', student.id)

    if (error) {

      showToast({
        type: 'error',
        message: 'Error cancelando inscripción'
      })

      return
    }

    showToast({
      type: 'success',
      message: 'Inscripción cancelada'
    })

    loadData()
  }

  if (loading) {
    return <p>Cargando mesas...</p>
  }

  return (

    <div className="space-y-6">

      <h1 className="text-2xl font-bold">
        Mesas de Examen
      </h1>

      {exams.length === 0 && (
        <p>No hay mesas disponibles</p>
      )}

      <div className="space-y-4">

        {exams.map(exam => {

          const registered = isRegistered(exam.id)
          const closed = examClosed(exam.exam_date)

          return (

            <div
              key={exam.id}
              className="bg-white rounded-lg shadow p-6 flex justify-between items-center"
            >

              <div className="space-y-2">

                <p className="font-semibold text-lg">
                  {exam.subject?.name}
                </p>

                <div className="text-sm text-gray-500 flex gap-4">

                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    {exam.exam_date}
                  </span>

                  <span className="flex items-center gap-1">
                    <MapPin size={14} />
                    {exam.location}
                  </span>

                </div>

                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <User size={14} />
                  {exam.professor?.name}
                </p>

              </div>

              {registered ? (

                <button
                  onClick={() => cancelRegistration(exam.id)}
                  className="bg-gray-500 text-white px-4 py-2 rounded"
                >
                  Cancelar inscripción
                </button>

              ) : closed ? (

                <span className="text-red-600 font-semibold">
                  Inscripción cerrada
                </span>

              ) : (

                <button
                  onClick={() => registerExam(exam)}
                  className="bg-[#7A1E2C] text-white px-4 py-2 rounded hover:bg-[#651823]"
                >
                  Inscribirse
                </button>

              )}

            </div>

          )

        })}

      </div>

    </div>

  )

}