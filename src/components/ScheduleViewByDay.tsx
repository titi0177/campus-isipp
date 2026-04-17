import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

type Schedule = {
  id: string
  subject_id: string
  subject_name: string
  subject_code: string
  professor_id?: string
  professor_name?: string
  program_id?: string
  program_name?: string
  division?: string
  day: string
  start_time: string
  end_time: string
  classroom: string
  year: number
}

type Props = {
  schedules: Schedule[]
  onDelete: (id: string) => void
}

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export function ScheduleViewByDay({ schedules, onDelete }: Props) {
  const [expandedDay, setExpandedDay] = useState<string | null>(null)

  const byDay: Record<string, Schedule[]> = {}
  DAYS.forEach(day => {
    byDay[day] = schedules.filter(s => s.day === day).sort((a, b) => a.start_time.localeCompare(b.start_time))
  })

  return (
    <div className="space-y-3">
      {DAYS.map(day => (
        <div key={day} className="card p-0 overflow-hidden">
          <button
            onClick={() => setExpandedDay(expandedDay === day ? null : day)}
            className="w-full siu-band-header hover:opacity-90 transition-opacity flex items-center justify-between px-4 py-3 text-white"
          >
            <span className="text-sm font-bold tracking-wide">
              {day} - {byDay[day].length} horarios
            </span>
            <ChevronDown
              size={18}
              className={`transition-transform ${expandedDay === day ? 'rotate-180' : ''}`}
            />
          </button>

          {expandedDay === day && byDay[day].length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-600 border-b">
                    <th className="px-4 py-2 text-left font-medium">Horario</th>
                    <th className="px-4 py-2 text-left font-medium">Materia</th>
                    <th className="px-4 py-2 text-left font-medium">Código</th>
                    <th className="px-4 py-2 text-left font-medium">Profesor</th>
                    <th className="px-4 py-2 text-left font-medium">Carrera</th>
                    <th className="px-4 py-2 text-left font-medium">Año</th>
                    <th className="px-4 py-2 text-left font-medium">Div</th>
                    <th className="px-4 py-2 text-left font-medium">Aula</th>
                    <th className="px-4 py-2 text-center font-medium">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {byDay[day].map(s => (
                    <tr key={s.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium whitespace-nowrap">
                        {s.start_time} - {s.end_time}
                      </td>
                      <td className="px-4 py-3 font-medium">{s.subject_name}</td>
                      <td className="px-4 py-3 text-slate-600">{s.subject_code}</td>
                      <td className="px-4 py-3 text-slate-600">{s.professor_name || '-'}</td>
                      <td className="px-4 py-3 text-slate-600">{s.program_name}</td>
                      <td className="px-4 py-3">{s.year}°</td>
                      <td className="px-4 py-3">{s.division || '-'}</td>
                      <td className="px-4 py-3">{s.classroom}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => onDelete(s.id)}
                          className="text-red-600 hover:text-red-800 font-medium text-sm"
                          title="Eliminar"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {expandedDay === day && byDay[day].length === 0 && (
            <div className="px-4 py-3 text-sm text-slate-500">Sin horarios</div>
          )}
        </div>
      ))}
    </div>
  )
}
