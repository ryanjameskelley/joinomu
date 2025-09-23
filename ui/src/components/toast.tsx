"use client"

import { toast } from "sonner"
import { Database, AlertCircle, Info, AlertTriangle } from "lucide-react"

export interface ToastOptions {
  title: string
  description?: string
  variant?: 'success' | 'error' | 'info' | 'warning'
  action?: {
    label: string
    onClick: () => void
  }
}

export function showToast({ title, description, variant = 'info', action }: ToastOptions) {
  const getIcon = () => {
    switch (variant) {
      case 'success':
        return <Database className="h-4 w-4" />
      case 'error':
        return <AlertCircle className="h-4 w-4" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />
      case 'info':
      default:
        return <Info className="h-4 w-4" />
    }
  }

  return toast(title, {
    description,
    action,
    icon: getIcon()
  })
}

export function dismissToast(toastId: string | number) {
  toast.dismiss(toastId)
}

// Specific toast molecules for common use cases
export const MedicationToast = {
  saved: (medicationName: string) =>
    showToast({
      title: "Saved",
      description: `${medicationName} payment and shipping information has been saved`,
      variant: 'success'
    }),

  error: (medicationName: string, error: string) =>
    showToast({
      title: "Update Failed",
      description: `Failed to update ${medicationName}: ${error}`,
      variant: 'error'
    }),

  saving: (medicationName: string) =>
    showToast({
      title: "Saving...",
      description: `Updating ${medicationName} information`,
      variant: 'info'
    })
}