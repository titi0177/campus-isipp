import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useNotifications } from '@/components/NotificationCenter'
import { useChatMessages, useSendMessage, useTypingIndicator, useMarkMessagesAsRead, useDeleteMessage, Message } from '@/hooks/useChatMessages'
import { Send, MessageCircle, Search, Clock, Trash2, X } from 'lucide-react'

export const Route = createFileRoute('/professor/messages')({
  component: ProfessorMessagesPage,
})

type SubjectChat = {
  subjectId: string
  subjectName: string
  subjectCode: string
  studentName: string
  studentId: string
  studentUserId: string
}

function ProfessorMessagesPage() {
  const [chats, setChats] = useState<SubjectChat[]>([])
  const [selectedChat, setSelectedChat] = useState<string | null>(null)
  const [messageText, setMessageText] = useState('')
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const { addNotification } = useNotifications()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Parse selected chat to get subjectId
  const selectedSubjectId = selectedChat?.split('_')[0] || null

  // Load messages and manage realtime
  const { messages, loading: messagesLoading, typingUsers, presenceUsers, setMessages } = useChatMessages(
    selectedSubjectId,
    currentUser?.id || null
  )

  // Send message with optimistic UI
  const { sendMessage, sending } = useSendMessage(selectedSubjectId)

  // Delete message
  const { deleteMessage } = useDeleteMessage()

  // Typing indicator
  const { sendTypingIndicator, stopTyping } = useTypingIndicator(
    selectedSubjectId,
    currentUser?.id || null,
    'professor'
  )

  // Mark as read
  const { markAsRead } = useMarkMessagesAsRead()

  // Load chats on mount
  useEffect(() => {
    async function loadChats() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        setCurrentUser(user)

        const { data: professor } = await supabase
          .from('professors')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (!professor) return

        const { data: subjects } = await supabase
          .from('subjects')
          .select('id, name, code')
          .eq('professor_id', professor.id)

        if (!subjects || subjects.length === 0) {
          setChats([])
          setLoading(false)
          return
        }

        const subjectIds = subjects.map((s) => s.id)

        const { data: enrollments } = await supabase
          .from('enrollments')
          .select(`
            id,
            student:students(id, user_id, first_name, last_name),
            subject:subjects(id, name, code)
          `)
          .in('subject_id', subjectIds)

        if (!enrollments) {
          setChats([])
          setLoading(false)
          return
        }

        const chatMap = new Map<string, SubjectChat>()

        enrollments.forEach((enrollment: any) => {
          const subjectId = enrollment.subject?.id
          const studentUserId = enrollment.student?.user_id
          const studentId = enrollment.student?.id

          if (!subjectId || !studentUserId || !studentId) return

          const chatKey = `${subjectId}_${studentUserId}`
          if (!chatMap.has(chatKey)) {
            chatMap.set(chatKey, {
              subjectId,
              subjectName: enrollment.subject?.name || 'Materia',
              subjectCode: enrollment.subject?.code || '—',
              studentName: `${enrollment.student?.first_name} ${enrollment.student?.last_name}`,
              studentId,
              studentUserId,
            })
          }
        })

        // Get last message timestamp for each subject
        const { data: lastMessages } = await supabase
          .from('messages')
          .select('subject_id, created_at')
          .in('subject_id', subjectIds)
          .order('created_at', { ascending: false })

        // Build map of last message per subject
        const lastMessageMap = new Map<string, string>()
        lastMessages?.forEach((msg: any) => {
          if (!lastMessageMap.has(msg.subject_id)) {
            lastMessageMap.set(msg.subject_id, msg.created_at)
          }
        })

        // Convert to array and sort
        const chatList = Array.from(chatMap.values())
        chatList.sort((a, b) => {
          const timeA = lastMessageMap.get(a.subjectId) || new Date(0).toISOString()
          const timeB = lastMessageMap.get(b.subjectId) || new Date(0).toISOString()
          return new Date(timeB).getTime() - new Date(timeA).getTime()
        })

        setChats(chatList)
      } catch (err) {
        console.error('Error loading chats:', err)
        addNotification({
          type: 'alert',
          title: 'Error',
          message: 'No se pudieron cargar los chats',
        })
      } finally {
        setLoading(false)
      }
    }

    loadChats()
  }, [addNotification])

  // Auto scroll to bottom when new messages
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 0)
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Mark messages as read when opening chat
  useEffect(() => {
    if (!selectedChat) return

    const unreadIds = messages
      .filter((m) => m.sender_type === 'student' && !m.read)
      .map((m) => m.id)

    if (unreadIds.length > 0) {
      markAsRead(unreadIds)
    }
  }, [selectedChat, messages, markAsRead])

  // Handle message input (with typing indicator)
  const handleInputChange = (text: string) => {
    setMessageText(text)

    if (text.trim()) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      sendTypingIndicator()

      typingTimeoutRef.current = setTimeout(() => {
        stopTyping()
      }, 2000)
    }
  }

  // Handle send message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSubjectId || !messageText.trim() || !currentUser || sending) return

    const content = messageText
    setMessageText('')
    stopTyping()

    const handleOptimistic = (msg: Message) => {
      setMessages((prev) => [...prev, msg])
      scrollToBottom()
    }

    const handleSuccess = (msg: Message) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id.startsWith('opt_') && m.content === content
            ? msg
            : m
        )
      )
      addNotification({
        type: 'success',
        title: 'Mensaje enviado',
        message: 'Tu mensaje fue entregado',
      })
    }

    const handleError = (error: Error) => {
      setMessages((prev) =>
        prev.filter((m) => !(m.optimistic && m.content === content))
      )
      addNotification({
        type: 'alert',
        title: 'Error',
        message: 'No se pudo enviar el mensaje',
      })
    }

    sendMessage(content, currentUser.id, 'professor', handleOptimistic, handleSuccess, handleError)
  }

  // Handle delete message
  const handleDeleteMessage = async (messageId: string) => {
    const success = await deleteMessage(messageId)
    
    if (success) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, content: '[Mensaje eliminado]' }
            : m
        )
      )
      setDeleteConfirm(null)
      addNotification({
        type: 'success',
        title: 'Mensaje eliminado',
        message: 'El mensaje fue eliminado correctamente',
      })
    } else {
      addNotification({
        type: 'alert',
        title: 'Error',
        message: 'No se pudo eliminar el mensaje',
      })
    }
  }

  const selectedChatData = chats.find((c) => `${c.subjectId}_${c.studentUserId}` === selectedChat)
  const filteredChats = chats.filter(
    (c) =>
      c.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.subjectCode.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Get online status
  const getOnlineStatus = (): string => {
    const studentPresence = Array.from(presenceUsers.values()).find(
      (p) => p.userId === selectedChatData?.studentUserId
    )

    if (!studentPresence) return ''
    if (studentPresence.online) return 'En línea'

    const lastSeen = studentPresence.lastSeen
    if (!lastSeen) return 'Desconectado'

    const minutesAgo = Math.floor((Date.now() - lastSeen) / 60000)
    if (minutesAgo < 1) return 'Hace un momento'
    if (minutesAgo === 1) return 'Hace 1 minuto'
    if (minutesAgo < 60) return `Hace ${minutesAgo} minutos`

    const hoursAgo = Math.floor(minutesAgo / 60)
    if (hoursAgo === 1) return 'Hace 1 hora'
    if (hoursAgo < 24) return `Hace ${hoursAgo} horas`

    return 'Desconectado'
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer'
    }
    return date.toLocaleDateString('es-AR', { month: 'short', day: 'numeric' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-slate-600">Cargando chats...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h1 className="text-4xl font-bold flex items-center gap-3">
          <div className="bg-gradient-to-br from-green-100 to-green-50 p-3 rounded-lg">
            <MessageCircle size={32} className="text-green-600" />
          </div>
          Mensajes con Estudiantes
        </h1>
        <p className="text-slate-600 mt-2">Comunícate directamente con tus estudiantes</p>
      </div>

      <div className="flex gap-6 flex-1 min-h-0 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6">
        {/* Lista de chats */}
        <div className="w-80 bg-white rounded-lg shadow-md flex flex-col border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar estudiante o materia..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredChats.length === 0 ? (
              <div className="p-6 text-center text-slate-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="font-medium">No hay conversaciones</p>
                <p className="text-xs mt-1">Los estudiantes inscritos aparecerán aquí</p>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {filteredChats.map((chat) => {
                  const chatKey = `${chat.subjectId}_${chat.studentUserId}`
                  const isSelected = selectedChat === chatKey
                  const hasUnread = messages.some(
                    (m) => m.sender_type === 'student' && !m.read
                  )

                  return (
                    <button
                      key={chatKey}
                      onClick={() => setSelectedChat(chatKey)}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        isSelected
                          ? 'bg-green-600 text-white shadow-md'
                          : 'hover:bg-slate-100 text-slate-900'
                      } ${hasUnread && !isSelected ? 'bg-green-50 border-l-4 border-green-600' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className={`font-semibold text-sm ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                            {chat.studentName}
                          </div>
                          <p className={`text-xs mt-0.5 ${isSelected ? 'text-green-100' : 'text-slate-600'}`}>
                            {chat.subjectCode} - {chat.subjectName}
                          </p>
                        </div>
                        {hasUnread && !isSelected && (
                          <div className="flex-shrink-0 h-3 w-3 rounded-full bg-red-600 mt-1"></div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Chat activo */}
        <div className="flex-1 flex flex-col min-h-0 bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden">
          {selectedChatData ? (
            <>
              {/* Header */}
              <div className="bg-gradient-to-r from-green-600 to-green-700 p-5 text-white flex justify-between items-center">
                <div>
                  <h2 className="font-bold text-lg">{selectedChatData.studentName}</h2>
                  <p className="text-sm text-green-100">{selectedChatData.subjectCode}</p>
                  <p className="text-xs text-green-200 mt-1">{selectedChatData.subjectName}</p>
                  <p className="text-xs text-green-200/80 mt-0.5 flex items-center gap-1">
                    <Clock size={12} />
                    {getOnlineStatus()}
                  </p>
                </div>
              </div>

              {/* Mensajes */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-slate-50 to-white">
                {messagesLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-slate-600">Cargando mensajes...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center">
                    <div>
                      <MessageCircle className="w-16 h-16 mx-auto text-slate-300 mb-3" />
                      <p className="text-slate-500 font-medium">Inicia una conversación</p>
                      <p className="text-xs text-slate-400 mt-1">Sé el primero en escribir un mensaje</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg, idx) => {
                      const isProfessor = msg.sender_type === 'professor'
                      const isDeleted = msg.content === '[Mensaje eliminado]'
                      const isOwnMessage = msg.sender_id === currentUser?.id
                      const showDate =
                        idx === 0 ||
                        formatDate(msg.created_at) !==
                          formatDate(messages[idx - 1].created_at)

                      return (
                        <div key={msg.id}>
                          {showDate && (
                            <div className="text-center my-4">
                              <span className="text-xs text-slate-500 bg-slate-200/50 px-3 py-1 rounded-full">
                                {formatDate(msg.created_at)}
                              </span>
                            </div>
                          )}
                          <div
                            className={`flex ${isProfessor ? 'justify-end' : 'justify-start'} items-end gap-2 group`}
                            onMouseEnter={() => setHoveredMessageId(msg.id)}
                            onMouseLeave={() => setHoveredMessageId(null)}
                          >
                            {!isProfessor && (
                              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                                E
                              </div>
                            )}
                            <div className="relative">
                              <div
                                className={`max-w-xs px-4 py-2 rounded-lg ${
                                  isProfessor
                                    ? 'bg-green-600 text-white rounded-br-none'
                                    : 'bg-slate-200 text-slate-900 rounded-bl-none'
                                } ${msg.optimistic ? 'opacity-70' : ''} ${
                                  isDeleted ? 'italic opacity-60' : ''
                                }`}
                              >
                                <p className={`text-sm break-words ${isDeleted ? 'text-slate-500' : ''}`}>
                                  {msg.content}
                                </p>
                                <p
                                  className={`text-xs mt-1 flex items-center gap-1 ${
                                    isProfessor ? 'text-green-100' : 'text-slate-600'
                                  }`}
                                >
                                  {formatTime(msg.created_at)}
                                  {isProfessor && msg.read && '✓✓'}
                                </p>
                              </div>

                              {/* Delete button - show only for own messages and not deleted */}
                              {isOwnMessage && !isDeleted && hoveredMessageId === msg.id && (
                                <button
                                  onClick={() => setDeleteConfirm(msg.id)}
                                  className="absolute -right-10 top-0 p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Eliminar mensaje"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                            {isProfessor && (
                              <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                                P
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}

                    {/* Typing indicator */}
                    {Object.entries(typingUsers).length > 0 && (
                      <div className="flex items-end gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                          E
                        </div>
                        <div className="bg-slate-200 text-slate-900 rounded-lg rounded-bl-none px-4 py-2 flex items-center gap-1">
                          <span className="text-sm">{Object.values(typingUsers)[0]?.name} está escribiendo</span>
                          <div className="flex gap-1 ml-2">
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100" />
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200" />
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="border-t border-slate-200 p-4 bg-white">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={messageText}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    className="form-input flex-1 rounded-lg"
                  />
                  <button
                    type="submit"
                    disabled={sending || !messageText.trim()}
                    className="btn-primary p-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={20} />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 mx-auto text-slate-300 mb-3" />
                <p className="font-medium">Selecciona un estudiante</p>
                <p className="text-sm mt-1">Elige una conversación para comenzar a chatear</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-4">
            <div className="flex items-start gap-4">
              <div className="bg-red-100 p-3 rounded-lg">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-slate-900">Eliminar mensaje</h3>
                <p className="text-slate-600 text-sm mt-1">
                  ¿Estás seguro de que deseas eliminar este mensaje? Esta acción no se puede deshacer.
                </p>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <X size={18} />
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleDeleteMessage(deleteConfirm)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 size={18} />
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
