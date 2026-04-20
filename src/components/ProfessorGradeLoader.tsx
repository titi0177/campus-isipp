import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { AlertCircle, Check, X, Save } from 'lucide-react'

type Enrollment = {
  id: string
  student_id: string
  student_name: string
  subject_id: string
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

type Props = {
  enrollments: Enrollment[]
  subjectId: string
}

export function ProfessorGradeLoader({ enrollments, subjectId }: Props) {
  const [numGrades, setNumGrades] = useState(3)
  const [allowsPromotion, setAllowsPromotion] = useState(false)
  const [grades, setGrades] = useState<Record<string, GradeData>>({})
  const [existingGrades, setExistingGrades] = useState<Record<string, GradeData>>({})
  const [existingIds, setExistingIds] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [savingStudents, setSavingStudents] = useState<Set<string>>(new Set())
  const [activeEnrollments, setActiveEnrollments] = useState<Enrollment[]>([])

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

      // Obtener TODAS las calificaciones (incluso sin final_status) para cada inscripción
      const { data: gradesData, error: gradesError } = await supabase
        .from('enrollment_grades')
        .select('id, enrollment_id, grade_1, grade_2, grade_3, grade_4, grade_5, grade_6, partial_grade, partial_status, final_status')
        .in('enrollment_id', enrollmentIds)
      
      if (gradesError) {
        console.error('Error fetching enrollment_grades:', gradesError)
        setError(`Permiso denegado. Contacta al administrador. Error: ${gradesError.message}`)
        // Si hay error de permisos, mostrar todos los alumnos de todas formas para carga inicial
        setActiveEnrollments(enrollments)
        setExistingGrades({})
        setExistingIds({})
        return
      }

      const existingGradesMap: Record<string, GradeData> = {}
      const existingIdsMap: Record<string, string> = {}
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
          
          // Marcar como completado si tiene final_status de desaprobado o promocionado
          if (g.final_status && ['desaprobado', 'promocionado'].includes(g.final_status)) {
            completedEnrollmentIds.add(g.enrollment_id)
          }
        })
      }

      setExistingGrades(existingGradesMap)
      setExistingIds(existingIdsMap)

      // Mostrar TODOS los alumnos EXCEPTO los que ya tienen final_status = desaprobado o promocionado
      const active = enrollments.filter(e => !completedEnrollmentIds.has(e.id))
      setActiveEnrollments(active)
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

  const calculatePartialGrade = (enrollmentId: string): number | null => {
    const gradeValues: number[] = []

    for (let i = 1; i <= numGrades; i++) {
      const grade = getDisplayGrade(enrollmentId, i)
      if (grade !== undefined && grade !== null) {
        gradeValues.push(grade as number)
      }
    }

    if (gradeValues.length === numGrades) {
      const sum = gradeValues.reduce((a, b) => a + b, 0)
      return Math.round((sum / numGrades) * 10) / 10
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

  const handleSaveGrades = async () => {
    setSaving(true)
    setError('')

    try {
      let savedCount = 0

      for (const enrollment of activeEnrollments) {
        // Verificar si hay cambios para este alumno
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

        // Construir el payload con todas las notas
        const payload: any = {
          enrollment_id: enrollment.id,
        }

        // Agregar notas nuevas o mantener existentes
        for (let i = 1; i <= numGrades; i++) {
          const gradeKey = `grade_${i}` as keyof GradeData
          const newGrade = grades[enrollment.id]?.[gradeKey]
          const existingGrade = existingGrades[enrollment.id]?.[gradeKey]
          payload[gradeKey] = newGrade !== undefined ? newGrade : existingGrade
        }

        // Calcular promedio solo si todas las notas están completas
        const partialGrade = calculatePartialGrade(enrollment.id)
        if (partialGrade !== null) {
          payload.partial_grade = partialGrade
          const partialStatus = getPartialStatus(partialGrade)
          payload.partial_status = partialStatus

          // Si es Desaprobado o Promocionado, pasar automáticamente como nota final
          if (partialStatus === 'desaprobado' || partialStatus === 'promocionado') {
            payload.final_grade = partialGrade
            payload.final_status = partialStatus
          }
        }
        payload.attempt_number = 1

        // Verificar si el registro ya existe
        const existingId = existingIds[enrollment.id]
        let result

        if (existingId) {
          // Si existe, actualizar
          result = await supabase
            .from('enrollment_grades')
            .update(payload)
            .eq('id', existingId)
        } else {
          // Si no existe, insertar
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
      alert(`${savedCount} calificacion${savedCount !== 1 ? 'es' : ''} guardada${savedCount !== 1 ? 's' : ''} correctamente`)
      await filterActiveEnrollments()
    } catch (err) {
      setError('Error al guardar: ' + String(err))
    } finally {
      setSaving(false)
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

      {/* Info Box */}
      <div className="card p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200">
        <h3 className="font-bold text-emerald-900 mb-2">Carga Flexible y Progresiva</h3>
        <ul className="text-sm text-emerald-900 space-y-1">
          <li>Lunes: Carga la Nota 1 (ej: 8) y guarda - quedara registrada</li>
          <li>Vuelves en 2 semanas: Veras la Nota 1: 8 ya cargada, luego anade Nota 2 y 3</li>
          <li>Promedio 8 o mas (Promocionado): Se guarda automaticamente como nota final</li>
          <li>Promedio menor a 6 (Desaprobado): Se guarda automaticamente como nota final</li>
          <li>Promedio 6-7 (Regular): Va a la seccion Notas Finales para examen</li>
        </ul>
      </div>

      {/* Tabla de carga */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex gap-2">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Error de Permisos (403)</p>
            <p className="text-xs mt-1">{error}</p>
            <p className="text-xs mt-2">Por favor, ejecuta las migraciones SQL en Supabase para permitir el acceso a calificaciones.</p>
          </div>
        </div>
      )}

      {activeEnrollments.length === 0 ? (
        <div className="card p-6 text-center bg-blue-50 border border-blue-200">
          <p className="text-gray-600 font-medium">
            Todos los alumnos tienen calificaciones completas y finalizadas
          </p>
        </div>
      ) : (
        <>
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                    <th className="px-4 py-3 text-left text-sm font-bold">Estudiante</th>
                    {Array.from({ length: numGrades }, (_, i) => (
                      <th key={i + 1} className="px-4 py-3 text-center text-sm font-bold">
                        Nota {i + 1}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-center text-sm font-bold">Promedio</th>
                    <th className="px-4 py-3 text-center text-sm font-bold">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {activeEnrollments.map((enrollment, idx) => {
                    const partialGrade = calculatePartialGrade(enrollment.id)
                    const partialStatus = partialGrade ? getPartialStatus(partialGrade) : null

                    return (
                      <tr key={enrollment.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3 font-medium text-gray-900">{enrollment.student_name}</td>
                        {Array.from({ length: numGrades }, (_, i) => {
                          const gradeValue = getDisplayGrade(enrollment.id, i + 1)
                          const hasExisting = existingGrades[enrollment.id]?.[`grade_${i + 1}` as keyof GradeData] !== undefined
                          return (
                            <td key={i + 1} className="px-4 py-3 text-center">
                              <input
                                type="number"
                                min="0"
                                max="10"
                                step="0.1"
                                value={gradeValue ?? ''}
                                onChange={e => handleGradeChange(enrollment.id, i + 1, e.target.value)}
                                className={`w-16 px-2 py-1 border rounded text-center text-sm font-medium ${
                                  hasExisting && !grades[enrollment.id]?.[`grade_${i + 1}` as keyof GradeData]
                                    ? 'border-green-500 bg-green-50'
                                    : 'border-gray-300'
                                }`}
                                placeholder="-"
                              />
                            </td>
                          )
                        })}
                        <td className="px-4 py-3 text-center font-bold text-gray-900">
                          {partialGrade !== null && partialGrade !== undefined ? partialGrade.toFixed(1) : '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
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
                              {partialStatus === 'promocionado' && <Check size={14} />}
                              {partialStatus === 'desaprobado' && <X size={14} />}
                              {partialStatus === 'promocionado'
                                ? 'Prom.'
                                : partialStatus === 'regular'
                                  ? 'Regular'
                                  : 'Desapr.'}
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <button
            onClick={handleSaveGrades}
            disabled={saving || !hasAnyGrade}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Save size={20} />
            {saving ? 'Guardando...' : 'Guardar Notas'}
          </button>

          <p className="text-xs text-center text-gray-600 mt-2">
            Guarda tus cambios cuando agregues nuevas notas. Las notas se mantienen registradas para futuras ediciones.
          </p>
        </>
      )}
    </div>
  )
}
