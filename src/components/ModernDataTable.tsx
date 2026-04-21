import { useState } from 'react'
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, Eye, Edit, Trash2, MoreVertical } from 'lucide-react'

interface Column<T> {
  key: string
  label: string
  icon?: React.ReactNode
  render?: (row: T) => React.ReactNode
  width?: string
  sortable?: boolean
}

interface ModernDataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  searchable?: boolean
  searchPlaceholder?: string
  actions?: (row: T) => React.ReactNode
  emptyMessage?: string
  title?: string
  subtitle?: string
  pageSize?: number
  rowClassName?: (row: T) => string
}

export function ModernDataTable<T extends Record<string, unknown>>({
  columns,
  data,
  searchable = true,
  searchPlaceholder = 'Buscar...',
  actions,
  emptyMessage = 'No hay datos disponibles',
  title,
  subtitle,
  pageSize = 10,
  rowClassName,
}: ModernDataTableProps<T>) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  let filtered = searchable
    ? data.filter((row) =>
        JSON.stringify(row).toLowerCase().includes(search.toLowerCase())
      )
    : data

  // Apply sorting
  if (sortKey) {
    filtered = [...filtered].sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      return sortDir === 'asc' ? cmp : -cmp
    })
  }

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  return (
    <div className="card overflow-hidden p-0 shadow-lg border-0">
      {/* Header Section */}
      {(title || searchable) && (
        <div className="border-b border-[var(--siu-border-light)] bg-gradient-to-r from-white via-[var(--siu-blue-soft)]/20 to-white px-6 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {title && (
                <h3 className="text-lg font-bold text-[var(--siu-navy)] flex items-center gap-2">
                  📊 {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-sm text-[var(--siu-text-muted)] mt-1">{subtitle}</p>
              )}
            </div>

            {searchable && (
              <div className="relative w-full sm:w-64">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--siu-text-muted)]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                  placeholder={searchPlaceholder}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-[var(--siu-border)] bg-white focus:border-[var(--isipp-bordo)] focus:ring-2 focus:ring-[var(--isipp-bordo)]/20 transition-all duration-200"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-[var(--isipp-bordo)] via-[var(--isipp-bordo-mid)] to-[var(--isipp-bordo-dark)] text-white shadow-md">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && handleSort(col.key)}
                  className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-widest ${
                    col.sortable ? 'cursor-pointer hover:bg-white/10 transition-colors' : ''
                  }`}
                  style={{ width: col.width }}
                >
                  <div className="flex items-center gap-2 group">
                    {col.icon && <span className="opacity-90">{col.icon}</span>}
                    <span>{col.label}</span>
                    {col.sortable && (
                      <ArrowUpDown
                        size={14}
                        className={`opacity-0 group-hover:opacity-100 transition-opacity ${
                          sortKey === col.key ? 'opacity-100' : ''
                        }`}
                      />
                    )}
                  </div>
                </th>
              ))}
              {actions && (
                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-widest">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--siu-border-light)]">
            {paginated.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="bg-white px-6 py-16 text-center"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="text-5xl">🔍</div>
                    <p className="text-[var(--siu-text-muted)] font-medium">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginated.map((row, i) => (
                <tr
                  key={i}
                  className={`group transition-all duration-200 hover:bg-gradient-to-r hover:from-[var(--siu-blue-soft)]/40 hover:via-white hover:to-white border-b border-[var(--siu-border-light)] last:border-b-0 ${
                    rowClassName ? rowClassName(row) : ''
                  }`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="px-6 py-4 text-slate-700 text-sm font-medium"
                      style={{ width: col.width }}
                    >
                      <div className="flex items-center gap-2">
                        {col.render ? col.render(row) : String(row[col.key] ?? '-')}
                      </div>
                    </td>
                  ))}
                  {actions && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                        {actions(row)}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer - Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-[var(--siu-border-light)] bg-gradient-to-r from-white via-[var(--siu-blue-soft)]/20 to-white px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-[var(--siu-text-muted)]">
              📄 {filtered.length} registros
            </span>
            <span className="text-xs text-[var(--siu-text-muted)]">·</span>
            <span className="text-xs font-semibold text-[var(--siu-navy)]">
              Página {page} de {totalPages}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="inline-flex items-center justify-center rounded-lg border border-[var(--siu-border)] bg-white px-3 py-2 text-[var(--siu-navy)] hover:bg-[var(--siu-blue-soft)] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white shadow-sm hover:shadow-md"
              aria-label="Página anterior"
              title="Anterior"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                const pageNum = i + 1
                const isCurrentPage = pageNum === page
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 rounded-lg font-bold transition-all duration-200 ${
                      isCurrentPage
                        ? 'bg-gradient-to-r from-[var(--isipp-bordo)] to-[var(--isipp-bordo-dark)] text-white shadow-md'
                        : 'border border-[var(--siu-border)] text-[var(--siu-text-muted)] hover:bg-[var(--siu-blue-soft)]'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="inline-flex items-center justify-center rounded-lg border border-[var(--siu-border)] bg-white px-3 py-2 text-[var(--siu-navy)] hover:bg-[var(--siu-blue-soft)] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white shadow-sm hover:shadow-md"
              aria-label="Siguiente página"
              title="Siguiente"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ModernDataTable
