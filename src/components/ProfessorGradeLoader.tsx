import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { AlertCircle, Check, X, Save, Lock, RotateCcw, Download } from 'lucide-react'

type Enrollment = {
  id: string
  student_id: string
  student_name: string
  subject_id: string
  division?: 'A' | 'B' | null
}

type GradeData = {
  grade_1?: number
  grade_2?: number
  grade_3?: number
  grade_4?: number
  grade_5?: number
  grade_6?: number
  partial_grade?: number
  partial_status?: string
}

type GradeLabel = 'Parcial 1' | 'Parcial 2' | 'Parcial 3' | 'Parcial 4' | 'TP 1' | 'TP 2' | 'Recuperatorio P1' | 'Recuperatorio P2' | 'Recuperatorio P3' | 'Recuperatorio P4' | 'Recuperatorio TP1' | 'Recuperatorio TP2'

type Props = {
  enrollments: Enrollment[]
  subjectId: string
}

const AVAILABLE_LABELS: GradeLabel[] = [
  'Parcial 1', 'Parcial 2', 'Parcial 3', 'Parcial 4',
  'TP 1', 'TP 2',
  'Recuperatorio P1', 'Recuperatorio P2', 'Recuperatorio P3', 'Recuperatorio P4',
  'Recuperatorio TP1', 'Recuperatorio TP2'
]

export function ProfessorGradeLoader({ enrollments, subjectId }: Props) {
  const [numGrades, setNumGrades] = useState(3)
  const [allowsPromotion, setAllowsPromotion] = useState(false)
  const [selectedDivision, setSelectedDivision] = useState<'A' | 'B' | null>(null)
  const [grades, setGrades] = useState<Record<string, GradeData>>({})
  const [gradeLabels, setGradeLabels] = useState<Record<string, Record<number, GradeLabel>>>({})
  const [existingGrades, setExistingGrades] = useState<Record<string, GradeData>>({})
  const [existingLabels, setExistingLabels] = useState<Record<string, Record<number, GradeLabel>>>({})
  const [existingIds, setExistingIds] = useState<Record<string, string>>({})
  const [existingFinalizationStatus, setExistingFinalizationStatus] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [closing, setClosing] = useState(false)
  const [savingStudents, setSavingStudents] = useState<Set<string>>(new Set())
  const [activeEnrollments, setActiveEnrollments] = useState<Enrollment[]>([])
  const [selectedGradesForAveraging, setSelectedGradesForAveraging] = useState<Record<string, Set<number>>>({})
  const [showAveragingSelection, setShowAveragingSelection] = useState(false)
  const [undoing, setUndoing] = useState(false)
  const [undoingStudent, setUndoingStudent] = useState<string | null>(null)

  useEffect(() => {
    loadSubjectSettings()
    filterActiveEnrollments()
  }, [subjectId, enrollments])

  const loadSubjectSettings = async () => {
    try {
      const { data, error: err } = await supabase
        .from('subjects')
        .select('num_grades, allows_promotion')
        .eq('id', subjectId)
        .single()

      if (err) {
        console.error('Error loading subject settings:', err)
        return
      }

      if (data) {
        setNumGrades(data.num_grades || 3)
        setAllowsPromotion(data.allows_promotion || false)
      }
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const filterActiveEnrollments = async () => {
    try {
      const enrollmentIds = enrollments.map(e => e.id)

      if (enrollmentIds.length === 0) {
        setActiveEnrollments([])
        return
      }

      setError('')

      const { data: gradesData, error: gradesError } = await supabase
        .from('enrollment_grades')
        .select('id, enrollment_id, grade_1, grade_2, grade_3, grade_4, grade_5, grade_6, partial_grade, partial_status, final_status, final_grade, grade_labels, partial_finalized')
        .in('enrollment_id', enrollmentIds)

      if (gradesError) {
        console.error('Error fetching enrollment_grades:', gradesError)
        setError(`Permiso denegado. Contacta al administrador. Error: ${gradesError.message}`)
        setActiveEnrollments(enrollments)
        setExistingGrades({})
        setExistingIds({})
        return
      }

      const existingGradesMap: Record<string, GradeData> = {}
      const existingLabelsMap: Record<string, Record<number, GradeLabel>> = {}
      const existingIdsMap: Record<string, string> = {}
      const finalizationStatusMap: Record<string, boolean> = {}
      const completedEnrollmentIds = new Set<string>()

      if (gradesData && gradesData.length > 0) {
        gradesData.forEach(g => {
          existingGradesMap[g.enrollment_id] = {
            grade_1: g.grade_1 || undefined,
            grade_2: g.grade_2 || undefined,
            grade_3: g.grade_3 || undefined,
            grade_4: g.grade_4 || undefined,
            grade_5: g.grade_5 || undefined,
            grade_6: g.grade_6 || undefined,
            partial_grade: g.partial_grade || undefined,
            partial_status: g.partial_status || undefined,
          }
          existingIdsMap[g.enrollment_id] = g.id
          finalizationStatusMap[g.enrollment_id] = g.partial_finalized || false

          // Parsear labels si existen
          if (g.grade_labels) {
            try {
              const labelsObj = typeof g.grade_labels === 'string' ? JSON.parse(g.grade_labels) : g.grade_labels
              const labelsMap: Record<number, GradeLabel> = {}
              Object.entries(labelsObj).forEach(([key, value]) => {
                if (value) {
                  const gradeNum = parseInt(key.replace('grade_', ''))
                  labelsMap[gradeNum] = value as GradeLabel
                }
              })
              existingLabelsMap[g.enrollment_id] = labelsMap
            } catch (e) {
              console.error('Error parsing grade labels:', e)
              existingLabelsMap[g.enrollment_id] = {}
            }
          }

          if (g.final_grade !== null && g.final_grade !== undefined) {
            completedEnrollmentIds.add(g.enrollment_id)
          }
        })
      }

      setExistingGrades(existingGradesMap)
      setExistingLabels(existingLabelsMap)
      setExistingIds(existingIdsMap)
      setExistingFinalizationStatus(finalizationStatusMap)

      const active = enrollments.filter(e => !completedEnrollmentIds.has(e.id))
      setActiveEnrollments(active)
      setSelectedDivision(null)
    } catch (err) {
      console.error('Error in filterActiveEnrollments:', err)
      setError('Error inesperado al cargar calificaciones: ' + String(err))
      setActiveEnrollments(enrollments)
    }
  }

  const getDisplayGrade = (enrollmentId: string, gradeNum: number): number | undefined => {
    const newGrade = grades[enrollmentId]?.[`grade_${gradeNum}` as keyof GradeData]
    if (newGrade !== undefined && newGrade !== null) return newGrade
    return existingGrades[enrollmentId]?.[`grade_${gradeNum}` as keyof GradeData]
  }

  const getGradeLabel = (enrollmentId: string, gradeNum: number): GradeLabel | undefined => {
    return gradeLabels[enrollmentId]?.[gradeNum] || existingLabels[enrollmentId]?.[gradeNum]
  }

  const calculatePartialGradeWithSelection = (enrollmentId: string, selectedIndices: Set<number>): number | null => {
    const gradeValues: number[] = []

    selectedIndices.forEach(i => {
      const grade = getDisplayGrade(enrollmentId, i)
      if (grade !== undefined && grade !== null) {
        const label = getGradeLabel(enrollmentId, i)
        if (label && label.startsWith('Recuperatorio')) {
          const mainType = label.replace('Recuperatorio ', '')
          const mainGradeNum = Array.from({ length: numGrades }, (_, idx) => idx + 1).find(n => {
            const mainLabel = getGradeLabel(enrollmentId, n)
            return mainLabel === mainType
          })

          if (mainGradeNum) {
            const mainGrade = getDisplayGrade(enrollmentId, mainGradeNum)
            if (mainGrade !== undefined && mainGrade !== null && grade > mainGrade) {
              gradeValues.push(grade)
            } else if (mainGrade !== undefined && mainGrade !== null) {
              gradeValues.push(mainGrade)
            }
          } else {
            gradeValues.push(grade)
          }
        } else {
          gradeValues.push(grade)
        }
      }
    })

    if (gradeValues.length === selectedIndices.size) {
      const sum = gradeValues.reduce((a, b) => a + b, 0)
      return Math.round((sum / selectedIndices.size) * 10) / 10
    }

    return null
  }

  const getPartialStatus = (partialGrade: number | null): string | null => {
    if (partialGrade === null) return null
    if (partialGrade >= 8 && allowsPromotion) return 'promocionado'
    if (partialGrade >= 6) return 'regular'
    return 'desaprobado'
  }

  const handleGradeChange = (enrollmentId: string, gradeNum: number, value: string) => {
    const numValue = value === '' ? null : parseFloat(value)
    setGrades(prev => ({
      ...prev,
      [enrollmentId]: {
        ...prev[enrollmentId],
        [`grade_${gradeNum}`]: numValue,
      },
    }))
  }

  const handleLabelChange = (enrollmentId: string, gradeNum: number, label: GradeLabel) => {
    setGradeLabels(prev => ({
      ...prev,
      [enrollmentId]: {
        ...(prev[enrollmentId] || {}),
        [gradeNum]: label,
      },
    }))
  }

  const handleToggleGradeSelection = (enrollmentId: string, gradeNum: number) => {
    setSelectedGradesForAveraging(prev => {
      const current = prev[enrollmentId] || new Set<number>()
      const updated = new Set(current)
      if (updated.has(gradeNum)) {
        updated.delete(gradeNum)
      } else {
        updated.add(gradeNum)
      }
      return {
        ...prev,
        [enrollmentId]: updated,
      }
    })
  }

  const handleUndoFinalize = async (enrollmentId: string) => {
    setUndoing(true)
    setUndoingStudent(enrollmentId)
    setError('')

    try {
      const existingId = existingIds[enrollmentId]
      if (!existingId) {
        setError('No se encontró el registro de calificaciones')
        setUndoing(false)
        setUndoingStudent(null)
        return
      }

      const { data, error: rpcError } = await supabase.rpc('undo_finalize_grades', {
        p_enrollment_grade_id: existingId,
      })

      if (rpcError) {
        setError(`Error al deshacer: ${rpcError.message}`)
        setUndoing(false)
        setUndoingStudent(null)
        return
      }

      if (data?.success) {
        alert('Cierre de notas deshecho. Ahora puedes editar las notas nuevamente.')
        await filterActiveEnrollments()
      } else {
        setError(data?.message || 'Error desconocido')
      }
    } catch (err) {
      setError('Error al deshacer: ' + String(err))
    } finally {
      setUndoing(false)
      setUndoingStudent(null)
    }
  }

  const handleSaveGrades = async () => {
    setSaving(true)
    setError('')

    try {
      let savedCount = 0
      const enrollmentsToSave = selectedDivision
        ? activeEnrollments.filter(e => e.division === selectedDivision)
        : activeEnrollments

      for (const enrollment of enrollmentsToSave) {
        let hasChanges = false
        for (let i = 1; i <= numGrades; i++) {
          const newGrade = grades[enrollment.id]?.[`grade_${i}` as keyof GradeData]
          if (newGrade !== undefined && newGrade !== null) {
            hasChanges = true
            break
          }
        }

        if (!hasChanges) continue

        setSavingStudents(prev => new Set(prev).add(enrollment.id))

        const payload: any = {
          enrollment_id: enrollment.id,
        }

        for (let i = 1; i <= numGrades; i++) {
          const gradeKey = `grade_${i}` as keyof GradeData
          const newGrade = grades[enrollment.id]?.[gradeKey]
          const existingGrade = existingGrades[enrollment.id]?.[gradeKey]
          payload[gradeKey] = newGrade !== undefined ? newGrade : existingGrade
        }

        const labelsObj: Record<string, GradeLabel | null> = {}
        for (let i = 1; i <= numGrades; i++) {
          labelsObj[`grade_${i}`] = gradeLabels[enrollment.id]?.[i] || existingLabels[enrollment.id]?.[i] || null
        }
        payload.grade_labels = labelsObj

        payload.attempt_number = 1

        const existingId = existingIds[enrollment.id]
        let result

        if (existingId) {
          result = await supabase
            .from('enrollment_grades')
            .update(payload)
            .eq('id', existingId)
        } else {
          result = await supabase
            .from('enrollment_grades')
            .insert([payload])
        }

        if (result.error) {
          console.error('Error saving grade for', enrollment.id, result.error)
          setError(`Error al guardar nota de ${enrollment.student_name}: ${result.error.message}`)
          setSavingStudents(prev => {
            const updated = new Set(prev)
            updated.delete(enrollment.id)
            return updated
          })
          setSaving(false)
          return
        }

        savedCount++
        setSavingStudents(prev => {
          const updated = new Set(prev)
          updated.delete(enrollment.id)
          return updated
        })
      }

      setError('')
      setGrades({})
      alert(`${savedCount} calificacion${savedCount !== 1 ? 'es' : ''} guardada${savedCount !== 1 ? 's' : ''} correctamente. Las notas se han registrado sin calcular promedio aún.`)
      await filterActiveEnrollments()
    } catch (err) {
      setError('Error al guardar: ' + String(err))
    } finally {
      setSaving(false)
    }
  }

  const handleCloseNotes = async () => {
    if (!showAveragingSelection) {
      setShowAveragingSelection(true)
      return
    }

    setClosing(true)
    setError('')

    try {
      let closedCount = 0
      const enrollmentsToClose = selectedDivision
        ? activeEnrollments.filter(e => e.division === selectedDivision)
        : activeEnrollments

      for (const enrollment of enrollmentsToClose) {
        const selectedIndices = selectedGradesForAveraging[enrollment.id]
        if (!selectedIndices || selectedIndices.size === 0) {
          continue
        }

        const partialGrade = calculatePartialGradeWithSelection(enrollment.id, selectedIndices)
        if (partialGrade === null) {
          setError(`Error: No se puede calcular promedio para ${enrollment.student_name}. Verifica las notas seleccionadas.`)
          setClosing(false)
          return
        }

        const partialStatus = getPartialStatus(partialGrade)
        const existingId = existingIds[enrollment.id]

        const payload: any = {
          partial_grade: partialGrade,
          partial_status: partialStatus,
          partial_finalized: true,
          partial_finalized_at: new Date().toISOString(),
          selected_grades_for_averaging: Array.from(selectedIndices),
        }

        if (partialStatus === 'desaprobado' || partialStatus === 'promocionado') {
          payload.final_grade = partialGrade
          payload.final_status = partialStatus
        }

        let result

        if (existingId) {
          result = await supabase
            .from('enrollment_grades')
            .update(payload)
            .eq('id', existingId)
        } else {
          result = await supabase
            .from('enrollment_grades')
            .insert([{ enrollment_id: enrollment.id, ...payload }])
        }

        if (result.error) {
          console.error('Error closing notes for', enrollment.id, result.error)
          setError(`Error al cerrar notas de ${enrollment.student_name}: ${result.error.message}`)
          setClosing(false)
          return
        }

        closedCount++
      }

      alert(`${closedCount} calificacion${closedCount !== 1 ? 'es' : ''} finalizada${closedCount !== 1 ? 's' : ''}. Se han calculado los promedios con las notas seleccionadas.`)
      setShowAveragingSelection(false)
      setSelectedGradesForAveraging({})
      await filterActiveEnrollments()
    } catch (err) {
      setError('Error al cerrar notas: ' + String(err))
    } finally {
      setClosing(false)
    }
  }

  const hasAnyGrade = activeEnrollments.some(enrollment => {
    const enrollmentData = grades[enrollment.id]
    if (!enrollmentData) return false
    for (let i = 1; i <= numGrades; i++) {
      if (enrollmentData[`grade_${i}` as keyof GradeData] !== undefined && 
          enrollmentData[`grade_${i}` as keyof GradeData] !== null) {
        return true
      }
    }
    return false
  })

  const hasAllSelectionsForClosing = selectedDivision
    ? activeEnrollments.filter(e => e.division === selectedDivision).every(e => {
        const selected = selectedGradesForAveraging[e.id]
        return selected && selected.size > 0
      })
    : activeEnrollments.every(e => {
        const selected = selectedGradesForAveraging[e.id]
        return selected && selected.size > 0
      })

  const availableDivisions = Array.from(
    new Set(activeEnrollments.map(e => e.division).filter(Boolean))
  ).sort() as ('A' | 'B')[]

  const displayedEnrollments = selectedDivision
    ? activeEnrollments.filter(e => e.division === selectedDivision)
    : activeEnrollments

  return (
    <div className="space-y-6">
      {/* Configuración */}
      <div className="card p-6 bg-blue-50 border border-blue-200">
        <h3 className="font-bold text-gray-900 mb-4">Configuracion de Notas</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Cantidad de notas a usar (1-6)
            </label>
            <select
              value={numGrades}
              onChange={e => setNumGrades(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {[1, 2, 3, 4, 5, 6].map(n => (
                <option key={n} value={n}>
                  {n} nota{n > 1 ? 's' : ''}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-600 mt-1">Selecciona cuantas notas usaras esta clase</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Promocion
            </label>
            <div className="flex items-center gap-2 mt-4">
              {allowsPromotion ? (
                <>
                  <Check size={20} className="text-green-600" />
                  <span className="text-sm font-bold text-green-700">Permite Promocional (8 o mas)</span>
                </>
              ) : (
                <>
                  <X size={20} className="text-red-600" />
                  <span className="text-sm font-bold text-red-700">Sin Promocional</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Division Tabs */}
      {availableDivisions.length > 0 && (
        <div className="card p-4 bg-purple-50 border border-purple-200">
          <p className="text-xs font-semibold text-purple-700 mb-2">Filtrar por División:</p>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedDivision(null)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                selectedDivision === null
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-purple-700 border border-purple-300 hover:bg-purple-50'
              }`}
            >
              Todas
            </button>
            {availableDivisions.map(div => (
              <button
                key={div}
                onClick={() => setSelectedDivision(div)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                  selectedDivision === div
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-purple-700 border border-purple-300 hover:bg-purple-50'
                }`}
              >
                División {div}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="card p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200">
        <h3 className="font-bold text-emerald-900 mb-2">Flujo Nuevo de Carga</h3>
        <ul className="text-sm text-emerald-900 space-y-1">
          <li>1. Asigna un tipo a cada casilla (Parcial 1, TP, Recuperatorio P1, etc)</li>
          <li>2. Carga las notas con "Guardar Notas" - quedaran registradas sin promedio</li>
          <li>3. Cuando estes listo, presiona "Cerrar Notas" para seleccionar cuales usar</li>
          <li>4. El promedio se calcula SOLO con las notas seleccionadas</li>
          <li>5. Recuperatorios solo cuentan si son mayores a la nota original</li>
          <li>6. Si te equivocas, presiona "Deshacer" para volver a editar</li>
        </ul>
      </div>

      {/* Error Box */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex gap-2">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Error</p>
            <p className="text-xs mt-1">{error}</p>
          </div>
        </div>
      )}

      {displayedEnrollments.length === 0 ? (
        <div className="card p-6 text-center bg-blue-50 border border-blue-200">
          <p className="text-gray-600 font-medium">
            {selectedDivision ? `No hay alumnos en División ${selectedDivision} sin calificaciones completas` : 'Todos los alumnos tienen calificaciones completas y finalizadas'}
          </p>
        </div>
      ) : (
        <>
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                    <th className="px-3 py-2 text-left font-bold">Estudiante</th>
                    {Array.from({ length: numGrades }, (_, i) => (
                      <th key={i + 1} className="px-2 py-2 text-center font-bold text-xs">
                        Tipo
                      </th>
                    ))}
                    {Array.from({ length: numGrades }, (_, i) => (
                      <th key={`note_${i + 1}`} className="px-2 py-2 text-center font-bold text-xs">
                        Nota {i + 1}
                      </th>
                    ))}
                    <th className="px-2 py-2 text-center font-bold text-xs">Promedio</th>
                    <th className="px-2 py-2 text-center font-bold text-xs">Estado</th>
                    <th className="px-2 py-2 text-center font-bold text-xs">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {displayedEnrollments.map((enrollment, idx) => {
                    const selectedIndices = selectedGradesForAveraging[enrollment.id]
                    const partialGrade = selectedIndices && selectedIndices.size > 0 
                      ? calculatePartialGradeWithSelection(enrollment.id, selectedIndices)
                      : null
                    const partialStatus = partialGrade ? getPartialStatus(partialGrade) : null
                    const isFinalized = existingFinalizationStatus[enrollment.id]

                    return (
                      <tr key={enrollment.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-3 py-2 font-medium text-gray-900 text-xs">
                          {enrollment.student_name}
                          {enrollment.division && (
                            <span className="text-xs text-gray-500 ml-2">(Div. {enrollment.division})</span>
                          )}
                          {isFinalized && (
                            <span className="text-xs ml-2 px-2 py-1 bg-green-100 text-green-700 rounded-full inline-block">
                              <Lock size={10} className="inline mr-1" /> Finalizado
                            </span>
                          )}
                        </td>

                        {/* Tipo de cada nota */}
                        {Array.from({ length: numGrades }, (_, i) => {
                          const gradeNum = i + 1
                          return (
                            <td key={`type_${gradeNum}`} className="px-1 py-2 text-center">
                              <select
                                value={getGradeLabel(enrollment.id, gradeNum) || ''}
                                onChange={e => handleLabelChange(enrollment.id, gradeNum, e.target.value as GradeLabel)}
                                disabled={isFinalized}
                                className="w-full px-1 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
                              >
                                <option value="">-</option>
                                {AVAILABLE_LABELS.map(label => (
                                  <option key={label} value={label}>
                                    {label}
                                  </option>
                                ))}
                              </select>
                            </td>
                          )
                        })}

                        {/* Notas */}
                        {Array.from({ length: numGrades }, (_, i) => {
                          const gradeNum = i + 1
                          const gradeValue = getDisplayGrade(enrollment.id, gradeNum)
                          const hasExisting = existingGrades[enrollment.id]?.[`grade_${gradeNum}` as keyof GradeData] !== undefined
                          return (
                            <td key={`note_${gradeNum}`} className="px-2 py-2 text-center">
                              <input
                                type="number"
                                min="0"
                                max="10"
                                step="0.1"
                                value={gradeValue ?? ''}
                                onChange={e => handleGradeChange(enrollment.id, gradeNum, e.target.value)}
                                disabled={isFinalized}
                                className={`w-14 px-1 py-1 border rounded text-center text-sm font-medium ${
                                  hasExisting && !grades[enrollment.id]?.[`grade_${gradeNum}` as keyof GradeData]
                                    ? 'border-green-500 bg-green-50'
                                    : 'border-gray-300'
                                } disabled:opacity-50`}
                                placeholder="-"
                              />
                            </td>
                          )
                        })}

                        <td className="px-2 py-2 text-center font-bold text-gray-900 text-xs">
                          {partialGrade !== null && partialGrade !== undefined ? partialGrade.toFixed(1) : '-'}
                        </td>
                        <td className="px-2 py-2 text-center">
                          {partialStatus && (
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
                                partialStatus === 'promocionado'
                                  ? 'bg-green-100 text-green-700'
                                  : partialStatus === 'regular'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {partialStatus === 'promocionado' && <Check size={12} />}
                              {partialStatus === 'desaprobado' && <X size={12} />}
                              {partialStatus === 'promocionado'
                                ? 'Prom.'
                                : partialStatus === 'regular'
                                  ? 'Regular'
                                  : 'Desapr.'}
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-2 text-center">
                          {isFinalized && (
                            <button
                              onClick={() => handleUndoFinalize(enrollment.id)}
                              disabled={undoing || undoingStudent === enrollment.id}
                              className="px-2 py-1 bg-orange-100 text-orange-700 hover:bg-orange-200 rounded text-xs font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-1 mx-auto whitespace-nowrap"
                              title="Deshacer cierre para volver a editar"
                            >
                              <RotateCcw size={12} />
                              {undoingStudent === enrollment.id ? 'Deshaciendo...' : 'Deshacer'}
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handleSaveGrades}
              disabled={saving || !hasAnyGrade}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save size={20} />
              {saving ? 'Guardando...' : 'Guardar Notas'}
            </button>
            {displayedEnrollments.some(e => !existingFinalizationStatus[e.id]) && (
              <button
                onClick={handleCloseNotes}
                disabled={closing || !displayedEnrollments.some(e => getDisplayGrade(e.id, 1) !== undefined || getDisplayGrade(e.id, 2) !== undefined)}
                className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:shadow-lg text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Lock size={20} />
                {closing ? 'Finalizando...' : 'Cerrar Notas'}
              </button>
            )}
          </div>

          {/* Modal de selección de notas para promedio */}
          {showAveragingSelection && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto p-6">
                <h3 className="font-bold text-lg text-gray-900 mb-4">Selecciona las notas para calcular promedio</h3>
                <p className="text-sm text-gray-600 mb-4">Marca cuáles de estas notas deseas usar para el promedio parcial:</p>
                
                <div className="space-y-3 mb-6">
                  {displayedEnrollments.map(enrollment => (
                    <div key={enrollment.id} className="border rounded-lg p-3">
                      <p className="font-semibold text-sm mb-2">{enrollment.student_name}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {Array.from({ length: numGrades }, (_, i) => {
                          const gradeNum = i + 1
                          const gradeValue = getDisplayGrade(enrollment.id, gradeNum)
                          const label = getGradeLabel(enrollment.id, gradeNum)
                          const isSelected = selectedGradesForAveraging[enrollment.id]?.has(gradeNum) || false

                          if (gradeValue === undefined || gradeValue === null) {
                            return null
                          }

                          return (
                            <label key={`check_${gradeNum}`} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-100 rounded">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleGradeSelection(enrollment.id, gradeNum)}
                                className="w-4 h-4 rounded"
                              />
                              <span className="text-sm">
                                {label ? `${label}: ${gradeValue}` : `Nota ${gradeNum}: ${gradeValue}`}
                              </span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAveragingSelection(false)}
                    className="flex-1 bg-gray-300 text-gray-900 font-bold py-2 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCloseNotes}
                    disabled={!hasAllSelectionsForClosing || closing}
                    className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold py-2 rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {closing ? 'Finalizando...' : 'Confirmar y Cerrar Notas'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <p className="text-xs text-center text-gray-600 mt-2">
            Guardar Notas: Registra sin calcular promedio. Cerrar Notas: Selecciona cuáles usar y calcula el promedio final.
          </p>
        </>
      )}
    </div>
  )
}
