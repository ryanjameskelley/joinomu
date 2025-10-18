"use client"

import * as React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./dialog"
import { Button } from "./button"
import { Textarea } from "./textarea"
import { Label } from "./label"
import { showToast } from "./toast"

interface SupportFeedbackDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: "support" | "feedback"
  onSubmit: (message: string, type: "support" | "feedback") => Promise<{ success: boolean; error?: string }>
}

export function SupportFeedbackDialog({
  open,
  onOpenChange,
  type,
  onSubmit
}: SupportFeedbackDialogProps) {
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!message.trim()) {
      showToast({
        title: "Message Required",
        description: "Please enter a message before submitting",
        variant: "error"
      })
      return
    }

    setLoading(true)
    try {
      const result = await onSubmit(message.trim(), type)
      
      if (result.success) {
        showToast({
          title: `${type === "support" ? "Support" : "Feedback"} Submitted`,
          description: "Your message has been sent successfully. We'll get back to you soon!",
          variant: "success"
        })
        setMessage("")
        onOpenChange(false)
      } else {
        showToast({
          title: "Submission Failed",
          description: result.error || "Failed to send your message. Please try again.",
          variant: "error"
        })
      }
    } catch (error) {
      showToast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "error"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setMessage("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {type === "support" ? "Contact Support" : "Send Feedback"}
          </DialogTitle>
          <DialogDescription>
            {type === "support" 
              ? "Tell us how we can help you. Our support team will get back to you as soon as possible."
              : "We'd love to hear your thoughts! Your feedback helps us improve JoinOmu."
            }
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message">
              {type === "support" ? "Describe your issue" : "Your feedback"}
            </Label>
            <Textarea
              id="message"
              placeholder={
                type === "support" 
                  ? "Please describe the issue you're experiencing..."
                  : "Tell us what you think about JoinOmu..."
              }
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="resize-none"
              disabled={loading}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !message.trim()}>
              {loading ? "Sending..." : "Send Message"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}