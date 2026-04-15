import { createFileRoute } from '@tanstack/react-router'
import { MessageCircle } from 'lucide-react'

export const Route = createFileRoute('/dashboard/messages')({
  component: StudentMessagesPage,
})

function StudentMessagesPage() {
  return (
    <div className="space-y-6 h-full flex flex-col items-center justify-center">
      <div className="text-center">
        <div className="bg-gradient-to-br from-blue-100 to-blue-50 p-8 rounded-lg inline-block mb-6">
          <MessageCircle size={64} className="text-blue-600 mx-auto" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Mensajes</h1>
        <p className="text-slate-600 mt-2 max-w-md">
          La funcionalidad de mensajes está temporalmente deshabilitada mientras optimizamos el sistema.
        </p>
        <p className="text-slate-500 text-sm mt-4">
          Intenta más tarde o contacta con soporte si necesitas ayuda.
        </p>
      </div>
    </div>
  )
}
