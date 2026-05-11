import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Announcement } from '@/types'

interface AnnouncementModalProps {
  announcement: Announcement | null
  open: boolean
  currentIndex: number
  totalCount: number
  onClose: () => void
  onNext: () => void
  onPrev: () => void
  loading?: boolean
}

export function AnnouncementModal({
  announcement,
  open,
  currentIndex,
  totalCount,
  onClose,
  onNext,
  onPrev,
  loading,
}: AnnouncementModalProps) {
  if (!open || !announcement) return null

  const isFirst = currentIndex === 0
  const isLast = currentIndex === totalCount - 1

  return (
    <div className="modal-overlay">
      <div className="modal-content w-full max-w-2xl">
        {/* Header con gradient institucional */}
        <div className="siu-modal-head bg-gradient-to-r from-[var(--isipp-bordo)] to-[var(--isipp-bordo-deep)]">
          <h2 className="text-base font-bold tracking-tight">
            📢 Anuncio Institucional
          </h2>
          <button
            onClick={onClose}
            className="rounded-sm p-1.5 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-5">
          {/* Título del anuncio */}
          <h3 className="text-lg font-bold text-slate-900 mb-4">
            {announcement.title}
          </h3>

          {/* Descripción */}
          <div className="text-slate-700 leading-relaxed whitespace-pre-wrap mb-6 max-h-96 overflow-y-auto">
            {announcement.description}
          </div>

          {/* Fecha */}
          <div className="text-xs text-slate-500 flex items-center gap-2 mb-6">
            <span className="text-lg">📅</span>
            {new Date(announcement.date).toLocaleDateString('es-AR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>

          {/* Separador */}
          <div className="border-t border-slate-200 pt-6" />

          {/* FOOTER con navegación */}
          <div className="flex justify-between items-center gap-4 mt-6">
            {/* Botones de navegación */}
            <div className="flex gap-2">
              <button
                onClick={onPrev}
                disabled={isFirst || loading}
                className="flex items-center gap-1 px-3 py-2 rounded-sm border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
              >
                <ChevronLeft size={16} />
                Anterior
              </button>
              <button
                onClick={onNext}
                disabled={isLast || loading}
                className="flex items-center gap-1 px-3 py-2 rounded-sm border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
              >
                Siguiente
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Contador */}
            <div className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-2 rounded-sm min-h-[44px] flex items-center whitespace-nowrap">
              {currentIndex + 1} / {totalCount}
            </div>

            {/* Botón cerrar principal */}
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-gradient-to-r from-[var(--isipp-bordo)] to-[var(--isipp-bordo-deep)] text-white font-bold rounded-sm hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 min-h-[44px] whitespace-nowrap"
            >
              {isLast ? '✓ Entendido' : 'Ir al final'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
