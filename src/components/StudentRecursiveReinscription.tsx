import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { AlertCircle, RotateCcw, Lock, Check } from 'lucide-react'

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
}

export function StudentRecursiveReinscription() {
  const [failedSubjects, setFailedSubjects] = useState<FailedSubject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reinscribing, setReinscribing] = useState<string | null>(null)

  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1

  useEffect(() => {
    loadFailedSubjects()
  }, [])

  const loadFailedSubjects = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!student) return

      // Obtener todas las materias en las que desaprobó (final_status = 'desaprobado')
      const { data: failedData, error: err } = await supabase
        .from('enrollment_grades')
        .select(`
          final_grade,
          final_status,
          partial_status,
          partial_grade,
          created_at,
          enrollment_id,
          enrollments!inner(
            id,
            student_id,
            subject_id,
            academic_year,
            attempt_number,
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

      // Obtener inscripciones actuales para detectar reinscripciones
      const { data: currentEnrollments } = await supabase
        .from('enrollments')
        .select('subject_id, academic_year')
        .eq('student_id', student.id)
        .eq('academic_year', currentYear)
        .eq('is_recursive', true)

      const currentRecursiveIds = new Set(
        currentEnrollments?.map(e => e.subject_id) || []
      )

      // Procesar y deduplicar (solo la más reciente de cada materia)
      const subjectMap = new Map<string, FailedSubject>()

      for (const record of failedData) {
        const subjectId = record.enrollments.subject_id
        const failedYear = new Date(record.created_at).getFullYear()
        const subject = record.enrollments.subject

        if (!subjectMap.has(subjectId)) {
          const failureYear = failedYear

          // Determinar si puede reinscribirse
          let canReinscribe = false
          let reason = ''

          if (subject.dictation_type === 'anual') {
            if (currentYear > failureYear) {
              canReinscribe = true
              reason = `Anual: puede reinscribirse en ${currentYear}`
            } else {
              canReinscribe = false
              reason = 'Anual: solo el próximo año'
            }
          } else if (subject.dictation_type === 'cuatrimestral') {
            if (subject.semester === 1 && currentMonth <= 6) {
              canReinscribe = true
              reason = '1er cuatrimestre: disponible hasta junio'
            } else if (subject.semester === 2 && currentMonth >= 7) {
              canReinscribe = true
              reason = '2do cuatrimestre: disponible desde julio'
            } else if (subject.semester === 1) {
              canReinscribe = false
              reason = '1er cuatrimestre: próximo disponible en enero'
            } else {
              canReinscribe = false
              reason = '2do cuatrimestre: próximo disponible en julio'
            }
          } else {
            canReinscribe = true
            reason = 'Disponible para reinscribirse'
          }

          subjectMap.set(subjectId, {
            id: subjectId,
            name: subject.name,
            code: subject.code,
            year: subject.year,
            dictation_type: subject.dictation_type || 'anual',
            semester: subject.semester || 1,
            final_grade: record.final_grade || 0,
            final_status: record.final_status,
            failed_year: failureYear,
            can_reinscribe: canReinscribe,
            reason: reason,
            is_already_reinscribed: currentRecursiveIds.has(subjectId),
          })
        }
      }

      const processed = Array.from(subjectMap.values()).sort((a, b) => {
        // Mostrar primero las que pueden reinscribirse
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
      if (!response.success) {
        setError(`Error: ${response.message}`)
        setReinscribing(null)
        return
      }

      alert(
        `✅ Reinscripción exitosa!\n\n` +
        `Materia: ${subject.code} - ${subject.name}\n` +
        `Condición: Recursante (${subject.failed_year} → ${currentYear})\n` +
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

  if (loading) {
    return (
      <div className="card p-6 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-200 border-t-indigo-600 mb-4"></div>
        <p className="text-slate-600">Cargando materias desaprobadas...</p>
      </div>
    )
  }

  if (failedSubjects.length === 0) {
    return (
      <div className="card p-6 text-center bg-green-50 border border-green-200">
        <p className="text-green-700 font-medium">✓ ¡Felicidades! No tienes materias desaprobadas</p>
      </div>
    )
  }

  const availableForReinscription = failedSubjects.filter(s => s.can_reinscribe && !s.is_already_reinscribed)
  const blockedReinscriptions = failedSubjects.filter(s => !s.can_reinscribe || s.is_already_reinscribed)

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex gap-2">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {availableForReinscription.length > 0 && (
        <>
          <div className="card p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
            <h3 className="font-bold text-blue-900 mb-2">🔄 Disponibles para Reinscribirse</h3>
            <p className="text-sm text-blue-900">
              <strong>{availableForReinscription.length}</strong> materia{availableForReinscription.length !== 1 ? 's' : ''} que puedes reinscribir ahora como recursante
            </p>
          </div>

          <div className="space-y-3">
            {availableForReinscription.map((subject) => (
              <div
                key={subject.id}
                className="card p-4 bg-green-50 border-l-4 border-l-green-600 flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-semibold text-slate-500">
                      {subject.code}
                    </span>
                    <h3 className="font-semibold text-gray-900">{subject.name}</h3>
                    <span className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded">
                      Año {subject.year}
                    </span>
                    {subject.dictation_type === 'cuatrimestral' && (
                      <span className="text-xs bg-amber-200 text-amber-700 px-2 py-1 rounded">
                        {subject.semester === 1 ? '1er C.' : '2do C.'}
                      </span>
                    )}
                    {subject.dictation_type === 'anual' && (
                      <span className="text-xs bg-teal-200 text-teal-700 px-2 py-1 rounded">
                        Anual
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                    <span>📊 Nota: {subject.final_grade ? subject.final_grade.toFixed(1) : 'N/A'}</span>
                    <span>📅 Desaprobado: {subject.failed_year}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleReinscribe(subject)}
                  disabled={reinscribing === subject.id}
                  className="ml-4 flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
                >
                  {reinscribing === subject.id ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Reinscribiendo...
                    </>
                  ) : (
                    <>
                      <RotateCcw size={16} />
                      Reinscribirse
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {blockedReinscriptions.length > 0 && (
        <>
          <div className="card p-4 bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-gray-200">
            <h3 className="font-bold text-gray-900 mb-2">⏳ No disponibles actualmente</h3>
            <p className="text-sm text-gray-700">
              <strong>{blockedReinscriptions.length}</strong> materia{blockedReinscriptions.length !== 1 ? 's' : ''} que podrás reinscribir en otro período
            </p>
          </div>

          <div className="space-y-3">
            {blockedReinscriptions.map((subject) => (
              <div
                key={subject.id}
                className="card p-4 bg-gray-50 border-l-4 border-l-gray-300 flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-semibold text-slate-500">
                      {subject.code}
                    </span>
                    <h3 className="font-semibold text-gray-900">{subject.name}</h3>
                    <span className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded">
                      Año {subject.year}
                    </span>
                    {subject.dictation_type === 'cuatrimestral' && (
                      <span className="text-xs bg-amber-200 text-amber-700 px-2 py-1 rounded">
                        {subject.semester === 1 ? '1er C.' : '2do C.'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Lock size={14} className="text-gray-500" />
                    <span className="text-sm text-gray-600">{subject.reason}</span>
                  </div>
                </div>

                <button
                  disabled
                  className="ml-4 flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed"
                >
                  <Lock size={16} />
                  No disponible
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="card p-4 bg-blue-50 border border-blue-200">
        <h3 className="font-bold text-blue-900 mb-2">ℹ️ Cómo funciona la reinscripción</h3>
        <ul className="text-sm text-blue-900 space-y-2">
          <li>
            <strong>Anuales:</strong> Solo puedes reinscribirse el año siguiente al que desaprobaste.
            <br />
            <span className="text-xs text-blue-700">Ejemplo: Desaprobaste en 2026 → Puedes reinscribirse en 2027</span>
          </li>
          <li>
            <strong>Cuatrimestrales:</strong> Solo en el período correspondiente.
            <br />
            <span className="text-xs text-blue-700">1er C: Disponible enero-junio | 2do C: Disponible julio-diciembre</span>
          </li>
          <li>
            <strong>Estado de recursante:</strong> Se registrará como 2do intento en el sistema.
          </li>
          <li>
            <strong>Calificaciones anteriores:</strong> Conservarás tu histórico del primer intento.
          </li>
        </ul>
      </div>
    </div>
  )
}
