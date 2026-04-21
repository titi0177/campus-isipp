import { X } from 'lucide-react'
import { ReactNode } from 'react'

interface ModernCardProps {
  children: ReactNode
  title?: string
  subtitle?: string
  icon?: ReactNode
  actions?: ReactNode
  variant?: 'default' | 'elevated' | 'outlined'
  className?: string
  headerClass?: string
  onClick?: () => void
}

export function ModernCard({
  children,
  title,
  subtitle,
  icon,
  actions,
  variant = 'default',
  className = '',
  headerClass = '',
  onClick,
}: ModernCardProps) {
  const variantClass = {
    default: 'bg-white border border-[var(--siu-border-light)] shadow-md',
    elevated: 'bg-white shadow-lg border-0',
    outlined: 'bg-transparent border-2 border-[var(--siu-border-light)]',
  }

  return (
    <div
      onClick={onClick}
      className={`rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl ${variantClass[variant]} ${className} ${
        onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''
      }`}
    >
      {/* Header */}
      {(title || actions) && (
        <div
          className={`border-b border-[var(--siu-border-light)] bg-gradient-to-r from-white via-[var(--siu-blue-soft)]/30 to-white px-6 py-4 flex items-center justify-between gap-4 ${headerClass}`}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {icon && (
              <div className="flex-shrink-0 text-[var(--isipp-bordo)]">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              {title && (
                <h3 className="font-bold text-slate-900 truncate">{title}</h3>
              )}
              {subtitle && (
                <p className="text-xs text-[var(--siu-text-muted)] mt-0.5 truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {actions && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {actions}
            </div>
          )}
        </div>
      )}

      {/* Body */}
      <div className="p-6">
        {children}
      </div>
    </div>
  )
}

interface ModernCardGridProps {
  children: ReactNode
  columns?: 2 | 3 | 4
}

export function ModernCardGrid({ children, columns = 3 }: ModernCardGridProps) {
  const gridClass = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }

  return (
    <div className={`grid gap-6 ${gridClass[columns]}`}>
      {children}
    </div>
  )
}

// Specialized card components

interface EmptyStateProps {
  icon: ReactNode
  title: string
  subtitle?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyStateCard({
  icon,
  title,
  subtitle,
  action,
}: EmptyStateProps) {
  return (
    <ModernCard
      className="text-center py-12"
      variant="outlined"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="text-6xl opacity-50">
          {icon}
        </div>
        <div>
          <h3 className="font-bold text-slate-900">{title}</h3>
          {subtitle && (
            <p className="text-sm text-[var(--siu-text-muted)] mt-1">
              {subtitle}
            </p>
          )}
        </div>
        {action && (
          <button
            onClick={action.onClick}
            className="mt-4 px-4 py-2 rounded-lg bg-[var(--isipp-bordo)] text-white font-semibold hover:bg-[var(--isipp-bordo-dark)] transition-colors"
          >
            {action.label}
          </button>
        )}
      </div>
    </ModernCard>
  )
}

interface InfoBoxProps {
  icon?: ReactNode
  title: string
  content: string
  type?: 'info' | 'success' | 'warning' | 'error'
}

export function InfoBox({ icon, title, content, type = 'info' }: InfoBoxProps) {
  const typeClass = {
    info: 'bg-blue-50 border-blue-200 text-blue-900',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    warning: 'bg-amber-50 border-amber-200 text-amber-900',
    error: 'bg-red-50 border-red-200 text-red-900',
  }

  const typeIcon = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌',
  }

  return (
    <div className={`border-l-4 rounded-lg p-4 ${typeClass[type]}`}>
      <div className="flex gap-3">
        <span className="text-xl flex-shrink-0">
          {icon || typeIcon[type]}
        </span>
        <div>
          <h4 className="font-bold">{title}</h4>
          <p className="text-sm mt-1 opacity-90">{content}</p>
        </div>
      </div>
    </div>
  )
}

interface AlertProps {
  icon?: ReactNode
  title: string
  message: string
  type?: 'info' | 'success' | 'warning' | 'error'
  onClose?: () => void
}

export function Alert({
  icon,
  title,
  message,
  type = 'info',
  onClose,
}: AlertProps) {
  const typeClass = {
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-300',
      text: 'text-blue-900',
      icon: '🔵',
    },
    success: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-300',
      text: 'text-emerald-900',
      icon: '✅',
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-300',
      text: 'text-amber-900',
      icon: '⚠️',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-300',
      text: 'text-red-900',
      icon: '❌',
    },
  }

  const style = typeClass[type]

  return (
    <div className={`${style.bg} border-l-4 ${style.border} rounded-lg p-4 flex gap-4 ${style.text}`}>
      <div className="text-xl flex-shrink-0">
        {icon || style.icon}
      </div>
      <div className="flex-1">
        <h4 className="font-bold">{title}</h4>
        <p className="text-sm mt-1">{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Cerrar"
        >
          <X size={20} />
        </button>
      )}
    </div>
  )
}

export default ModernCard
