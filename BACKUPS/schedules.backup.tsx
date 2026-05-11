import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { Calendar, Clock, MapPin, User, Grid3x3, List } from 'lucide-react'

export const Route = createFileRoute('/dashboard/schedules')({
  component: StudentSchedulesPage,
})

type Schedule = {
  id: string
  subject_name: string
  subject_code: string
  professor_name?: string
  division?: string
  day: string
  start_time: string
  end_time: string
  classroom: string
  year: number
}

function StudentSchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
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

  const dayColors: Record<string, string> = {
    Lunes: 'from-blue-600 to-blue-700',
    Martes: 'from-purple-600 to-purple-700',
    Miércoles: 'from-pink-600 to-pink-700',
    Jueves: 'from-orange-600 to-orange-700',
    Viernes: 'from-green-600 to-green-700',
    Sábado: 'from-indigo-600 to-indigo-700',
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

      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('subject_id, division')
        .eq('student_id', student.id)

      if (!enrollments || enrollments.length === 0) {
        setSchedules([])
        setLoading(false)
        return
      }

      // Create a map of subject_id -> division for filtering
      const enrollmentDivisionMap: Record<string, string | null> = {}
      enrollments.forEach(e => {
        enrollmentDivisionMap[e.subject_id] = e.division
      })

      const subjectIds = enrollments.map(e => e.subject_id)

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
          classroom,
          division
        `)
        .in('subject_id', subjectIds)
        .order('day')
        .order('start_time')

      if (data) {
        // Filter schedules based on student's division choice
        const filtered = data.filter((s: any) => {
          const studentDivision = enrollmentDivisionMap[s.subject_id]
          // If schedule has no division (year 2+), include it
          if (!s.division) return true
          // If schedule has division, only include if it matches student's division
          return s.division === studentDivision
        })

        const formatted: Schedule[] = filtered.map((s: any) => ({
          id: s.id,
          subject_name: s.subject?.name,
          subject_code: s.subject?.code,
          year: s.subject?.year,
          professor_name: s.professor?.name,
          division: s.division,
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

  const byDay: Record<string, Schedule[]> = {}
  days.forEach(day => {
    byDay[day] = schedules.filter(s => s.day === day)
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-2xl">
          <h1 className="text-4xl font-black mb-2">Mi Horario</h1>
          <p className="text-blue-100">Cargando tu horario de clases...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header Hero */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-blue-100 text-sm font-semibold mb-2">Calendario Académico</p>
            <h1 className="text-5xl font-black mb-2">Mi Horario</h1>
            <p className="text-blue-100 text-lg">Horarios de todas tus clases del semestre</p>
          </div>
          <Calendar size={80} className="opacity-20" />
        </div>
      </div>

      {schedules.length === 0 ? (
        <div className="card p-16 text-center rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200">
          <Calendar size={64} className="mx-auto text-gray-400 mb-6" />
          <p className="text-gray-600 text-xl font-semibold">No tienes horarios asignados</p>
          <p className="text-gray-500 mt-2">Inscríbete en materias para ver sus horarios de clase</p>
        </div>
      ) : (
        <>
          {/* View Toggle */}
          <div className="flex gap-2 bg-gray-100 p-1 rounded-full w-fit">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded-full font-semibold flex items-center gap-2 transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-indigo-600 shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Grid3x3 size={18} />
              Vista Grid
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 rounded-full font-semibold flex items-center gap-2 transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-indigo-600 shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List size={18} />
              Vista Tabla
            </button>
          </div>

          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {days.map(day => {
                const daySchedules = byDay[day] || []
                if (daySchedules.length === 0) return null

                return (
                  <div key={day} className="card p-0 overflow-hidden shadow-lg hover:shadow-2xl transition-shadow">
                    {/* Day Header */}
                    <div className={`bg-gradient-to-r ${dayColors[day]} p-6 text-white`}>
                      <h3 className="text-2xl font-black">{day}</h3>
                      <p className="text-blue-100 text-sm mt-1">{daySchedules.length} clase{daySchedules.length !== 1 ? 's' : ''}</p>
                    </div>

                    {/* Schedule Items */}
                    <div className="space-y-3 p-4">
                      {daySchedules.map((s, idx) => (
                        <div
                          key={s.id}
                          className="border-l-4 border-l-indigo-600 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-4 hover:shadow-md transition-all hover:scale-105"
                        >
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-900 text-sm">{s.subject_name}</h4>
                              <p className="text-xs font-mono font-semibold text-indigo-600 mt-1">{s.subject_code}</p>
                            </div>
                            <div className="bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                              {idx + 1}
                            </div>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-gray-700">
                              <Clock size={16} className="text-indigo-600" />
                              <span className="font-semibold">{s.start_time}</span>
                              <span className="text-gray-500">-</span>
                              <span className="font-semibold">{s.end_time}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-700">
                              <MapPin size={16} className="text-indigo-600" />
                              <span className="font-semibold">Aula {s.classroom}</span>
                            </div>
                            {s.professor_name && (
                              <div className="flex items-center gap-2 text-gray-700">
                                <User size={16} className="text-indigo-600" />
                                <span className="font-semibold">{s.professor_name}</span>
                              </div>
                            )}
                            {s.year === 1 && s.division && (
                              <div className="flex items-center gap-2 text-gray-700 pt-1">
                                <span className="inline-block bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded">División {s.division}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Table View */}
          {viewMode === 'table' && (
            <div className="card p-0 overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                      <th className="px-6 py-4 text-left text-sm font-bold">Materia</th>
                      <th className="px-6 py-4 text-left text-sm font-bold">Profesor</th>
                      <th className="px-6 py-4 text-left text-sm font-bold">Día</th>
                      <th className="px-6 py-4 text-center text-sm font-bold">Horario</th>
                      <th className="px-6 py-4 text-center text-sm font-bold">Aula</th>
                      <th className="px-6 py-4 text-center text-sm font-bold">Año</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {schedules
                      .sort((a, b) => {
                        const dayDiff = (daysOrder[a.day] || 0) - (daysOrder[b.day] || 0)
                        if (dayDiff !== 0) return dayDiff
                        return a.start_time.localeCompare(b.start_time)
                      })
                      .map((s, idx) => (
                        <tr
                          key={s.id}
                          className={`hover:bg-indigo-50 transition-colors ${
                            idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                          }`}
                        >
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-bold text-gray-900">{s.subject_name}</p>
                              <p className="text-xs font-mono text-indigo-600 mt-1">{s.subject_code}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-700 font-medium">{s.professor_name || '-'}</td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-semibold">
                              {s.day}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-gray-900">
                            {s.start_time} - {s.end_time}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 font-semibold text-sm">
                              {s.classroom}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col items-center gap-1">
                              <span className="font-bold text-gray-900">{s.year}°</span>
                              {s.year === 1 && s.division && (
                                <span className="text-xs bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded">Div. {s.division}</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-4 border-l-4 border-l-indigo-600 bg-gradient-to-br from-indigo-50 to-blue-50">
              <p className="text-xs text-indigo-600 font-bold mb-2">TOTAL DE CLASES</p>
              <p className="text-3xl font-black text-indigo-700">{schedules.length}</p>
            </div>
            <div className="card p-4 border-l-4 border-l-purple-600 bg-gradient-to-br from-purple-50 to-pink-50">
              <p className="text-xs text-purple-600 font-bold mb-2">DÍAS CON CLASE</p>
              <p className="text-3xl font-black text-purple-700">{Object.values(byDay).filter(d => d.length > 0).length}</p>
            </div>
            <div className="card p-4 border-l-4 border-l-green-600 bg-gradient-to-br from-green-50 to-emerald-50">
              <p className="text-xs text-green-600 font-bold mb-2">PRIMERO MATERIA</p>
              <p className="text-sm font-bold text-green-700">
                {schedules.length > 0 
                  ? `${schedules.reduce((min, s) => {
                      const timeA = parseInt(s.start_time.replace(':', ''))
                      const timeB = parseInt(min.start_time.replace(':', ''))
                      return timeA < timeB ? s : min
                    }).start_time} hs`
                  : 'N/A'}
              </p>
            </div>
            <div className="card p-4 border-l-4 border-l-orange-600 bg-gradient-to-br from-orange-50 to-yellow-50">
              <p className="text-xs text-orange-600 font-bold mb-2">ÚLTIMA MATERIA</p>
              <p className="text-sm font-bold text-orange-700">
                {schedules.length > 0
                  ? `${schedules.reduce((max, s) => {
                      const timeA = parseInt(s.end_time.replace(':', ''))
                      const timeB = parseInt(max.end_time.replace(':', ''))
                      return timeA > timeB ? s : max
                    }).end_time} hs`
                  : 'N/A'}
              </p>
            </div>
          </div>
        </>
      )}

      {/* Info Box */}
      {schedules.length > 0 && (
        <div className="bg-gradient-to-r from-cyan-50 via-blue-50 to-indigo-50 rounded-3xl p-6 border-2 border-blue-200">
          <div className="flex gap-4">
            <Calendar size={24} className="text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Consejos para no faltar</h3>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>✓ La <strong>asistencia mínima del 60%</strong> es obligatoria para poder rendir examen</li>
                <li>✓ Planifica tus actividades considerando tus horarios de clase</li>
                <li>✓ Si necesitas faltar, avísale al profesor con anticipación</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
