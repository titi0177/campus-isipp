import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { CheckCircle, XCircle, AlertCircle, X, Info, AlertTriangle } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  type: ToastType
  message: string
  title?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void
  showToastWithAction: (toast: Omit<Toast, 'id'>) => void
}

const ToastContext = createContext<ToastContextType>({ 
  showToast: () => {},
  showToastWithAction: () => {},
})

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'success', duration = 4000) => {
    const id = Math.random().toString(36).slice(2) + Date.now()
    const newToast: Toast = { id, type, message, duration }
    setToasts(prev => [...prev, newToast])

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, duration)
    }
  }, [])

  const showToastWithAction = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2) + Date.now()
    const newToast: Toast = { ...toast, id }
    setToasts(prev => [...prev, newToast])

    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, toast.duration)
    }
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast, showToastWithAction }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] space-y-2 pointer-events-none md:bottom-6 md:right-6">
        {toasts.map(toast => (
          <ToastItem 
            key={toast.id} 
            toast={toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

interface ToastItemProps {
  toast: Toast
  onClose: () => void
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  const [isExiting, setIsExiting] = useState(false)

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle size={20} className="flex-shrink-0" />
      case 'error':
        return <XCircle size={20} className="flex-shrink-0" />
      case 'warning':
        return <AlertTriangle size={20} className="flex-shrink-0" />
      case 'info':
        return <Info size={20} className="flex-shrink-0" />
      default:
        return <AlertCircle size={20} className="flex-shrink-0" />
    }
  }

  const getColors = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: 'bg-emerald-50',
          border: 'border-emerald-200 border-l-4 border-l-emerald-500',
          icon: 'text-emerald-600',
          progress: 'bg-emerald-500',
        }
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200 border-l-4 border-l-red-500',
          icon: 'text-red-600',
          progress: 'bg-red-500',
        }
      case 'warning':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200 border-l-4 border-l-amber-500',
          icon: 'text-amber-600',
          progress: 'bg-amber-500',
        }
      case 'info':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200 border-l-4 border-l-blue-500',
          icon: 'text-blue-600',
          progress: 'bg-blue-500',
        }
    }
  }

  const colors = getColors()

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(onClose, 200)
  }

  return (
    <div
      className={`pointer-events-auto transform transition-all duration-200 ${
        isExiting
          ? 'translate-x-full opacity-0'
          : 'translate-x-0 opacity-100'
      }`}
    >
      <div
        className={`flex gap-3 ${colors.bg} ${colors.border} rounded-lg p-4 shadow-lg min-w-[320px] max-w-[420px]`}
      >
        {/* Icono */}
        <div className={colors.icon}>
          {getIcon()}
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          {toast.title && (
            <h4 className="font-bold text-sm text-slate-900">
              {toast.title}
            </h4>
          )}
          <p className={`text-sm ${toast.title ? 'mt-1' : ''} text-slate-700`}>
            {toast.message}
          </p>

          {/* Acción */}
          {toast.action && (
            <button
              onClick={() => {
                toast.action?.onClick()
                handleClose()
              }}
              className={`mt-2 text-xs font-bold uppercase tracking-wide transition-colors ${
                toast.type === 'success' ? 'text-emerald-600 hover:text-emerald-700' :
                toast.type === 'error' ? 'text-red-600 hover:text-red-700' :
                toast.type === 'warning' ? 'text-amber-600 hover:text-amber-700' :
                'text-blue-600 hover:text-blue-700'
              }`}
            >
              {toast.action.label}
            </button>
          )}
        </div>

        {/* Botón cerrar */}
        <button
          onClick={handleClose}
          className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="Cerrar"
        >
          <X size={18} />
        </button>
      </div>

      {/* Progress bar */}
      {toast.duration && toast.duration > 0 && (
        <div className="h-1 bg-slate-200 rounded-b-lg overflow-hidden">
          <div
            className={`h-full ${colors.progress} animate-shrink`}
            style={{
              animation: `shrink ${toast.duration}ms linear forwards`,
            }}
          />
        </div>
      )}
    </div>
  )
}

export default ToastProvider
