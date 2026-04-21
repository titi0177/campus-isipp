import { AlertCircle, CheckCircle, Clock, XCircle, User, Mail, Phone } from 'lucide-react'

// Status Badge with Icon
export function StatusBadgeModern({
  status,
  label,
}: {
  status: 'success' | 'error' | 'pending' | 'warning'
  label: string
}) {
  const styles = {
    success: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      icon: <CheckCircle size={16} />,
      badge: 'bg-emerald-100',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      icon: <XCircle size={16} />,
      badge: 'bg-red-100',
    },
    pending: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-700',
      icon: <Clock size={16} />,
      badge: 'bg-amber-100',
    },
    warning: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-700',
      icon: <AlertCircle size={16} />,
      badge: 'bg-orange-100',
    },
  }

  const style = styles[status]

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${style.badge} border ${style.border}`}>
      <span className={style.text}>{style.icon}</span>
      <span className={`text-sm font-semibold ${style.text}`}>{label}</span>
    </div>
  )
}

// Avatar Cell
export function AvatarCell({ name, email, initials }: { name: string; email?: string; initials?: string }) {
  const getInitials = () => {
    if (initials) return initials
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--isipp-bordo)] to-[var(--isipp-bordo-dark)] text-white font-bold text-sm shadow-md">
        {getInitials()}
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-slate-900 truncate">{name}</p>
        {email && <p className="text-xs text-[var(--siu-text-muted)] truncate">{email}</p>}
      </div>
    </div>
  )
}

// Contact Cell with Icons
export function ContactCell({ phone, email }: { phone?: string; email?: string }) {
  return (
    <div className="flex flex-col gap-1">
      {email && (
        <div className="flex items-center gap-2 text-sm text-slate-700">
          <Mail size={14} className="text-[var(--isipp-bordo)] flex-shrink-0" />
          <a href={`mailto:${email}`} className="hover:text-[var(--isipp-bordo)] truncate">
            {email}
          </a>
        </div>
      )}
      {phone && (
        <div className="flex items-center gap-2 text-sm text-slate-700">
          <Phone size={14} className="text-[var(--isipp-bordo)] flex-shrink-0" />
          <a href={`tel:${phone}`} className="hover:text-[var(--isipp-bordo)]">
            {phone}
          </a>
        </div>
      )}
    </div>
  )
}

// Progress Cell
export function ProgressCell({ value, max = 100, label }: { value: number; max?: number; label?: string }) {
  const percentage = (value / max) * 100
  const getColor = () => {
    if (percentage >= 80) return 'from-emerald-400 to-emerald-600'
    if (percentage >= 50) return 'from-amber-400 to-amber-600'
    return 'from-red-400 to-red-600'
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="w-full h-2 bg-[var(--siu-border-light)] rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${getColor()} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-[var(--siu-text-muted)]">
        {label || `${percentage.toFixed(0)}%`}
      </span>
    </div>
  )
}

// Tag Cell with Multiple Values
export function TagsCell({ tags }: { tags: string[] }) {
  const colors = [
    'bg-blue-100 text-blue-700',
    'bg-purple-100 text-purple-700',
    'bg-pink-100 text-pink-700',
    'bg-green-100 text-green-700',
    'bg-yellow-100 text-yellow-700',
  ]

  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.slice(0, 3).map((tag, i) => (
        <span
          key={i}
          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${colors[i % colors.length]}`}
        >
          {tag}
        </span>
      ))}
      {tags.length > 3 && (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
          +{tags.length - 3}
        </span>
      )}
    </div>
  )
}

// Action Buttons Cell
export function ActionCell({
  onView,
  onEdit,
  onDelete,
}: {
  onView?: () => void
  onEdit?: () => void
  onDelete?: () => void
}) {
  return (
    <div className="flex items-center gap-1">
      {onView && (
        <button
          onClick={onView}
          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
          title="Ver"
        >
          <Eye size={16} />
        </button>
      )}
      {onEdit && (
        <button
          onClick={onEdit}
          className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors"
          title="Editar"
        >
          <Edit size={16} />
        </button>
      )}
      {onDelete && (
        <button
          onClick={onDelete}
          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          title="Eliminar"
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  )
}

// Number Cell with Formatting
export function NumberCell({ value, format = 'number' }: { value: number; format?: 'number' | 'currency' | 'percentage' }) {
  const formatted = (() => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value)
      case 'percentage':
        return `${value.toFixed(1)}%`
      default:
        return value.toLocaleString('es-AR')
    }
  })()

  return (
    <span className="font-semibold text-slate-900">
      {formatted}
    </span>
  )
}

// Date Cell with Formatting
export function DateCell({ date }: { date: string | Date }) {
  const d = typeof date === 'string' ? new Date(date) : date
  return (
    <span className="text-sm text-slate-700">
      {d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
    </span>
  )
}

// Badge with Icon
export function BadgeModern({
  icon,
  label,
  color = 'blue',
}: {
  icon?: React.ReactNode
  label: string
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple'
}) {
  const colorMap = {
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    green: 'bg-green-100 text-green-700 border-green-200',
    red: 'bg-red-100 text-red-700 border-red-200',
    yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    purple: 'bg-purple-100 text-purple-700 border-purple-200',
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border ${colorMap[color]}`}>
      {icon}
      {label}
    </span>
  )
}
