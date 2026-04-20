import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { AlertCircle, Check, X } from 'lucide-react'

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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  // Filtrar: solo mostrar alumnos sin calificaciones finales (en curso)
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
      // Obtener todos los enrollments con sus calificaciones
      const enrollmentIds = enrollments.map(e => e.id)
      
      if (enrollmentIds.length === 0) {
        setActiveEnrollments([])
        return
      }

      const { data: gradesData } = await supabase
        .from('enrollment_grades')
        .select('enrollment_id, partial_status')
        .in('enrollment_id', enrollmentIds)

      // Crear set de enrollments que tienen calificaciones finales
      const completedEnrollmentIds = new Set<string>()
      if (gradesData) {
        gradesData.forEach(g => {
          // Si tiene partial_status (tiene notas), lo consideramos "procesado"
          if (g.partial_status) {
            completedEnrollmentIds.add(g.enrollment_id)
          }
        })
      }

      // Filtrar: mostrar solo los que NO tienen calificaciones
      const active = enrollments.filter(e => !completedEnrollmentIds.has(e.id))
      setActiveEnrollments(active)
    } catch (err) {
      console.error('Error filtering enrollments:', err)
      setActiveEnrollments(enrollments)
    }
  }

  const calculatePartialGrade = (enrollmentId: string): number | null => {
    const enrollmentGrades = grades[enrollmentId] || {}
    const gradeValues: number[] = []

    for (let i = 1; i <= numGrades; i++) {
      const grade = enrollmentGrades[`grade_${i}` as keyof GradeData]
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

  const getPartialStatus = (partialGrade: number): string => {
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
      for (const enrollment of activeEnrollments) {
        const partialGrade = calculatePartialGrade(enrollment.id)

        if (partialGrade === null) continue

        const partialStatus = getPartialStatus(partialGrade)

        const payload = {
          enrollment_id: enrollment.id,
          grade_1: grades[enrollment.id]?.grade_1 || null,
          grade_2: grades[enrollment.id]?.grade_2 || null,
          grade_3: grades[enrollment.id]?.grade_3 || null,
          grade_4: grades[enrollment.id]?.grade_4 || null,
          grade_5: grades[enrollment.id]?.grade_5 || null,
          grade_6: grades[enrollment.id]?.grade_6 || null,
          partial_grade: partialGrade,
          partial_status: partialStatus,
          attempt_number: 1,
        }

        const { error: upsertError } = await supabase
          .from('enrollment_grades')
          .upsert(payload)

        if (upsertError) {
          console.error('Error saving grade for', enrollment.id, upsertError)
          setError(`Error al guardar nota de ${enrollment.student_name}`)
          setSaving(false)
          return
        }
      }

      setError('')
      setGrades({})
      alert('Calificaciones guardadas correctamente')
      // Recargar la lista de alumnos activos
      await filterActiveEnrollments()
    } catch (err) {
      setError('Error al guardar: ' + String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Configuración */}
      <div className="card p-6 bg-blue-50 border border-blue-200">
        <h3 className="font-bold text-gray-900 mb-4">Configuración de Notas</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Cantidad de notas a usar (1-6)
            </label>
            <select
              value={numGrades}
              onChange={e => setNumGrades(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              disabled
            >
              {[1, 2, 3, 4, 5, 6].map(n => (
                <option key={n} value={n}>
                  {n} nota{n > 1 ? 's' : ''}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-600 mt-1">Configurado en la materia</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Promoción
            </label>
            <div className="flex items-center gap-2 mt-4">
              {allowsPromotion ? (
                <>
                  <Check size={20} className="text-green-600" />
                  <span className="text-sm font-bold text-green-700">Permite Promocional (≥8)</span>
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

      {/* Tabla de carga */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex gap-2">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {activeEnrollments.length === 0 ? (
        <div className="card p-6 text-center bg-blue-50 border border-blue-200">
          <p className="text-gray-600 font-medium">
            ✓ Todos los alumnos tienen calificaciones cargadas o no hay alumnos inscriptos
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
                        {Array.from({ length: numGrades }, (_, i) => (
                          <td key={i + 1} className="px-4 py-3 text-center">
                            <input
                              type="number"
                              min="0"
                              max="10"
                              step="0.1"
                              value={grades[enrollment.id]?.[`grade_${i + 1}` as keyof GradeData] ?? ''}
                              onChange={e => handleGradeChange(enrollment.id, i + 1, e.target.value)}
                              className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm"
                              placeholder="-"
                            />
                          </td>
                        ))}
                        <td className="px-4 py-3 text-center font-bold text-gray-900">
                          {partialGrade !== null ? partialGrade.toFixed(1) : '-'}
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
            disabled={saving}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar Calificaciones'}
          </button>
        </>
      )}
    </div>
  )
}
