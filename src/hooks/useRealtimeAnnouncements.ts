import { useEffect } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

/**
 * Debounced realtime announcements subscription - prevents excessive re-renders
 */
export function useRealtimeAnnouncements(onChange: (() => void) | null) {
  useEffect(() => {
    if (!onChange) return

    let timeoutId: NodeJS.Timeout | null = null

    const ch: RealtimeChannel = supabase
      .channel('announcements_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => {
        // Debounce onChange to prevent excessive updates
        if (timeoutId) clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          onChange()
        }, 500)
      })
      .subscribe()

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      void supabase.removeChannel(ch)
    }
  }, [onChange])
}
