import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { AlertCircle, RotateCcw, Lock, Check, X } from 'lucide-react'

type FailedSubject = {
  id: string
  name: string
  code: string
  year: number
  dictation_type: string
  semester?: number
  final_grade: number
  final_status: string
  failed_year: number
  can_reinscribe: boolean
  reason: string
  is_already_reinscribed: boolean
  next_available_year?: number
}

type Props = {
  isOpen: boolean
  onClose: () => void
}

export function ReinscriptionModal({ isOpen, onClose }: Props) {
  const [failedSubjects, setFailedSubjects] = useState<FailedSubject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reinscribing, setReinscribing] = useState<string | null>(null)

  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1

  useEffect(() => {
    if (isOpen) {
      loadFailedSubjects()
    }
  }, [isOpen])

  const loadFailedSubjects = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!student) return

      const { data: failedData, error: err } = await supabase
        .from('enrollment_grades')
        .select(`
          final_grade,
          final_status,
          created_at,
          enrollment_id,
          enrollments!inner(
            id,
            student_id,
            subject_id,
            academic_year,
            is_recursive,
            subject:subjects(id, name, code, year, dictation_type, semester)
          )
        `)
        .eq('enrollments.student_id', student.id)
        .eq('final_status', 'desaprobado')

      if (err) {
        console.error('Error loading failed subjects:', err)
        setError('Error al cargar materias desaprobadas')
        setLoading(false)
        return
      }

      if (!failedData || failedData.length === 0) {
        setFailedSubjects([])
        setLoading(false)
        return
      }

      const { data: currentEnrollments } = await supabase
        .from('enrollments')
        .select('subject_id, academic_year')
        .eq('student_id', student.id)
        .eq('is_recursive', true)

      const currentRecursiveIds = new Set(
        currentEnrollments?.map(e => `${e.subject_id}_${e.academic_year}`) || []
      )

      const subjectMap = new Map<string, FailedSubject>()

      for (const record of failedData) {
        const subjectId = record.enrollments.subject_id
        const failedYear = new Date(record.created_at).getFullYear()
        const subject = record.enrollments.subject

        if (!subjectMap.has(subjectId)) {
          let canReinscribe = false
          let reason = ''
          let nextAvailableYear = null

          if (subject.dictation_type === 'anual') {
            // Anual: solo puede reinscribirse el año SIGUIENTE
            if (currentYear > failedYear) {
              canReinscribe = true
              reason = `Anual: puede reinscribirse en ${currentYear}`
            } else {
              canReinscribe = false
              nextAvailableYear = failedYear + 1
              reason = `Anual: solo disponible a partir de ${failedYear + 1}`
            }
          } else if (subject.dictation_type === 'cuatrimestral') {
            // Cuatrimestral: MISMO cuatrimestre, pero SIEMPRE el año SIGUIENTE
            const nextCuatYear = failedYear + 1
            const cuatLabel = subject.semester === 1 ? '1er cuatrimestre' : '2do cuatrimestre'
            
            if (currentYear === nextCuatYear) {
              // Está en el año correcto, ahora verificar si es el período correcto
              if (subject.semester === 1) {
                // 1er cuatrimestre: enero a junio
                if (currentMonth <= 6) {
                  canReinscribe = true
                  reason = `${cuatLabel} ${nextCuatYear}: disponible hasta junio`
                } else {
                  canReinscribe = false
                  nextAvailableYear = nextCuatYear + 1
                  reason = `${cuatLabel} ${nextCuatYear}: próximo disponible en enero ${nextCuatYear + 1}`
                }
              } else {
                // 2do cuatrimestre: julio a diciembre
                if (currentMonth >= 7) {
                  canReinscribe = true
                  reason = `${cuatLabel} ${nextCuatYear}: disponible desde julio`
                } else {
                  canReinscribe = false
                  nextAvailableYear = nextCuatYear + 1
                  reason = `${cuatLabel} ${nextCuatYear}: próximo disponible en julio ${nextCuatYear + 1}`
                }
              }
            } else if (currentYear < nextCuatYear) {
              // Aún no llega al año de reinscripción
              canReinscribe = false
              nextAvailableYear = nextCuatYear
              reason = `${cuatLabel}: disponible a partir de ${nextCuatYear}`
            } else {
              // Ya pasó el año de reinscripción (currentYear > nextCuatYear)
              canReinscribe = false
              nextAvailableYear = nextCuatYear + 1
              reason = `${cuatLabel}: próximo disponible en ${nextCuatYear + 1}`
            }
          } else {
            canReinscribe = true
            reason = 'Disponible para reinscribirse'
          }

          const isAlreadyReinscribed = currentRecursiveIds.has(`${subjectId}_${currentYear}`)

          subjectMap.set(subjectId, {
            id: subjectId,
            name: subject.name,
            code: subject.code,
            year: subject.year,
            dictation_type: subject.dictation_type || 'anual',
            semester: subject.semester || 1,
            final_grade: record.final_grade || 0,
            final_status: record.final_status,
            failed_year: failedYear,
            can_reinscribe: canReinscribe && !isAlreadyReinscribed,
            reason: isAlreadyReinscribed ? 'Ya reinscripto este año' : reason,
            is_already_reinscribed: isAlreadyReinscribed,
            next_available_year: nextAvailableYear,
          })
        }
      }

      const processed = Array.from(subjectMap.values()).sort((a, b) => {
        if (a.can_reinscribe !== b.can_reinscribe) {
          return a.can_reinscribe ? -1 : 1
        }
        return a.code.localeCompare(b.code)
      })

      setFailedSubjects(processed)
      setLoading(false)
    } catch (err) {
      console.error('Error:', err)
      setError('Error al cargar datos')
      setLoading(false)
    }
  }

  const handleReinscribe = async (subject: FailedSubject) => {
    setReinscribing(subject.id)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!student) return

      const result = await supabase.rpc('student_reinscribe_as_recursive', {
        p_student_id: student.id,
        p_subject_id: subject.id,
      })

      if (result.error) {
        setError(`Error: ${result.error.message}`)
        setReinscribing(null)
        return
      }

      const response = result.data as any
      if (!response || !response.success) {
        setError(`Error: ${response?.message || 'Error desconocido'}`)
        setReinscribing(null)
        return
      }

      alert(
        `Reinscripcion exitosa!\n\n` +
        `Materia: ${subject.code} - ${subject.name}\n` +
        `Condicion: Recursante (${subject.failed_year} → ${currentYear})\n` +
        `Estado: En curso`
      )

      await loadFailedSubjects()
    } catch (err) {
      console.error('Error:', err)
      setError('Error al reinscribirse: ' + String(err))
    } finally {
      setReinscribing(null)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Reinscripcion de Materias</h2>
            <p className="text-indigo-100 text-sm mt-1">Como Recursante</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex gap-2">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-200 border-t-indigo-600 mb-4"></div>
              <p className="text-slate-600">Cargando materias desaprobadas...</p>
            </div>
          ) : failedSubjects.length === 0 ? (
            <div className="text-center py-8 bg-green-50 border border-green-200 rounded-lg">
              <Check className="text-green-600 mx-auto mb-2" size={32} />
              <p className="text-green-700 font-medium">Felicidades! No tienes materias desaprobadas</p>
            </div>
          ) : (
            <>
              {failedSubjects.filter(s => s.can_reinscribe).length > 0 && (
                <div>
                  <h3 className="font-bold text-lg text-indigo-900 mb-3">Disponibles para Reinscribirse</h3>
                  <div className="space-y-2">
                    {failedSubjects
                      .filter(s => s.can_reinscribe)
                      .map((subject) => (
                        <div key={subject.id} className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{subject.code} - {subject.name}</p>
                            <p className="text-xs text-gray-600 mt-1">
                              Nota: {Number(subject.final_grade).toFixed(1)} | Desaprobado: {subject.failed_year}
                            </p>
                            <p className="text-xs text-green-700 font-semibold mt-1">{subject.reason}</p>
                          </div>
                          <button
                            onClick={() => handleReinscribe(subject)}
                            disabled={reinscribing === subject.id}
                            className="ml-3 flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded transition-colors disabled:opacity-50 whitespace-nowrap"
                          >
                            {reinscribing === subject.id ? (
                              <>
                                <div className="inline-block animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                                ...
                              </>
                            ) : (
                              <>
                                <RotateCcw size={14} />
                                Reinscribirse
                              </>
                            )}
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {failedSubjects.filter(s => !s.can_reinscribe).length > 0 && (
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-3">No disponibles actualmente</h3>
                  <div className="space-y-2">
                    {failedSubjects
                      .filter(s => !s.can_reinscribe)
                      .map((subject) => (
                        <div key={subject.id} className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">{subject.code} - {subject.name}</p>
                              <div className="mt-2 space-y-1">
                                <p className="text-xs text-gray-600">
                                  Nota: {Number(subject.final_grade).toFixed(1)} | Desaprobado: {subject.failed_year}
                                </p>
                                <p className="text-xs text-gray-600 flex items-center gap-1">
                                  <Lock size={12} />
                                  {subject.reason}
                                </p>
                                {subject.next_available_year && (
                                  <p className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded mt-2 inline-block">
                                    Disponible a partir de {subject.next_available_year}
                                  </p>
                                )}
                              </div>
                            </div>
                            <button disabled className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-gray-300 text-gray-600 text-sm rounded cursor-not-allowed">
                              <Lock size={14} />
                              No disponible
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
            <p className="font-bold mb-2">Cómo funciona la reinscripción</p>
            <ul className="text-xs space-y-1">
              <li>• <strong>Anuales:</strong> Solo el año siguiente al desaprobado (ej: desaprobado 2024 → reinscribirse 2025)</li>
              <li>• <strong>Cuatrimestrales:</strong> Mismo cuatrimestre, pero año siguiente (ej: desaprobado 1er C 2024 → reinscribirse 1er C 2025)</li>
              <li>• Se registrara como recursante (2do intento) en el sistema</li>
              <li>• No se pierden tus calificaciones del primer intento</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t p-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
