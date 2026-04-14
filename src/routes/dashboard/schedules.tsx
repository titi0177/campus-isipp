import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { Calendar } from 'lucide-react'

export const Route = createFileRoute('/dashboard/schedules')({
  component: StudentSchedulesPage,
})

type Schedule = {
  id: string
  subject_name: string
  subject_code: string
  professor_name?: string
  day: string
  start_time: string
  end_time: string
  classroom: string
  year: number
}

function StudentSchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()

  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  const daysOrder: Record<string, number> = {
    Lunes: 0,
    Martes: 1,
    Miércoles: 2,
    Jueves: 3,
    Viernes: 4,
    Sábado: 5,
  }

  useEffect(() => {
    void loadSchedules()
  }, [])

  async function loadSchedules() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!student) {
        showToast('Estudiante no encontrado', 'error')
        setLoading(false)
        return
      }

      // Obtener materias inscritas por el estudiante
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('subject_id')
        .eq('student_id', student.id)

      if (!enrollments || enrollments.length === 0) {
        setSchedules([])
        setLoading(false)
        return
      }

      const subjectIds = enrollments.map(e => e.subject_id)

      // Obtener horarios de esas materias
      const { data } = await supabase
        .from('schedules')
        .select(`
          id,
          subject_id,
          subject:subjects(name, code, year),
          professor:professors(name),
          day,
          start_time,
          end_time,
          classroom
        `)
        .in('subject_id', subjectIds)
        .order('day')
        .order('start_time')

      if (data) {
        const formatted: Schedule[] = data.map((s: any) => ({
          id: s.id,
          subject_name: s.subject?.name,
          subject_code: s.subject?.code,
          year: s.subject?.year,
          professor_name: s.professor?.name,
          day: s.day,
          start_time: s.start_time,
          end_time: s.end_time,
          classroom: s.classroom,
        }))
        setSchedules(formatted)
      }
      setLoading(false)
    } catch (err) {
      console.error('Error loading schedules:', err)
      showToast('Error cargando horarios', 'error')
      setLoading(false)
    }
  }

  // Agrupar por día
  const byDay: Record<string, Schedule[]> = {}
  days.forEach(day => {
    byDay[day] = schedules.filter(s => s.day === day)
  })

  if (loading) {
    return <p className="text-slate-600">Cargando horarios...</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calendar size={28} />
          Mi Horario
        </h1>
        <p className="text-slate-600 text-sm mt-1">Horarios de las materias en las que estoy inscripto</p>
      </div>

      {schedules.length === 0 ? (
        <div className="card p-6 text-center">
          <p className="text-slate-500">Aún no tienes materias con horarios asignados.</p>
          <p className="text-slate-400 text-sm mt-1">Inscríbete en materias para ver los horarios de clases.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {days.map(day => {
            const daySchedules = byDay[day] || []
            if (daySchedules.length === 0) return null

            return (
              <div key={day} className="card p-0 overflow-hidden">
                <div className="siu-band-header">
                  <h3 className="text-sm font-bold tracking-wide text-white">{day}</h3>
                </div>
                <div className="space-y-3 p-4">
                  {daySchedules.map(s => (
                    <div
                      key={s.id}
                      className="border border-slate-200 rounded p-3 hover:bg-slate-50 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{s.subject_name}</p>
                          <p className="text-xs text-slate-500 mt-1">{s.subject_code}</p>
                          {s.professor_name && (
                            <p className="text-sm text-slate-600 mt-2">
                              Prof: <span className="font-medium">{s.professor_name}</span>
                            </p>
                          )}
                        </div>
                        <div className="text-right ml-2">
                          <p className="font-bold text-lg text-[var(--siu-blue)]">
                            {s.start_time}
                          </p>
                          <p className="text-xs text-slate-500">a {s.end_time}</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <p className="text-sm text-slate-700">
                          <span className="font-medium">Aula:</span> {s.classroom}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Vista de tabla alternativa */}
      {schedules.length > 0 && (
        <div className="card p-0 overflow-hidden mt-6">
          <div className="siu-band-header">
            <h3 className="text-sm font-bold tracking-wide text-white">Vista de Tabla</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-600 border-b">
                  <th className="px-4 py-2 text-left font-medium">Materia</th>
                  <th className="px-4 py-2 text-left font-medium">Profesor</th>
                  <th className="px-4 py-2 text-left font-medium">Día</th>
                  <th className="px-4 py-2 text-center font-medium">Hora</th>
                  <th className="px-4 py-2 text-left font-medium">Aula</th>
                </tr>
              </thead>
              <tbody>
                {schedules
                  .sort((a, b) => {
                    const dayDiff = (daysOrder[a.day] || 0) - (daysOrder[b.day] || 0)
                    if (dayDiff !== 0) return dayDiff
                    return a.start_time.localeCompare(b.start_time)
                  })
                  .map(s => (
                    <tr key={s.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{s.subject_name}</td>
                      <td className="px-4 py-3 text-slate-600">{s.professor_name || '-'}</td>
                      <td className="px-4 py-3">{s.day}</td>
                      <td className="px-4 py-3 text-center font-medium">
                        {s.start_time} - {s.end_time}
                      </td>
                      <td className="px-4 py-3">{s.classroom}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
