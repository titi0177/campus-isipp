import { useState } from 'react'
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react'
import {
  autoEnrollStudentsByYear,
  getStudentsMissingEnrollments,
} from '@/lib/enrollment-auto-enroll'

export function EnrollmentAutoEnrollPanel() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [results, setResults] = useState<any>(null)
  const [showResults, setShowResults] = useState(false)
  const [checkingMissing, setCheckingMissing] = useState(false)

  const handleAutoEnroll = async () => {
    setLoading(true)
    setMessage('')
    setResults(null)

    try {
      const result = await autoEnrollStudentsByYear()

      if (result.success) {
        setMessage(`✅ ${result.message}`)
        setResults(result.summary)
        setShowResults(true)
      } else {
        setMessage(`⚠️ ${result.message}`)
      }
    } catch (err) {
      setMessage(`❌ Error: ${String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckMissing = async () => {
    setCheckingMissing(true)
    setMessage('')

    try {
      const result = await getStudentsMissingEnrollments()

      if (result.success) {
        const count = result.students_needing_enrollment.length
        setMessage(
          count > 0
            ? `⚠️ Encontrados ${count} estudiantes sin inscripción completa`
            : `✅ Todos los estudiantes tienen inscripciones correctas`
        )
        setResults(result.students_needing_enrollment)
        setShowResults(true)
      }
    } catch (err) {
      setMessage(`❌ Error: ${String(err)}`)
    } finally {
      setCheckingMissing(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200">
      <h3 className="text-lg font-bold text-slate-900 mb-4">
        📋 Auto-Inscripción de Estudiantes
      </h3>

      <p className="text-sm text-slate-600 mb-6">
        Inscribe automáticamente a alumnos de 2° y 3° año en materias de años
        anteriores, sin duplicar inscripciones existentes.
      </p>

      <div className="space-y-4">
        {/* Botones de acción */}
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={handleAutoEnroll}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={18} />
            {loading ? 'Procesando...' : 'Ejecutar Auto-Inscripción'}
          </button>

          <button
            onClick={handleCheckMissing}
            disabled={checkingMissing}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-600 text-white rounded-lg font-semibold hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            <AlertCircle size={18} />
            {checkingMissing ? 'Verificando...' : 'Verificar Faltantes'}
          </button>
        </div>

        {/* Mensaje de estado */}
        {message && (
          <div
            className={`p-3 rounded-lg text-sm flex items-start gap-2 ${
              message.startsWith('✅')
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : message.startsWith('⚠️')
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            <span className="text-lg mt-0.5">
              {message.startsWith('✅') ? '✓' : message.startsWith('⚠️') ? '!' : '✕'}
            </span>
            <span className="flex-1">{message}</span>
          </div>
        )}

        {/* Resultados */}
        {showResults && results && (
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            {typeof results === 'object' && !Array.isArray(results) ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-semibold text-slate-700">
                    Estudiantes procesados:
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {results.students_processed} / {results.total_students}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-semibold text-slate-700">
                    Materias inscritas:
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {results.total_subjects_enrolled}
                  </span>
                </div>
                {results.students_with_errors > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span className="text-sm font-semibold">Errores:</span>
                    <span className="text-sm font-bold">{results.students_with_errors}</span>
                  </div>
                )}
              </div>
            ) : Array.isArray(results) && results.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-300">
                      <th className="text-left py-2 px-2 font-semibold text-slate-700">
                        Estudiante
                      </th>
                      <th className="text-center py-2 px-2 font-semibold text-slate-700">
                        Año
                      </th>
                      <th className="text-center py-2 px-2 font-semibold text-slate-700">
                        Requeridas
                      </th>
                      <th className="text-center py-2 px-2 font-semibold text-slate-700">
                        Inscritas
                      </th>
                      <th className="text-center py-2 px-2 font-semibold text-slate-700">
                        Faltantes
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((row: any, idx: number) => (
                      <tr
                        key={idx}
                        className="border-b border-slate-200 hover:bg-slate-100"
                      >
                        <td className="py-2 px-2 text-slate-900">{row.name}</td>
                        <td className="text-center py-2 px-2 text-slate-700">
                          {row.year}°
                        </td>
                        <td className="text-center py-2 px-2 text-slate-700">
                          {row.required_subjects}
                        </td>
                        <td className="text-center py-2 px-2 text-slate-700">
                          {row.enrolled_subjects}
                        </td>
                        <td className="text-center py-2 px-2 font-semibold text-red-600">
                          {row.missing_subjects}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-600">No hay resultados para mostrar.</p>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-200">
        <p className="text-xs text-slate-500">
          <strong>Nota:</strong> Esta función solo inscribe en materias de años anteriores (ej:
          alumnos de 3° en materias de 1° y 2°). No duplica inscripciones existentes. Los
          cambios se aplican al año académico actual.
        </p>
      </div>
    </div>
  )
}
