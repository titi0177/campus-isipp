import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/Toast'
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react'

export const Route = createFileRoute('/admin/year-advancement')({
  component: YearAdvancementPage,
})

function YearAdvancementPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const { showToast } = useToast()

  const handleAdvanceYear = async () => {
    if (
      !confirm(
        '⚠️ OPERACIÓN CRÍTICA\n\n' +
        '¿Incrementar el año académico de TODOS los alumnos activos?\n\n' +
        '1° → 2°\n2° → 3°\n3° → 3° (máximo)\n\n' +
        '⚠️ Esta acción NO se puede deshacer\n\n' +
        '¿Continuar?'
      )
    ) {
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const { data, error: rpcError } = await supabase.rpc(
        'advance_students_academic_year'
      )

      if (rpcError) {
        setError(rpcError.message)
        showToast('❌ Error: ' + rpcError.message, 'error')
        return
      }

      if (!data.success) {
        setError(data.message)
        showToast('❌ ' + data.message, 'error')
        return
      }

      setResult(data)
      showToast('✅ Año académico actualizado exitosamente', 'success')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
      showToast('❌ Error: ' + message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">⏰ Avance de Año Académico</h1>
        <p className="text-gray-600 mt-2">
          Incrementar automáticamente el año de todos los estudiantes activos
        </p>
      </div>

      {/* Card Principal - Operación Crítica */}
      <div className="card p-8 border-4 border-yellow-400 bg-yellow-50">
        <div className="flex items-start gap-4">
          <AlertTriangle size={48} className="text-yellow-600 flex-shrink-0" />
          <div className="flex-1">
            <h2 className="text-xl font-bold text-yellow-900">Operación Crítica</h2>
            <p className="text-yellow-800 mt-2">
              Esta acción modificará el campo <code className="bg-yellow-100 px-2 py-1 rounded">students.year</code> de todos los alumnos.
            </p>
            <ul className="text-yellow-800 text-sm mt-3 space-y-1 list-disc list-inside">
              <li>✓ Incrementa solo a alumnos no en último año</li>
              <li>✓ Respeta el máximo de años de cada carrera</li>
              <li>✓ NO auto-inscribe en materias</li>
              <li>✓ Registra auditoría completa</li>
              <li>✓ Solo se ejecuta 1 vez por año</li>
              <li>❌ Ideal para el 1° de enero</li>
            </ul>
          </div>
        </div>

        <button
          onClick={handleAdvanceYear}
          disabled={loading}
          className="mt-6 w-full px-6 py-3 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 text-white font-bold rounded-lg text-lg transition flex items-center justify-center gap-2"
        >
          <Clock size={20} />
          {loading ? '⏳ Procesando...' : '➡️ Ejecutar Avance de Año'}
        </button>
      </div>

      {/* Resultado Exitoso */}
      {result && (
        <div className="card p-6 border-2 border-green-300 bg-green-50">
          <div className="flex items-start gap-3">
            <CheckCircle size={24} className="text-green-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-green-900">✅ Operación Exitosa</h3>
              <div className="text-green-800 text-sm mt-3 space-y-2">
                <p>
                  <strong>Estudiantes avanzados:</strong>{' '}
                  <span className="font-bold text-lg">{result.students_advanced}</span>
                </p>
                <p>
                  <strong>Ya en último año:</strong>{' '}
                  <span className="font-bold text-lg">{result.students_at_max_year}</span>
                </p>
                <p>
                  <strong>Total afectados:</strong>{' '}
                  <span className="font-bold text-lg">{result.total_affected}</span>
                </p>
                <hr className="my-2 border-green-200" />
                <p>
                  <strong>Fecha ejecución:</strong> {result.execution_date}
                </p>
                <p>
                  <strong>Próxima ejecución:</strong>{' '}
                  <span className="text-green-700 font-semibold">{result.next_execution}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="card p-6 border-2 border-red-300 bg-red-50">
          <h3 className="text-lg font-bold text-red-900">❌ Error</h3>
          <p className="text-red-800 text-sm mt-2">{error}</p>
        </div>
      )}

      {/* Info y Seguridad */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6 bg-blue-50 border-2 border-blue-200">
          <h3 className="font-bold text-blue-900 mb-3">ℹ️ Información</h3>
          <ul className="text-blue-800 text-sm space-y-2">
            <li><strong>Cuándo:</strong> 1° de enero de cada año</li>
            <li><strong>Qué hace:</strong> Incrementa students.year (1→2, 2→3)</li>
            <li><strong>Inscripciones:</strong> Quedan iguales (manual)</li>
            <li><strong>Ejecutada:</strong> 1 vez por año máximo</li>
            <li><strong>Reversible:</strong> Ver historial en logs</li>
          </ul>
        </div>

        <div className="card p-6 bg-purple-50 border-2 border-purple-200">
          <h3 className="font-bold text-purple-900 mb-3">📊 Auditoría</h3>
          <p className="text-purple-800 text-sm mb-3">
            Todas las ejecuciones se guardan en la tabla <code className="bg-purple-100 px-1 rounded">year_advancement_log</code>
          </p>
          <details className="text-purple-800 text-sm">
            <summary className="cursor-pointer font-semibold hover:text-purple-900">
              Ver SQL para revisar historial
            </summary>
            <pre className="bg-white p-3 rounded mt-2 text-xs overflow-x-auto border border-purple-200">
{`SELECT 
  execution_date,
  year_advanced_to,
  students_affected,
  students_at_max_year,
  status,
  executed_at
FROM public.year_advancement_log
ORDER BY execution_date DESC;`}
            </pre>
          </details>
        </div>
      </div>

      {/* Advertencia Final */}
      <div className="card p-4 bg-orange-50 border-l-4 border-orange-500">
        <p className="text-orange-900 text-sm">
          <strong>⚠️ Advertencia:</strong> Este botón está disponible TODO EL AÑO. Se recomienda usar solo el 1° de enero. 
          Si lo ejecutas en otro momento, la función devolverá error (protección incorporada).
        </p>
      </div>
    </div>
  )
}
