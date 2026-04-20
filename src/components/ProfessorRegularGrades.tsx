import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { AlertCircle, Check } from 'lucide-react'

type RegularEnrollment = {
  enrollment_id: string
  student_name: string
  partial_grade: number
}

type Props = {
  subjectId: string
}

export function ProfessorRegularGrades({ subjectId }: Props) {
  const [regulars, setRegulars] = useState<RegularEnrollment[]>([])
  const [finalGrades, setFinalGrades] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [allowsPromotion, setAllowsPromotion] = useState(true)

  useEffect(() => {
    loadData()
  }, [subjectId])

  const loadData = async () => {
    try {
      // Obtener configuración
      const { data: settings } = await supabase
        .from('grade_settings')
        .select('allows_promotion')
        .eq('subject_id', subjectId)
        .single()

      if (settings) {
        setAllowsPromotion(settings.allows_promotion)
      }

      // Obtener regulares
      const { data: regularData } = await supabase
        .from('enrollment_grades')
        .select(`
          enrollment_id,
          partial_grade,
          final_grade,
          enrollments:enrollment_id (
            student:student_id (
              first_name,
              last_name
            )
          )
        `)
        .eq('partial_status', 'regular')
        .is('final_grade', null)

      if (regularData) {
        const formatted = regularData.map((r: any) => ({
          enrollment_id: r.enrollment_id,
          student_name: `${r.enrollments.student.first_name} ${r.enrollments.student.last_name}`,
          partial_grade: r.partial_grade,
          final_grade: r.final_grade,
        }))
        setRegulars(formatted)

        // Pre-cargar notas finales existentes
        const grades: Record<string, number> = {}
        formatted.forEach((r: any) => {
          if (r.final_grade) {
            grades[r.enrollment_id] = r.final_grade
          }
        })
        setFinalGrades(grades)
      }

      setLoading(false)
    } catch (err) {
      console.error('Error loading regulars:', err)
      setError('Error al cargar datos')
      setLoading(false)
    }
  }

  const getFinalStatus = (finalGrade: number): string => {
    if (finalGrade >= 8 && allowsPromotion) return 'promocionado'
    if (finalGrade >= 6) return 'aprobado'
    return 'desaprobado'
  }

  const handleSaveFinalGrades = async () => {
    setSaving(true)
    setError('')

    try {
      for (const enrollmentId in finalGrades) {
        const finalGrade = finalGrades[enrollmentId]
        const finalStatus = getFinalStatus(finalGrade)

        const { error: updateError } = await supabase
          .from('enrollment_grades')
          .update({
            final_grade: finalGrade,
            final_status: finalStatus,
          })
          .eq('enrollment_id', enrollmentId)

        if (updateError) {
          throw updateError
        }
      }

      alert('Notas finales guardadas correctamente')
      setFinalGrades({})
      await loadData()
    } catch (err) {
      console.error('Error saving final grades:', err)
      setError('Error al guardar notas finales: ' + String(err))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="card p-6 text-center">Cargando regulares...</div>
  }

  if (regulars.length === 0) {
    return (
      <div className="card p-6 text-center bg-blue-50 border border-blue-200">
        <p className="text-gray-600 font-medium">No hay estudiantes en condición Regular</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="card p-6 bg-amber-50 border border-amber-200">
        <h3 className="font-bold text-gray-900 mb-2">Carga de Notas Finales</h3>
        <p className="text-sm text-gray-700">
          Aquí puedes cargar las notas finales de los estudiantes en condición Regular
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex gap-2">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-amber-600 to-orange-600 text-white">
                <th className="px-4 py-3 text-left text-sm font-bold">Estudiante</th>
                <th className="px-4 py-3 text-center text-sm font-bold">Promedio Parcial</th>
                <th className="px-4 py-3 text-center text-sm font-bold">Nota Final</th>
                <th className="px-4 py-3 text-center text-sm font-bold">Estado Final</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {regulars.map((regular, idx) => {
                const finalGrade = finalGrades[regular.enrollment_id]
                const finalStatus = finalGrade ? getFinalStatus(finalGrade) : null

                return (
                  <tr key={regular.enrollment_id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 font-medium text-gray-900">{regular.student_name}</td>
                    <td className="px-4 py-3 text-center font-bold text-gray-700">
                      {regular.partial_grade.toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={finalGrade ?? ''}
                        onChange={e => {
                          const value = e.target.value
                          if (value === '') {
                            setFinalGrades(prev => {
                              const newGrades = { ...prev }
                              delete newGrades[regular.enrollment_id]
                              return newGrades
                            })
                          } else {
                            setFinalGrades(prev => ({
                              ...prev,
                              [regular.enrollment_id]: parseFloat(value),
                            }))
                          }
                        }}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm"
                        placeholder="-"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      {finalStatus && (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
                            finalStatus === 'promocionado'
                              ? 'bg-green-100 text-green-700'
                              : finalStatus === 'aprobado'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {(finalStatus === 'promocionado' || finalStatus === 'aprobado') && (
                            <Check size={14} />
                          )}
                          {finalStatus.charAt(0).toUpperCase() + finalStatus.slice(1)}
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
        onClick={handleSaveFinalGrades}
        disabled={saving || Object.keys(finalGrades).length === 0}
        className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:shadow-lg text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50"
      >
        {saving ? 'Guardando...' : 'Guardar Notas Finales'}
      </button>
    </div>
  )
}
