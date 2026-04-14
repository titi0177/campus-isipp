import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from './supabase'

type TypingPayload = {
  subjectId: string
  userId: string
  senderType: 'student' | 'professor'
}

type PresenceState = {
  userId: string
  subjectId: string
  online: boolean
  lastSeen: number
}

export class ChatRealtimeManager {
  private channels: Map<string, RealtimeChannel> = new Map()
  private typingTimers: Map<string, NodeJS.Timeout> = new Map()
  private subscribedChannels: Set<string> = new Set()

  /**
   * Create or get a channel for a specific subject
   */
  getOrCreateChannel(subjectId: string): RealtimeChannel {
    const channelName = `chat:${subjectId}`

    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)!
    }

    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { ack: true },
        presence: { key: `presence:${subjectId}` },
      },
    })

    this.channels.set(channelName, channel)
    return channel
  }

  /**
   * Subscribe to message updates for a subject
   * Register ALL .on() handlers BEFORE calling .subscribe()
   */
  subscribeToMessages(
    subjectId: string,
    onMessageInsert: (payload: any) => void,
    onMessageUpdate: (payload: any) => void,
    onTyping: (payload: any) => void,
    onPresenceChange: (state: PresenceState[]) => void,
  ): () => void {
    const channelName = `chat:${subjectId}`
    const channel = this.getOrCreateChannel(subjectId)

    // Only subscribe once per channel
    if (!this.subscribedChannels.has(channelName)) {
      // Register ALL handlers BEFORE subscribe
      channel
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `subject_id=eq.${subjectId}`,
          },
          onMessageInsert,
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages',
            filter: `subject_id=eq.${subjectId}`,
          },
          onMessageUpdate,
        )
        .on('broadcast', { event: 'typing' }, onTyping)
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState()
          const presenceList: PresenceState[] = []

          Object.values(state).forEach((presences: any) => {
            if (Array.isArray(presences)) {
              presences.forEach((presence) => {
                presenceList.push(presence)
              })
            }
          })

          onPresenceChange(presenceList)
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            // Track user presence after subscribe
            const userId = supabase.auth.user()?.id
            if (userId) {
              channel.track({
                userId,
                subjectId,
                online: true,
                lastSeen: Date.now(),
              })
            }
          } else if (status === 'CHANNEL_ERROR') {
            console.error(`Failed to subscribe to messages for subject ${subjectId}`)
          }
        })

      this.subscribedChannels.add(channelName)
    }

    // Return unsubscribe function
    return () => {
      channel.unsubscribe()
      this.channels.delete(channelName)
      this.subscribedChannels.delete(channelName)
    }
  }

  /**
   * Send typing indicator
   */
  async sendTypingIndicator(
    subjectId: string,
    userId: string,
    senderType: 'student' | 'professor',
  ): Promise<void> {
    const channel = this.getOrCreateChannel(subjectId)

    // Clear existing timer for this subject
    if (this.typingTimers.has(subjectId)) {
      clearTimeout(this.typingTimers.get(subjectId)!)
    }

    // Send typing event
    await channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { subjectId, userId, senderType },
    })

    // Auto-stop typing after 2 seconds of inactivity
    const timer = setTimeout(async () => {
      await channel.send({
        type: 'broadcast',
        event: 'typing-stop',
        payload: { subjectId, userId },
      })
    }, 2000)

    this.typingTimers.set(subjectId, timer)
  }

  /**
   * Clean up all channels
   */
  cleanup(): void {
    this.channels.forEach((channel) => {
      channel.untrack()
      channel.unsubscribe()
    })
    this.channels.clear()
    this.subscribedChannels.clear()

    this.typingTimers.forEach((timer) => {
      clearTimeout(timer)
    })
    this.typingTimers.clear()
  }
}

// Singleton instance
let realtimeManager: ChatRealtimeManager | null = null

export function getChatRealtimeManager(): ChatRealtimeManager {
  if (!realtimeManager) {
    realtimeManager = new ChatRealtimeManager()
  }
  return realtimeManager
}
