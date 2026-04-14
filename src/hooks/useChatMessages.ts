import { useEffect, useRef, useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getChatRealtimeManager } from '@/lib/realtimeChat'

export type Message = {
  id: string
  content: string
  sender_type: 'student' | 'professor'
  sender_id: string
  created_at: string
  read: boolean
  optimistic?: boolean
  pending?: boolean
}

type TypingState = {
  [userId: string]: {
    name: string
    stoppedAt?: number
  }
}

type PresenceUser = {
  userId: string
  online: boolean
  lastSeen?: number
}

/**
 * Hook to manage chat messages with realtime updates
 */
export function useChatMessages(subjectId: string | null, currentUserId: string | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [typingUsers, setTypingUsers] = useState<TypingState>({})
  const [presenceUsers, setPresenceUsers] = useState<Map<string, PresenceUser>>(new Map())
  const unsubscribeRef = useRef<(() => void)[]>([])
  const realtimeManagerRef = useRef(getChatRealtimeManager())

  // Load initial messages
  const loadMessages = useCallback(async () => {
    if (!subjectId) return

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('subject_id', subjectId)
        .order('created_at', { ascending: true })

      if (error) throw error

      setMessages(data || [])
    } catch (err) {
      console.error('Error loading messages:', err)
    } finally {
      setLoading(false)
    }
  }, [subjectId])

  // Handle new message insertion
  const handleMessageInsert = useCallback(
    (payload: any) => {
      const newMessage = payload.new as Message

      // Don't duplicate optimistic messages
      setMessages((prev) => {
        const hasOptimistic = prev.some((m) => m.id === newMessage.id)
        if (hasOptimistic) {
          return prev.map((m) =>
            m.id === newMessage.id
              ? { ...newMessage, optimistic: false, pending: false }
              : m
          )
        }
        return [...prev, newMessage]
      })
    },
    []
  )

  // Handle message updates (like read status)
  const handleMessageUpdate = useCallback((payload: any) => {
    const updatedMessage = payload.new as Message

    setMessages((prev) =>
      prev.map((m) => (m.id === updatedMessage.id ? updatedMessage : m))
    )
  }, [])

  // Handle typing indicators
  const handleTyping = useCallback((payload: any) => {
    const { userId, senderType, event } = payload.payload || payload
    const isStop = event === 'typing-stop'

    if (isStop) {
      setTypingUsers((prev) => {
        const next = { ...prev }
        delete next[userId]
        return next
      })
    } else {
      setTypingUsers((prev) => ({
        ...prev,
        [userId]: {
          name: senderType === 'professor' ? 'Profesor' : 'Alumno',
          stoppedAt: Date.now(),
        },
      }))
    }
  }, [])

  // Handle presence changes
  const handlePresenceChange = useCallback((presenceList: any[]) => {
    const newPresence = new Map<string, PresenceUser>()

    presenceList.forEach((user) => {
      newPresence.set(user.userId, {
        userId: user.userId,
        online: user.online !== false,
        lastSeen: user.lastSeen,
      })
    })

    setPresenceUsers(newPresence)
  }, [])

  // Setup subscriptions
  useEffect(() => {
    unsubscribeRef.current = []

    if (!subjectId || !currentUserId) {
      setLoading(false)
      return
    }

    // Load initial messages
    loadMessages()

    // Subscribe to all events (messages, typing, presence) at once
    const unsub = realtimeManagerRef.current.subscribeToMessages(
      subjectId,
      handleMessageInsert,
      handleMessageUpdate,
      handleTyping,
      handlePresenceChange
    )
    unsubscribeRef.current.push(unsub)

    return () => {
      unsubscribeRef.current.forEach((u) => u())
    }
  }, [subjectId, currentUserId, loadMessages, handleMessageInsert, handleMessageUpdate, handleTyping, handlePresenceChange])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      realtimeManagerRef.current.cleanup()
    }
  }, [])

  return {
    messages,
    loading,
    typingUsers,
    presenceUsers,
    setMessages,
  }
}

/**
 * Hook to send a message with optimistic UI
 */
export function useSendMessage(subjectId: string | null) {
  const [sending, setSending] = useState(false)

  const sendMessage = useCallback(
    async (
      content: string,
      senderId: string,
      senderType: 'student' | 'professor',
      onOptimistic: (message: Message) => void,
      onSuccess: (message: Message) => void,
      onError: (error: Error) => void
    ) => {
      if (!subjectId || !content.trim()) return

      setSending(true)

      // Create optimistic message
      const optimisticId = `opt_${Date.now()}_${Math.random()}`
      const optimisticMessage: Message = {
        id: optimisticId,
        content: content.trim(),
        sender_type: senderType,
        sender_id: senderId,
        created_at: new Date().toISOString(),
        read: true,
        optimistic: true,
        pending: true,
      }

      // Show optimistic message immediately
      onOptimistic(optimisticMessage)

      try {
        // Send to Supabase
        const { data, error } = await supabase
          .from('messages')
          .insert({
            subject_id: subjectId,
            sender_id: senderId,
            sender_type: senderType,
            content: content.trim(),
            read: true,
          })
          .select()
          .single()

        if (error) throw error

        // Replace optimistic message with real one
        onSuccess(data)
      } catch (err) {
        const error = err as Error
        console.error('Error sending message:', error)
        onError(error)
      } finally {
        setSending(false)
      }
    },
    [subjectId]
  )

  return { sendMessage, sending }
}

/**
 * Hook to manage typing indicators
 */
export function useTypingIndicator(subjectId: string | null, userId: string | null, senderType: 'student' | 'professor') {
  const realtimeManagerRef = useRef(getChatRealtimeManager())
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const sendTypingIndicator = useCallback(async () => {
    if (!subjectId || !userId) return

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Send typing indicator
    await realtimeManagerRef.current.sendTypingIndicator(
      subjectId,
      userId,
      senderType
    )

    // Auto-stop after inactivity
    typingTimeoutRef.current = setTimeout(async () => {
      // Typing will auto-stop in the manager
    }, 2000)
  }, [subjectId, userId, senderType])

  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
  }, [])

  return { sendTypingIndicator, stopTyping }
}

/**
 * Hook to mark messages as read
 */
export function useMarkMessagesAsRead() {
  const markAsRead = useCallback(async (messageIds: string[]) => {
    if (messageIds.length === 0) return

    try {
      await supabase
        .from('messages')
        .update({ read: true })
        .in('id', messageIds)
    } catch (err) {
      console.error('Error marking messages as read:', err)
    }
  }, [])

  return { markAsRead }
}

/**
 * Hook to delete a message
 */
export function useDeleteMessage() {
  const deleteMessage = useCallback(async (messageId: string): Promise<boolean> => {
    try {
      // Soft delete: set content to empty and mark as deleted
      const { error } = await supabase
        .from('messages')
        .update({ 
          content: '[Mensaje eliminado]',
          read: true 
        })
        .eq('id', messageId)

      if (error) throw error
      return true
    } catch (err) {
      console.error('Error deleting message:', err)
      return false
    }
  }, [])

  return { deleteMessage }
}
