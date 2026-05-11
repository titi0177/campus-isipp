import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Announcement } from '@/types'

export function useAnnouncementsOnLogin(userId: string | null, studentId: string | null) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!userId || !studentId) return

    const loadAnnouncements = async () => {
      setLoading(true)
      try {
        // 1. Obtener anuncios marcados para mostrar al login
        const { data: allAnnouncements, error: announcementsError } = await supabase
          .from('announcements')
          .select('*')
          .eq('show_at_login', true)
          .order('date', { ascending: false })

        if (announcementsError) {
          console.error('[Anuncios Login] Error cargando anuncios:', announcementsError)
          return
        }

        if (!allAnnouncements || allAnnouncements.length === 0) {
          console.log('[Anuncios Login] Sin anuncios para mostrar')
          return
        }

        // 2. Obtener IDs de anuncios ya vistos por este estudiante
        const { data: viewedData, error: viewedError } = await supabase
          .from('announcement_views')
          .select('announcement_id')
          .eq('student_id', studentId)

        if (viewedError) {
          console.warn('[Anuncios Login] Error cargando vistas:', viewedError)
          // Continuar aunque falle - mostrar todos
        }

        const viewedIds = new Set(viewedData?.map(v => v.announcement_id) || [])

        // 3. Filtrar anuncios no vistos
        const unviewedAnnouncements = allAnnouncements.filter(
          a => !viewedIds.has(a.id)
        ) as Announcement[]

        if (unviewedAnnouncements.length > 0) {
          setAnnouncements(unviewedAnnouncements)
          setShowModal(true)
          setCurrentIndex(0)
          console.log('[Anuncios Login] ✅ Cargados', unviewedAnnouncements.length, 'anuncios nuevos')
        } else {
          console.log('[Anuncios Login] Todos los anuncios ya fueron vistos')
        }
      } catch (err) {
        console.error('[Anuncios Login] Error:', err)
      } finally {
        setLoading(false)
      }
    }

    loadAnnouncements()
  }, [userId, studentId])

  const handleNext = () => {
    if (currentIndex < announcements.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const handleClose = async () => {
    // Marcar todos los anuncios como vistos al cerrar
    if (announcements.length > 0 && studentId) {
      try {
        const announcementIds = announcements.map(a => a.id)
        
        // Insertar vistas para cada anuncio
        const views = announcementIds.map(announcementId => ({
          student_id: studentId,
          announcement_id: announcementId,
        }))

        const { error } = await supabase
          .from('announcement_views')
          .insert(views)
          .select()

        if (error) {
          console.warn('[Anuncios Login] Error registrando vistas:', error)
        } else {
          console.log('[Anuncios Login] ✅ Vistas registradas para', announcementIds.length, 'anuncios')
        }
      } catch (err) {
        console.error('[Anuncios Login] Error al marcar como visto:', err)
      }
    }

    setShowModal(false)
  }

  return {
    announcements,
    currentIndex,
    showModal,
    loading,
    handleNext,
    handlePrev,
    handleClose,
    currentAnnouncement: announcements[currentIndex] || null,
  }
}
