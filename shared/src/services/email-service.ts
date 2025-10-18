import { supabase } from '../config/supabase'

export interface SupportFeedbackMessage {
  type: 'support' | 'feedback'
  message: string
  userEmail: string
  userName: string
  timestamp: string
}

export const emailService = {
  async sendSupportFeedback(data: {
    type: 'support' | 'feedback'
    message: string
    userEmail: string
    userName: string
  }): Promise<{ success: boolean; error?: string }> {
    try {
      // Store the message in a support_feedback_messages table
      const { error } = await supabase
        .from('support_feedback_messages')
        .insert({
          type: data.type,
          message: data.message,
          user_email: data.userEmail,
          user_name: data.userName,
          sent_to: 'ryan@joinomu.com',
          created_at: new Date().toISOString()
        })

      if (error) {
        console.error('Failed to store support/feedback message:', error)
        return {
          success: false,
          error: 'Failed to store message'
        }
      }

      // For now, just log the message (in production, this would trigger an email notification)
      console.log(`📧 ${data.type.toUpperCase()} MESSAGE from ${data.userName} (${data.userEmail}):`)
      console.log(`Message: ${data.message}`)
      console.log(`To be sent to: ryan@joinomu.com`)

      return { success: true }
    } catch (error) {
      console.error('Exception in sendSupportFeedback:', error)
      return {
        success: false,
        error: 'An unexpected error occurred'
      }
    }
  }
}