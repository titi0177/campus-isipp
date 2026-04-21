import { type ReactNode } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface ModernStatCardProps {
  icon: ReactNode
  title: string
  value: string | number
  subtitle?: string
  trend?: 'up' | 'down'
  trendValue?: string
  color?: 'blue' | 'green' | 'red' | 'purple' | 'orange' | 'pink'
  onClick?: () => void
}

function ModernStatCard({
  icon,
  title,
  value,
  subtitle,
  trend,
  trendValue,
  color = 'blue',
  onClick,
}: ModernStatCardProps) {
  const colorMap = {
    blue: {
      bg: 'from-blue-500 to-blue-600',
      lightBg: 'bg-blue-100',
      text: 'text-blue-700',
      border: 'border-blue-200',
    },
    green: {
      bg: 'from-emerald-500 to-emerald-600',
      lightBg: 'bg-emerald-100',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
    },
    red: {
      bg: 'from-red-500 to-red-600',
      lightBg: 'bg-red-100',
      text: 'text-red-700',
      border: 'border-red-200',
    },
    purple: {
      bg: 'from-purple-500 to-purple-600',
      lightBg: 'bg-purple-100',
      text: 'text-purple-700',
      border: 'border-purple-200',
    },
    orange: {
      bg: 'from-orange-500 to-orange-600',
      lightBg: 'bg-orange-100',
      text: 'text-orange-700',
      border: 'border-orange-200',
    },
    pink: {
      bg: 'from-pink-500 to-pink-600',
      lightBg: 'bg-pink-100',
      text: 'text-pink-700',
      border: 'border-pink-200',
    },
  }

  const colors = colorMap[color]

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-xl border ${colors.border} bg-white shadow-md transition-all duration-300 hover:shadow-xl ${
        onClick ? 'cursor-pointer hover:-translate-y-1' : ''
      }`}
    >
      {/* Background gradient accent */}
      <div
        className={`absolute top-0 right-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-gradient-to-br ${colors.bg} opacity-10`}
      />

      <div className="relative p-6">
        {/* Icon */}
        <div className={`mb-4 inline-flex rounded-lg ${colors.lightBg} p-3`}>
          <div className={colors.text}>{icon}</div>
        </div>

        {/* Title */}
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-600">{title}</p>

        {/* Value */}
        <div className="mt-2 flex items-baseline gap-2">
          <h3 className="text-3xl font-bold text-slate-900">{value}</h3>

          {/* Trend */}
          {trend && trendValue && (
            <div className={`flex items-center gap-1 text-sm font-semibold ${trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
              {trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {trendValue}
            </div>
          )}
        </div>

        {/* Subtitle */}
        {subtitle && (
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
        )}
      </div>
    </div>
  )
}

interface ModernStatGridProps {
  stats: ModernStatCardProps[]
  columns?: 2 | 3 | 4
}

export function ModernStatGrid({ stats, columns = 4 }: ModernStatGridProps) {
  const gridClass = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }

  return (
    <div className={`grid gap-4 ${gridClass[columns]}`}>
      {stats.map((stat, index) => (
        <ModernStatCard key={index} {...stat} />
      ))}
    </div>
  )
}

export { ModernStatCard }
export default ModernStatCard
