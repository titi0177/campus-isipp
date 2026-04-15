import { useState } from 'react'

// Hook deshabilitado: retorna 0 mensajes no leídos
// La funcionalidad de chat está temporalmente deshabilitada
export function useUnreadMessages() {
  const [unreadCount] = useState(0)
  return unreadCount
}
