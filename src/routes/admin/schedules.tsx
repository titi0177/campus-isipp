import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { Trash2, Plus, Clock } from 'lucide-react'
import { ScheduleViewByProfessor } from '@/components/ScheduleViewByProfessor'
import { ScheduleViewByDay } from '@/components/ScheduleViewByDay'
import { ScheduleViewByYear } from '@/components/ScheduleViewByYear'

export const Route = createFileRoute('/admin/schedules')({
  component: AdminSchedulesPage,
})

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

type Professor = { id: string; name: string }
type Subject = { id: string; name: string; code: string; year: number }
type Program = { id: string; name: string }

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const DIVISIONS = ['A', 'B']

const SCHEDULE_BLOCKS: Record<string, Record<string, Array<{ start: string; end: string }>>> = {
  seguridad: {
    manana: [
      { start: '07:00', end: '07:45' },
      { start: '07:45', end: '08:30' },
      { start: '08:30', end: '09:15' },
      { start: '09:30', end: '10:15' },
      { start: '10:15', end: '11:00' },
      { start: '11:00', end: '11:45' },
    ],
    tarde: [
      { start: '17:40', end: '18:25' },
      { start: '18:25', end: '19:10' },
      { start: '19:20', end: '20:05' },
      { start: '20:05', end: '20:50' },
      { start: '20:50', end: '21:35' },
      { start: '21:40', end: '22:25' },
    ],
  },
  other: {
    tarde: [
      { start: '17:40', end: '18:25' },
      { start: '18:25', end: '19:10' },
      { start: '19:20', end: '20:05' },
      { start: '20:05', end: '20:50' },
      { start: '20:50', end: '21:35' },
      { start: '21:40', end: '22:25' },
    ],
  },
}

function getProgramType(programName: string): string {
  const lower = programName.toLowerCase()
  if (lower.includes('seguridad')) return 'seguridad'
  return 'other'
}

function shouldShowDivision(programName: string, year: string): boolean {
  const isAnalista = programName.toLowerCase().includes('analista de sistemas')
  const isFirstYear = year === '1'
  return isAnalista && isFirstYear
}

function AdminSchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [professors, setProfessors] = useState<Professor[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [viewMode, setViewMode] = useState<'professor' | 'day' | 'year'>('professor')

  const [formData, setFormData] = useState({
    professor_id: '',
    program_id: '',
    year: '',
    subject_id: '',
    division: '',
    day: '',
    shift: '',
    selectedBlocks: [] as number[],
    classroom: '',
  })

  const { showToast } = useToast()

  useEffect(() => {
    void loadData()
  }, [])

  useEffect(() => {
    if (formData.program_id && formData.year) {
      void loadSubjectsForProgramYear(formData.program_id, parseInt(formData.year))
    }
  }, [formData.program_id, formData.year])

  useEffect(() => {
    if (formData.program_id && formData.shift) {
      const program = programs.find(p => p.id === formData.program_id)
      if (program) {
        const programType = getProgramType(program.name)
        const blocks = SCHEDULE_BLOCKS[programType][formData.shift]
        if (blocks && blocks.length > 0) {
          setFormData(prev => ({ ...prev, selectedBlocks: [0] }))
        }
      }
    } else if (formData.program_id && !formData.shift) {
      const shifts = getAvailableShifts(formData.program_id)
      if (shifts.length === 1) {
        const program = programs.find(p => p.id === formData.program_id)
        if (program) {
          const programType = getProgramType(program.name)
          const blocks = SCHEDULE_BLOCKS[programType][shifts[0]]
          if (blocks && blocks.length > 0) {
            setFormData(prev => ({ ...prev, shift: shifts[0], selectedBlocks: [0] }))
          }
        }
      }
    }
  }, [formData.program_id, formData.shift, programs])

  async function loadData() {
    try {
      const { data: profsData } = await supabase.from('professors').select('id, name').order('name')
      setProfessors(profsData || [])

      const { data: progsData } = await supabase.from('programs').select('id, name').order('name')
      setPrograms(progsData || [])

      // Select string sin multiline para evitar problemas con Supabase PostgREST
      const selectStr = 'id,subject_id,subject:subjects(name,code,year),professor_id,professor:professors(name),program_id,program:programs(name),division,day,start_time,end_time,classroom'
      
      const { data } = await supabase
        .from('schedules')
        .select(selectStr)
        .order('day', { ascending: true })

      if (data) {
        const sorted = data.sort((a: any, b: any) => {
          if (a.day !== b.day) {
            return DAYS.indexOf(a.day) - DAYS.indexOf(b.day)
          }
          return a.start_time.localeCompare(b.start_time)
        })

        const formatted: Schedule[] = sorted.map((s: any) => ({
          id: s.id,
          subject_id: s.subject_id,
          subject_name: s.subject?.name,
          subject_code: s.subject?.code,
          year: s.subject?.year,
          professor_id: s.professor_id,
          professor_name: s.professor?.name,
          program_id: s.program_id,
          program_name: s.program?.name,
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
      console.error('Error loading data:', err)
      showToast('Error cargando datos', 'error')
      setLoading(false)
    }
  }

  async function loadSubjectsForProgramYear(programId: string, year: number) {
    try {
      const { data } = await supabase
        .from('subjects')
        .select('id, name, code, year')
        .eq('program_id', programId)
        .eq('year', year)
        .order('name')
      setSubjects(data || [])
    } catch (err) {
      console.error('Error loading subjects:', err)
      showToast('Error cargando materias', 'error')
    }
  }

  async function handleAddSchedule(e: React.FormEvent) {
    e.preventDefault()

    const program = programs.find(p => p.id === formData.program_id)
    const needsDivision = program && shouldShowDivision(program.name, formData.year)

    if (
      !formData.professor_id ||
      !formData.program_id ||
      !formData.year ||
      !formData.subject_id ||
      !formData.day ||
      formData.selectedBlocks.length === 0 ||
      !formData.classroom ||
      (needsDivision && !formData.division)
    ) {
      showToast('Completa todos los campos requeridos', 'error')
      return
    }

    if (formData.selectedBlocks.length > 3) {
      showToast('Máximo 3 bloques por día', 'error')
      return
    }

    try {
      const blocks = getScheduleBlocks()
      const firstBlock = blocks[formData.selectedBlocks[0]]
      const lastBlock = blocks[formData.selectedBlocks[formData.selectedBlocks.length - 1]]

      const insertData: any = {
        program_id: formData.program_id,
        subject_id: formData.subject_id,
        professor_id: formData.professor_id,
        day: formData.day,
        start_time: firstBlock.start,
        end_time: lastBlock.end,
        classroom: formData.classroom,
      }

      if (needsDivision) {
        insertData.division = formData.division
      }

      const { error } = await supabase.from('schedules').insert(insertData)

      if (error) throw error

      showToast('Horario agregado correctamente')
      setFormData({
        professor_id: '',
        program_id: '',
        year: '',
        subject_id: '',
        division: '',
        day: '',
        shift: '',
        selectedBlocks: [],
        classroom: '',
      })
      setShowForm(false)
      await loadData()
    } catch (err) {
      console.error('Error:', err)
      showToast('Error al agregar horario', 'error')
    }
  }

  async function deleteSchedule(id: string) {
    if (!confirm('¿Eliminar este horario?')) return

    try {
      const { error } = await supabase.from('schedules').delete().eq('id', id)

      if (error) throw error

      showToast('Horario eliminado')
      await loadData()
    } catch (err) {
      console.error('Error:', err)
      showToast('Error al eliminar', 'error')
    }
  }

  const getAvailableShifts = (programId?: string) => {
    const pId = programId || formData.program_id
    if (!pId) return []
    const program = programs.find(p => p.id === pId)
    if (!program) return []
    const programType = getProgramType(program.name)
    return Object.keys(SCHEDULE_BLOCKS[programType])
  }

  const getScheduleBlocks = () => {
    if (!formData.program_id || !formData.shift) return []
    const program = programs.find(p => p.id === formData.program_id)
    if (!program) return []
    const programType = getProgramType(program.name)
    return SCHEDULE_BLOCKS[programType][formData.shift] || []
  }

  const handleBlockToggle = (index: number) => {
    const blocks = getScheduleBlocks()
    const newSelected = [...formData.selectedBlocks]

    if (newSelected.includes(index)) {
      newSelected.splice(newSelected.indexOf(index), 1)
    } else {
      if (newSelected.length >= 3) {
        showToast('Máximo 3 bloques por día', 'error')
        return
      }
      newSelected.push(index)
    }

    newSelected.sort((a, b) => a - b)

    const isConsecutive = newSelected.every((val, i) => i === 0 || val === newSelected[i - 1] + 1)
    if (!isConsecutive && newSelected.length > 1) {
      showToast('Los bloques deben ser consecutivos', 'error')
      return
    }

    setFormData({ ...formData, selectedBlocks: newSelected })
  }

  const selectedProgram = programs.find(p => p.id === formData.program_id)
  const showDivision = selectedProgram && shouldShowDivision(selectedProgram.name, formData.year)

  if (loading) {
    return <p className="text-slate-600">Cargando...</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Clock size={28} />
          Gestión de Horarios
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          Carga horarios por profesor, materia y carrera. Permite hasta 3 bloques consecutivos por día.
        </p>
      </div>

      <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
        <Plus size={18} />
        Agregar horario
      </button>

      {showForm && (
        <div className="card p-4 bg-blue-50 border-l-4 border-l-blue-600">
          <h3 className="font-semibold text-gray-900 mb-4">Nuevo horario</h3>
          <form onSubmit={handleAddSchedule} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="professor-select" className="form-label">
                  Profesor *
                </label>
                <select
                  id="professor-select"
                  value={formData.professor_id}
                  onChange={e => setFormData({ ...formData, professor_id: e.target.value })}
                  className="form-input"
                >
                  <option value="">-- Selecciona profesor --</option>
                  {professors.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="program-select" className="form-label">
                  Carrera *
                </label>
                <select
                  id="program-select"
                  value={formData.program_id}
                  onChange={e => {
                    setFormData({
                      ...formData,
                      program_id: e.target.value,
                      year: '',
                      subject_id: '',
                      shift: '',
                      division: '',
                      selectedBlocks: [],
                    })
                    setSubjects([])
                  }}
                  className="form-input"
                >
                  <option value="">-- Selecciona carrera --</option>
                  {programs.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {formData.program_id && (getAvailableShifts().length > 1 || formData.shift) && (
                <div>
                  <label htmlFor="shift-select" className="form-label">
                    Turno {getAvailableShifts().length === 1 ? '(Único)' : ''} *
                  </label>
                  <select
                    id="shift-select"
                    value={formData.shift}
                    onChange={e => setFormData({ ...formData, shift: e.target.value, selectedBlocks: [] })}
                    className="form-input"
                  >
                    <option value="">-- Selecciona turno --</option>
                    {getAvailableShifts().map(shift => (
                      <option key={shift} value={shift}>
                        {shift === 'manana' ? 'Mañana' : 'Tarde'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formData.program_id && (
                <div>
                  <label htmlFor="year-select" className="form-label">
                    Año *
                  </label>
                  <select
                    id="year-select"
                    value={formData.year}
                    onChange={e => setFormData({ ...formData, year: e.target.value, subject_id: '', division: '' })}
                    className="form-input"
                  >
                    <option value="">-- Selecciona año --</option>
                    <option value="1">1° Año</option>
                    <option value="2">2° Año</option>
                    <option value="3">3° Año</option>
                    <option value="4">4° Año</option>
                    <option value="5">5° Año</option>
                  </select>
                </div>
              )}

              {showDivision && (
                <div>
                  <label htmlFor="division-select" className="form-label">
                    División *
                  </label>
                  <select
                    id="division-select"
                    value={formData.division}
                    onChange={e => setFormData({ ...formData, division: e.target.value })}
                    className="form-input"
                  >
                    <option value="">-- Selecciona división --</option>
                    {DIVISIONS.map(d => (
                      <option key={d} value={d}>
                        División {d}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formData.year && subjects.length > 0 && (
                <div>
                  <label htmlFor="subject-select" className="form-label">
                    Materia *
                  </label>
                  <select
                    id="subject-select"
                    value={formData.subject_id}
                    onChange={e => setFormData({ ...formData, subject_id: e.target.value })}
                    className="form-input"
                  >
                    <option value="">-- Selecciona materia --</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.code} - {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formData.year && subjects.length === 0 && (
                <div className="col-span-2">
                  <p className="text-sm text-yellow-700 bg-yellow-50 p-3 rounded">
                    No hay materias disponibles para {formData.year}° año en esta carrera
                  </p>
                </div>
              )}

              <div>
                <label htmlFor="day-select" className="form-label">
                  Día *
                </label>
                <select
                  id="day-select"
                  value={formData.day}
                  onChange={e => setFormData({ ...formData, day: e.target.value })}
                  className="form-input"
                >
                  <option value="">-- Selecciona día --</option>
                  {DAYS.map(d => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {formData.program_id && formData.shift && getScheduleBlocks().length > 0 && (
                <div className="col-span-2">
                  <label className="form-label mb-3 block">
                    Bloques de horario * (máximo 3 consecutivos)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                    {getScheduleBlocks().map((block, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleBlockToggle(idx)}
                        className={`p-2 rounded text-sm font-medium border-2 transition-all ${
                          formData.selectedBlocks.includes(idx)
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400'
                        }`}
                      >
                        {block.start}-{block.end.split(':')[0]}
                      </button>
                    ))}
                  </div>
                  {formData.selectedBlocks.length > 0 && (
                    <p className="text-xs text-gray-600 mt-2">
                      {formData.selectedBlocks.length} bloque(s) seleccionado(s):{' '}
                      {getScheduleBlocks()[formData.selectedBlocks[0]].start} -{' '}
                      {getScheduleBlocks()[formData.selectedBlocks[formData.selectedBlocks.length - 1]].end}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label htmlFor="classroom-input" className="form-label">
                  Aula/Salón *
                </label>
                <input
                  id="classroom-input"
                  type="text"
                  value={formData.classroom}
                  onChange={e => setFormData({ ...formData, classroom: e.target.value })}
                  placeholder="ej: 101"
                  className="form-input"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button type="submit" className="btn-primary">
                Guardar horario
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {schedules.length > 0 ? (
        <div className="space-y-4">
          <div className="flex gap-2 border-b">
            <button
              onClick={() => setViewMode('professor')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                viewMode === 'professor'
                  ? 'text-indigo-600 border-b-indigo-600'
                  : 'text-slate-600 border-b-transparent hover:text-slate-900'
              }`}
            >
              Por Profesor
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                viewMode === 'day'
                  ? 'text-indigo-600 border-b-indigo-600'
                  : 'text-slate-600 border-b-transparent hover:text-slate-900'
              }`}
            >
              Por Día
            </button>
            <button
              onClick={() => setViewMode('year')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                viewMode === 'year'
                  ? 'text-indigo-600 border-b-indigo-600'
                  : 'text-slate-600 border-b-transparent hover:text-slate-900'
              }`}
            >
              Por Año
            </button>
          </div>

          {viewMode === 'professor' && <ScheduleViewByProfessor schedules={schedules} onDelete={deleteSchedule} />}
          {viewMode === 'day' && <ScheduleViewByDay schedules={schedules} onDelete={deleteSchedule} />}
          {viewMode === 'year' && <ScheduleViewByYear schedules={schedules} onDelete={deleteSchedule} />}
        </div>
      ) : (
        <div className="card p-6 text-center">
          <p className="text-slate-500">No hay horarios cargados. Agrega uno usando el formulario arriba.</p>
        </div>
      )}
    </div>
  )
}
