import { useCallback } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * Hook centralizado para manejar logout
 * Evita duplicación en Sidebar, TopNav, etc.
 */
export function useLogout() {
  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut()
      // Redirigir solo después de que el logout sea exitoso
      window.location.href = '/'
    } catch (error) {
      console.error('Error during logout:', error)
      // En caso de error, aún redirigir para no quedar atrapado
      window.location.href = '/'
    }
  }, [])

  return { logout }
}
