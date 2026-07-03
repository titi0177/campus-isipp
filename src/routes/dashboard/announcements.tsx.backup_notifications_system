import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Bell } from 'lucide-react'
import type { Announcement } from '@/types'
import { useRealtimeAnnouncements } from '@/hooks/useRealtimeAnnouncements'

export const Route = createFileRoute('/dashboard/announcements')({
  component: AnnouncementsPage,
})

function AnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('announcements').select('*').order('date', { ascending: false })
    setItems((data as Announcement[]) || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useRealtimeAnnouncements(load)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Anuncios Institucionales</h1>
      {loading ? <div className="card animate-pulse h-64 bg-gray-100" /> : (
        items.length === 0 ? (
          <div className="card text-center py-12 text-gray-400">No hay anuncios disponibles.</div>
        ) : (
          <div className="space-y-4">
            {items.map(ann => (
              <div key={ann.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="bg-red-50 p-3 rounded-xl flex-shrink-0">
                    <Bell size={20} className="text-[var(--siu-blue)]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-gray-900">{ann.title}</h3>
                      <span className="text-xs text-gray-400 flex-shrink-0">{new Date(ann.date).toLocaleDateString('es-AR')}</span>
                    </div>
                    <p className="text-gray-600 text-sm mt-2 leading-relaxed">{ann.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
