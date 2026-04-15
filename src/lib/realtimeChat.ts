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
  private channelSubscriptions: Map<string, boolean> = new Map() // Track subscription status

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
    this.channelSubscriptions.set(channelName, false) // Mark as not subscribed
    return channel
  }

  /**
   * Subscribe to message updates for a subject
   * Register ALL .on() handlers BEFORE calling .subscribe()
   * FIX: Check subscription status to prevent double-subscribing
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

    // Check if this channel is already subscribed
    if (this.channelSubscriptions.get(channelName) === true) {
      // Channel already subscribed, just return unsubscribe function
      return () => {
        this.unsubscribeFromMessages(subjectId)
      }
    }

    // Register ALL handlers BEFORE subscribe (THIS IS CRITICAL)
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
          // Mark as subscribed
          this.channelSubscriptions.set(channelName, true)
          
          // Track user presence after subscribe
          const user = supabase.auth.user()
          if (user?.id) {
            channel.track({
              userId: user.id,
              subjectId,
              online: true,
              lastSeen: Date.now(),
            })
          }
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`Failed to subscribe to messages for subject ${subjectId}`)
          // Mark as failed subscription
          this.channelSubscriptions.set(channelName, false)
        }
      })

    // Return unsubscribe function
    return () => {
      this.unsubscribeFromMessages(subjectId)
    }
  }

  /**
   * Unsubscribe from a channel safely
   */
  private unsubscribeFromMessages(subjectId: string): void {
    const channelName = `chat:${subjectId}`
    const channel = this.channels.get(channelName)

    if (channel) {
      try {
        channel.unsubscribe()
      } catch (err) {
        console.warn(`Error unsubscribing from ${channelName}:`, err)
      }

      this.channels.delete(channelName)
      this.subscribedChannels.delete(channelName)
      this.channelSubscriptions.set(channelName, false)
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

    try {
      // Send typing event
      await channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: { subjectId, userId, senderType },
      })

      // Auto-stop typing after 2 seconds of inactivity
      const timer = setTimeout(async () => {
        try {
          await channel.send({
            type: 'broadcast',
            event: 'typing-stop',
            payload: { subjectId, userId },
          })
        } catch (err) {
          console.warn('Error sending typing-stop event:', err)
        }
      }, 2000)

      this.typingTimers.set(subjectId, timer)
    } catch (err) {
      console.warn('Error sending typing indicator:', err)
    }
  }

  /**
   * Clean up all channels
   */
  cleanup(): void {
    this.channels.forEach((channel) => {
      try {
        channel.untrack()
        channel.unsubscribe()
      } catch (err) {
        console.warn('Error cleaning up channel:', err)
      }
    })
    this.channels.clear()
    this.subscribedChannels.clear()
    this.channelSubscriptions.clear()

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
