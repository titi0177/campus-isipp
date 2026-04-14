import { useEffect } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

/**
 * Debounced realtime final exams subscription - prevents excessive re-renders
 */
export function useRealtimeFinalExams(onChange: (() => void) | null) {
  useEffect(() => {
    if (!onChange) return

    let timeoutId: NodeJS.Timeout | null = null

    const ch: RealtimeChannel = supabase
      .channel('final_exams_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'final_exams' }, () => {
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
