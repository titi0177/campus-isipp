import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { Plus, Trash2, ChevronDown } from 'lucide-react'

export const Route = createFileRoute('/admin/correlatives')({
  component: CorrelativesPage,
})

interface SubjectWithCorrelatives {
  id: string
  name: string
  code: string
  program_id: string
  program_name: string
  correlatives: string[] // IDs de correlativas
}

function CorrelativesPage() {
  const [programs, setPrograms] = useState<any[]>([])
  const [subjectsByProgram, setSubjectsByProgram] = useState<Record<string, SubjectWithCorrelatives[]>>({})
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
  const [availableCorrelatives, setAvailableCorrelatives] = useState<SubjectWithCorrelatives[]>([])
  const [selectedCorrelatives, setSelectedCorrelatives] = useState<Set<string>>(new Set())
  const [expandedProgram, setExpandedProgram] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      // Cargar programas
      const { data: progs } = await supabase.from('programs').select('id, name').order('name')
      setPrograms(progs || [])

      // Cargar materias con sus correlativas
      const { data: correlativesData } = await supabase
        .from('subject_correlatives')
        .select('subject_id, requires_subject_id')

      const corrMap = new Map<string, string[]>()
      correlativesData?.forEach(c => {
        if (!corrMap.has(c.subject_id)) corrMap.set(c.subject_id, [])
        corrMap.get(c.subject_id)?.push(c.requires_subject_id)
      })

      // Cargar materias por programa
      const { data: subjectsData } = await supabase
        .from('subjects')
        .select('id, name, code, program_id, programs(name)')
        .order('name')

      const byProgram: Record<string, SubjectWithCorrelatives[]> = {}
      subjectsData?.forEach(s => {
        const prog = s.programs as any
        if (!byProgram[prog.name]) byProgram[prog.name] = []
        byProgram[prog.name].push({
          id: s.id,
          name: s.name,
          code: s.code,
          program_id: s.program_id,
          program_name: prog.name,
          correlatives: corrMap.get(s.id) || [],
        })
      })

      setSubjectsByProgram(byProgram)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectSubject = async (subjectId: string, programName: string) => {
    setSelectedSubject(subjectId)

    // Obtener materias disponibles como correlativas (todas excepto la seleccionada)
    const available = Object.values(subjectsByProgram)
      .flat()
      .filter(s => s.id !== subjectId)

    setAvailableCorrelatives(available)

    // Cargar correlativas actuales de esta materia
    const subject = Object.values(subjectsByProgram)
      .flat()
      .find(s => s.id === subjectId)

    setSelectedCorrelatives(new Set(subject?.correlatives || []))
  }

  const handleToggleCorrelative = (correlativeId: string) => {
    const newSet = new Set(selectedCorrelatives)
    if (newSet.has(correlativeId)) {
      newSet.delete(correlativeId)
    } else {
      newSet.add(correlativeId)
    }
    setSelectedCorrelatives(newSet)
  }

  const handleSaveCorrelatives = async () => {
    if (!selectedSubject) return

    try {
      // Eliminar correlativas actuales
      await supabase.from('subject_correlatives').delete().eq('subject_id', selectedSubject)

      // Insertar nuevas correlativas
      if (selectedCorrelatives.size > 0) {
        const newCorrelatives = Array.from(selectedCorrelatives).map(requires_subject_id => ({
          subject_id: selectedSubject,
          requires_subject_id,
        }))

        const { error } = await supabase.from('subject_correlatives').insert(newCorrelatives)
        if (error) throw error
      }

      showToast('Correlativas guardadas correctamente.')
      load()
      setSelectedSubject(null)
    } catch (err) {
      showToast('Error al guardar correlativas.', 'error')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Correlativas</h1>
        <p className="text-gray-500 text-sm mt-1">Establece requisitos previos para cursar materias</p>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left: Programas y Materias */}
        <div className="col-span-1 space-y-4">
          <h2 className="font-bold text-gray-900 text-lg">Selecciona una materia</h2>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {programs.map(prog => (
              <div key={prog.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedProgram(expandedProgram === prog.name ? null : prog.name)}
                  className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors bg-gradient-to-r from-slate-50 to-slate-100"
                >
                  <span className="font-semibold text-gray-900 text-sm">{prog.name}</span>
                  <ChevronDown
                    size={18}
                    className={`text-gray-500 transition-transform ${expandedProgram === prog.name ? 'rotate-180' : ''}`}
                  />
                </button>

                {expandedProgram === prog.name && (
                  <div className="bg-white p-2 space-y-1 border-t border-gray-200">
                    {(subjectsByProgram[prog.name] || []).map(subject => (
                      <button
                        key={subject.id}
                        onClick={() => handleSelectSubject(subject.id, prog.name)}
                        className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                          selectedSubject === subject.id
                            ? 'bg-indigo-600 text-white font-semibold'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {subject.name}
                        <span className="text-xs opacity-75 ml-1">({subject.code})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Seleccionar Correlativas */}
        <div className="col-span-2">
          {selectedSubject ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
              <div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">
                  Selecciona correlativas requeridas
                </h3>
                <p className="text-sm text-gray-500">
                  Marca las materias que deben estar aprobadas para cursar esta materia
                </p>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {availableCorrelatives.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No hay otras materias disponibles</p>
                ) : (
                  availableCorrelatives.map(correlative => (
                    <label
                      key={correlative.id}
                      className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCorrelatives.has(correlative.id)}
                        onChange={() => handleToggleCorrelative(correlative.id)}
                        className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-2 focus:ring-indigo-500 mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm">{correlative.name}</p>
                        <p className="text-xs text-gray-500">
                          {correlative.code} • {correlative.program_name}
                        </p>
                      </div>
                    </label>
                  ))
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleSaveCorrelatives}
                  className="flex-1 bg-indigo-600 text-white font-semibold py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Guardar Correlativas
                </button>
                <button
                  onClick={() => setSelectedSubject(null)}
                  className="flex-1 bg-gray-200 text-gray-700 font-semibold py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-12 text-center">
              <p className="text-gray-500">Selecciona una materia para configurar sus correlativas</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
