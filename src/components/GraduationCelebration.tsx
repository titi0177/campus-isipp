import { LogIn, Download } from 'lucide-react'

export function GraduationCelebration({ 
  studentName, 
  programName, 
  onContinue, 
  onDownloadCert 
}: {
  studentName: string
  programName: string
  onContinue: () => void
  onDownloadCert: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in scale-in duration-500">
        
        {/* Header celebración */}
        <div className="bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 p-8 text-center relative overflow-hidden">
          
          {/* Emoji animado */}
          <div className="text-6xl mb-4 animate-bounce">🎓</div>
          
          <h1 className="text-3xl font-black text-yellow-900 mb-2">
            ¡FELICIDADES!
          </h1>
          <p className="text-yellow-800 font-semibold">
            Has completado tu carrera
          </p>
        </div>

        {/* Contenido */}
        <div className="p-8 text-center">
          <p className="text-slate-600 mb-6">
            Felicitamos a <span className="font-bold text-slate-900">{studentName}</span> por haber completado exitosamente la carrera de:
          </p>
          
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-8">
            <p className="text-lg font-bold text-blue-900">
              {programName}
            </p>
          </div>

          <p className="text-sm text-slate-500 mb-8">
            Puedes acceder a tu historial académico completo y descargar tu certificado.
          </p>

          {/* Botones */}
          <div className="space-y-3">
            <button
              onClick={onContinue}
              className="w-full bg-gradient-to-r from-[var(--isipp-bordo)] to-[var(--siu-blue)] hover:shadow-lg text-white font-bold py-3 rounded-lg transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <LogIn className="w-5 h-5" />
              Ir al Dashboard
            </button>
            
            <button
              onClick={onDownloadCert}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold py-3 rounded-lg transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Descargar Certificado
            </button>
          </div>
        </div>

        {/* Decoración */}
        <div className="bg-slate-50 px-8 py-4 text-center text-2xl tracking-widest text-yellow-400">
          ✨ 🎓 ✨ 🎉 ✨ 🎓 ✨
        </div>
      </div>
    </div>
  )
}
