import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

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

export function ScheduleViewByProfessor({ schedules, onDelete }: Props) {
  const [expandedProfessor, setExpandedProfessor] = useState<string | null>(null)

  const byProfessor: Record<string, Schedule[]> = {}
  schedules.forEach(s => {
    const prof = s.professor_name || 'Sin asignar'
    if (!byProfessor[prof]) byProfessor[prof] = []
    byProfessor[prof].push(s)
  })

  return (
    <div className="space-y-3">
      {Object.keys(byProfessor)
        .sort()
        .map(professor => (
          <div key={professor} className="card p-0 overflow-hidden">
            <button
              onClick={() => setExpandedProfessor(expandedProfessor === professor ? null : professor)}
              className="w-full siu-band-header hover:opacity-90 transition-opacity flex items-center justify-between px-4 py-3 text-white"
            >
              <span className="text-sm font-bold tracking-wide">
                {professor} - {byProfessor[professor].length} horarios
              </span>
              <ChevronDown
                size={18}
                className={`transition-transform ${expandedProfessor === professor ? 'rotate-180' : ''}`}
              />
            </button>

            {expandedProfessor === professor && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-600 border-b">
                      <th className="px-4 py-2 text-left font-medium">Materia</th>
                      <th className="px-4 py-2 text-left font-medium">Código</th>
                      <th className="px-4 py-2 text-left font-medium">Carrera</th>
                      <th className="px-4 py-2 text-left font-medium">Año</th>
                      <th className="px-4 py-2 text-left font-medium">Div</th>
                      <th className="px-4 py-2 text-left font-medium">Día</th>
                      <th className="px-4 py-2 text-center font-medium">Horario</th>
                      <th className="px-4 py-2 text-left font-medium">Aula</th>
                      <th className="px-4 py-2 text-center font-medium">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byProfessor[professor].map(s => (
                      <tr key={s.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{s.subject_name}</td>
                        <td className="px-4 py-3 text-slate-600">{s.subject_code}</td>
                        <td className="px-4 py-3 text-slate-600">{s.program_name}</td>
                        <td className="px-4 py-3">{s.year}°</td>
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
        ))}
    </div>
  )
}
