import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { Plus, Trash2, ChevronDown, Eye, X } from 'lucide-react'

export const Route = createFileRoute('/admin/correlatives')({
  component: CorrelativesPage,
})

interface CorrelativeEntry {
  requires_subject_id: string
  required_status: 'aprobado' | 'regular' | 'any'
}

interface CorrelativeWithStatus {
  id: string
  requires_subject_id: string
  required_status: 'aprobado' | 'regular' | 'any'
}

interface SubjectWithCorrelatives {
  id: string
  name: string
  code: string
  program_id: string
  program_name: string
  correlatives: CorrelativeWithStatus[]
}

function CorrelativesPage() {
  const [programs, setPrograms] = useState<any[]>([])
  const [subjectsByProgram, setSubjectsByProgram] = useState<Record<string, SubjectWithCorrelatives[]>>({})
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
  const [availableCorrelatives, setAvailableCorrelatives] = useState<SubjectWithCorrelatives[]>([])
  // Cambio clave: Array en lugar de Map para permitir múltiples entradas por materia
  const [selectedCorrelatives, setSelectedCorrelatives] = useState<CorrelativeEntry[]>([])
  const [expandedProgram, setExpandedProgram] = useState<string | null>(null)
  const [expandedViewProgram, setExpandedViewProgram] = useState<string | null>(null)
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

      // Cargar materias con sus correlativas (incluyendo required_status)
      const { data: correlativesData } = await supabase
        .from('subject_correlatives')
        .select('id, subject_id, requires_subject_id, required_status')

      const corrMap = new Map<string, CorrelativeWithStatus[]>()
      correlativesData?.forEach(c => {
        if (!corrMap.has(c.subject_id)) corrMap.set(c.subject_id, [])
        corrMap.get(c.subject_id)?.push({
          id: c.id,
          requires_subject_id: c.requires_subject_id,
          required_status: c.required_status || 'aprobado',
        })
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

    // Obtener materias disponibles como correlativas
    const available = (subjectsByProgram[programName] || [])
      .filter(s => s.id !== subjectId)
      .map(s => ({
        id: s.id,
        requires_subject_id: s.id,
        required_status: 'aprobado' as const,
      }))

    setAvailableCorrelatives(available)

    // Cargar correlativas actuales de esta materia (como Array)
    const subject = (subjectsByProgram[programName] || [])
      .find(s => s.id === subjectId)

    // Convertir correlativas a Array (permite múltiples por materia)
    const corrArray: CorrelativeEntry[] = subject?.correlatives.map(c => ({
      requires_subject_id: c.requires_subject_id,
      required_status: c.required_status,
    })) || []

    setSelectedCorrelatives(corrArray)
  }

  // Agregar un nuevo requisito (puede ser la misma materia con diferente status)
  const handleAddCorrelative = (correlativeId: string, status: 'aprobado' | 'regular' | 'any') => {
    setSelectedCorrelatives([
      ...selectedCorrelatives,
      {
        requires_subject_id: correlativeId,
        required_status: status,
      },
    ])
  }

  // Remover un requisito específico por índice
  const handleRemoveCorrelative = (index: number) => {
    setSelectedCorrelatives(selectedCorrelatives.filter((_, i) => i !== index))
  }

  // Cambiar status de un requisito específico
  const handleChangeStatus = (index: number, status: 'aprobado' | 'regular' | 'any') => {
    const updated = [...selectedCorrelatives]
    updated[index].required_status = status
    setSelectedCorrelatives(updated)
  }

  const handleSaveCorrelatives = async () => {
    if (!selectedSubject) return

    try {
      // Eliminar correlativas actuales
      await supabase.from('subject_correlatives').delete().eq('subject_id', selectedSubject)

      // Insertar nuevas correlativas con required_status (permite múltiples)
      if (selectedCorrelatives.length > 0) {
        const newCorrelatives = selectedCorrelatives.map(entry => ({
          subject_id: selectedSubject,
          requires_subject_id: entry.requires_subject_id,
          required_status: entry.required_status,
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

  // Helper para obtener el nombre de una materia por ID
  const getSubjectName = (subjectId: string) => {
    for (const subjects of Object.values(subjectsByProgram)) {
      const subject = subjects.find(s => s.id === subjectId)
      if (subject) return subject.name
    }
    return 'Desconocida'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Correlativas</h1>
        <p className="text-gray-500 text-sm mt-1">Establece requisitos previos para cursar y rendir exámenes finales. Puedes asignar la misma materia con diferentes requisitos.</p>
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
                  Puedes agregar la misma materia múltiples veces con diferentes tipos de requisito
                </p>
              </div>

              {/* Correlativas seleccionadas */}
              {selectedCorrelatives.length > 0 && (
                <div className="space-y-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs font-semibold text-blue-900 mb-3">Requisitos configurados:</p>
                  {selectedCorrelatives.map((corr, idx) => {
                    const statusLabel = corr.required_status === 'aprobado' 
                      ? 'Aprobada' 
                      : corr.required_status === 'regular' 
                      ? 'Regularizada' 
                      : 'Sin restricción'
                    const statusColor = corr.required_status === 'aprobado' 
                      ? 'bg-red-100 text-red-800' 
                      : corr.required_status === 'regular' 
                      ? 'bg-amber-100 text-amber-800' 
                      : 'bg-gray-100 text-gray-800'

                    return (
                      <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border border-blue-200">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{getSubjectName(corr.requires_subject_id)}</p>
                          <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${statusColor}`}>
                            {statusLabel}
                          </span>
                        </div>
                        <button
                          onClick={() => handleRemoveCorrelative(idx)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Agregar nuevas correlativas */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-700">Agregar nuevo requisito:</p>
                {availableCorrelatives.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No hay otras materias disponibles</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {availableCorrelatives.map(correlative => (
                      <div key={correlative.requires_subject_id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <p className="font-medium text-gray-900 text-sm mb-2">{getSubjectName(correlative.requires_subject_id)}</p>
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => handleAddCorrelative(correlative.requires_subject_id, 'aprobado')}
                            className="px-2 py-1 text-xs bg-red-100 text-red-700 hover:bg-red-200 rounded font-semibold transition-colors"
                          >
                            + Aprobada
                          </button>
                          <button
                            onClick={() => handleAddCorrelative(correlative.requires_subject_id, 'regular')}
                            className="px-2 py-1 text-xs bg-amber-100 text-amber-700 hover:bg-amber-200 rounded font-semibold transition-colors"
                          >
                            + Regularizada
                          </button>
                          <button
                            onClick={() => handleAddCorrelative(correlative.requires_subject_id, 'any')}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 rounded font-semibold transition-colors"
                          >
                            + Sin restricción
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
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

      {/* Visualization Section */}
      <div className="mt-8 pt-8 border-t border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Eye size={20} className="text-gray-700" />
          <h2 className="font-bold text-gray-900 text-lg">Control Visual de Correlativas</h2>
        </div>

        <div className="space-y-3">
          {programs.map(prog => {
            const subjects = subjectsByProgram[prog.name] || []
            const subjectsWithCorrelatives = subjects.filter(s => s.correlatives.length > 0)

            return (
              <div key={prog.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedViewProgram(expandedViewProgram === prog.name ? null : prog.name)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors bg-gradient-to-r from-blue-50 to-blue-100"
                >
                  <div className="text-left">
                    <span className="font-semibold text-gray-900">{prog.name}</span>
                    <span className="text-xs text-gray-600 ml-2">
                      ({subjectsWithCorrelatives.length} materias con correlativas)
                    </span>
                  </div>
                  <ChevronDown
                    size={18}
                    className={`text-gray-500 transition-transform ${expandedViewProgram === prog.name ? 'rotate-180' : ''}`}
                  />
                </button>

                {expandedViewProgram === prog.name && (
                  <div className="bg-white p-4 space-y-3 border-t border-gray-200">
                    {subjects.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No hay materias en esta carrera</p>
                    ) : subjectsWithCorrelatives.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">
                        Ninguna materia tiene correlativas configuradas
                      </p>
                    ) : (
                      subjectsWithCorrelatives.map(subject => (
                        <div key={subject.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">{subject.name}</p>
                              <p className="text-xs text-gray-500">{subject.code}</p>
                            </div>
                          </div>
                          <div className="space-y-1">
                            {subject.correlatives.map((corr, idx) => {
                              const statusLabel = corr.required_status === 'aprobado' 
                                ? '(Aprobada)' 
                                : corr.required_status === 'regular' 
                                ? '(Regularizada)' 
                                : '(Sin restricción)'
                              
                              const statusColor = corr.required_status === 'aprobado' 
                                ? 'bg-red-100 text-red-800' 
                                : corr.required_status === 'regular' 
                                ? 'bg-amber-100 text-amber-800' 
                                : 'bg-gray-100 text-gray-800'

                              return (
                                <div key={idx} className="flex items-center gap-2 text-xs">
                                  <span className="font-medium text-gray-700">{getSubjectName(corr.requires_subject_id)}</span>
                                  <span className={`inline-flex px-2 py-0.5 rounded-full font-medium ${statusColor}`}>
                                    {statusLabel}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}