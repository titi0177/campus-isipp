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

export function ScheduleViewByYear({ schedules, onDelete }: Props) {
  const [expandedYear, setExpandedYear] = useState<number | null>(null)

  const byYear: Record<number, Schedule[]> = {}
  schedules.forEach(s => {
    if (!byYear[s.year]) byYear[s.year] = []
    byYear[s.year].push(s)
  })

  const sortedYears = Object.keys(byYear)
    .map(Number)
    .sort((a, b) => a - b)

  return (
    <div className="space-y-3">
      {sortedYears.map(year => {
        const yearSchedules = byYear[year].sort((a, b) => {
          const dayOrder = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
          if (a.day !== b.day) return dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day)
          return a.start_time.localeCompare(b.start_time)
        })

        return (
          <div key={year} className="card p-0 overflow-hidden">
            <button
              onClick={() => setExpandedYear(expandedYear === year ? null : year)}
              className="w-full siu-band-header hover:opacity-90 transition-opacity flex items-center justify-between px-4 py-3 text-white"
            >
              <span className="text-sm font-bold tracking-wide">
                {year}° Año - {yearSchedules.length} horarios
              </span>
              <ChevronDown
                size={18}
                className={`transition-transform ${expandedYear === year ? 'rotate-180' : ''}`}
              />
            </button>

            {expandedYear === year && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-600 border-b">
                      <th className="px-4 py-2 text-left font-medium">Materia</th>
                      <th className="px-4 py-2 text-left font-medium">Código</th>
                      <th className="px-4 py-2 text-left font-medium">Profesor</th>
                      <th className="px-4 py-2 text-left font-medium">Carrera</th>
                      <th className="px-4 py-2 text-left font-medium">División</th>
                      <th className="px-4 py-2 text-left font-medium">Día</th>
                      <th className="px-4 py-2 text-center font-medium">Horario</th>
                      <th className="px-4 py-2 text-left font-medium">Aula</th>
                      <th className="px-4 py-2 text-center font-medium">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearSchedules.map(s => (
                      <tr key={s.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{s.subject_name}</td>
                        <td className="px-4 py-3 text-slate-600">{s.subject_code}</td>
                        <td className="px-4 py-3 text-slate-600">{s.professor_name || '-'}</td>
                        <td className="px-4 py-3 text-slate-600">{s.program_name}</td>
                        <td className="px-4 py-3">{s.division || '-'}</td>
                        <td className="px-4 py-3">{s.day}</td>
                        <td className="px-4 py-3 text-center">
                          {s.start_time} - {s.end_time}
                        </td>
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
          </div>
        )
      })}
    </div>
  )
}
