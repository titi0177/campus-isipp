import { isValidElement, type ReactNode } from "react"
import type { LucideIcon } from "lucide-react"

const SEMANTIC_ICON_WRAP: Record<string, string> = {
  bordeaux: "bg-[#582c31]/12 text-[#3d1f22]",
  blue: "bg-sky-100 text-sky-800 border border-sky-200/80",
  green: "bg-emerald-100 text-emerald-800 border border-emerald-200/80",
  orange: "bg-amber-100 text-amber-900 border border-amber-200/80",
  purple: "bg-violet-100 text-violet-800 border border-violet-200/80",
}

function iconWrapClasses(color: string | undefined): string {
  const c = color ?? "bordeaux"
  if (c.includes(" ") || c.startsWith("bg-")) return c
  return SEMANTIC_ICON_WRAP[c] ?? SEMANTIC_ICON_WRAP.bordeaux
}

type StatCardProps = {
  icon: LucideIcon | ReactNode
  title: string
  value: ReactNode
  color?: string
}

function StatCard({ icon, title, value, color }: StatCardProps) {
  const wrapClass = iconWrapClasses(color)
  const iconNode = isValidElement(icon)
    ? icon
    : (() => {
        const Icon = icon as LucideIcon
        return <Icon size={22} />
      })()

  return (
    <div className="card flex items-center gap-4 border-l-4 border-l-[var(--isipp-bordo)] p-5 shadow-sm hover:shadow-md transition-all duration-300 ease-out">
      <div className={`rounded-md border p-3 shadow-xs transition-transform duration-300 ${wrapClass}`}>
        {iconNode}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--siu-text-muted)]">{title}</p>
        <p className="text-2xl font-bold tracking-tight text-[var(--siu-navy)]">{value}</p>
      </div>
    </div>
  )
}

export { StatCard }
export default StatCard
