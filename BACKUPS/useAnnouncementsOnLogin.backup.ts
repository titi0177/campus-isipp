import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Announcement } from '@/types'

export function useAnnouncementsOnLogin(userId: string | null) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!userId) return

    const loadAnnouncements = async () => {
      setLoading(true)
      try {
        // Query anuncios marcados para mostrar al login
        const { data, error } = await supabase
          .from('announcements')
          .select('*')
          .eq('show_at_login', true)
          .order('date', { ascending: false })

        if (!error && data && data.length > 0) {
          setAnnouncements(data as Announcement[])
          setShowModal(true)
          setCurrentIndex(0)
          console.log('[Anuncios Login] ✅ Cargados', data.length, 'anuncios')
        } else {
          console.log('[Anuncios Login] Sin anuncios para mostrar')
        }
      } catch (err) {
        console.error('[Anuncios Login] Error:', err)
      } finally {
        setLoading(false)
      }
    }

    loadAnnouncements()
  }, [userId])

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

  const handleClose = () => {
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
