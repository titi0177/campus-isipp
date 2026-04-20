import { createFileRoute } from '@tanstack/react-router'
import { StudentRecursiveReinscription } from '@/components/StudentRecursiveReinscription'

export const Route = createFileRoute('/dashboard/recursive-reinscription')({
  component: RecursiveReinscriptionPage,
})

function RecursiveReinscriptionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reinscripción como Recursante</h1>
        <p className="text-gray-500 text-sm mt-1">Gestiona tus reinscripciones en materias desaprobadas</p>
      </div>

      <StudentRecursiveReinscription />

      <div className="card p-6 bg-blue-50 border border-blue-200 space-y-4">
        <h3 className="font-bold text-blue-900 text-lg">❓ Preguntas frecuentes</h3>
        
        <div>
          <h4 className="font-semibold text-blue-900">¿Cuándo puedo reinscribirme?</h4>
          <p className="text-sm text-blue-800 mt-1">
            Depende del tipo de materia. Las <strong>anuales</strong> solo el año siguiente. Las <strong>cuatrimestrales</strong>, en su período correspondiente.
          </p>
        </div>

        <div>
          <h4 className="font-semibold text-blue-900">¿Se verá que soy recursante?</h4>
          <p className="text-sm text-blue-800 mt-1">
            Sí, aparecerás como "Recursante" en el sistema. Tu historial del primer intento se conservará para referencia.
          </p>
        </div>

        <div>
          <h4 className="font-semibold text-blue-900">¿Puedo reinscribir antes del período?</h4>
          <p className="text-sm text-blue-800 mt-1">
            No. El sistema respeta automáticamente los períodos. Las materias se habilitarán solo cuando sea el momento correcto.
          </p>
        </div>

        <div>
          <h4 className="font-semibold text-blue-900">¿Qué pasa con mis correlativas?</h4>
          <p className="text-sm text-blue-800 mt-1">
            Se mantienen igual. Si necesitas aprobaciones previas, debes tenerlas antes de poder reinscribirte.
          </p>
        </div>
      </div>
    </div>
  )
}
