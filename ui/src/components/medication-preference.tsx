"use client"

import * as React from "react"
import { TrendingUp, BadgeAlert, BadgeCheck } from "lucide-react"
import { cn } from "../lib/utils"
import { Badge } from "./badge"

export interface MedicationInfo {
  name: string
  dosage: string
  frequency: string
  status: 'pending' | 'approved' | 'denied'
  category: 'weightloss' | 'mens-health' | 'general'
  description?: string
  averageResults?: {
    weightLoss: string
    bloodSugar: string
    satisfaction: string
  }
}

export interface MedicationPreferenceProps {
  medication: MedicationInfo
  paymentRequired?: boolean
  paymentDueDate?: string
  showAverageResults?: boolean
  className?: string
}

export function MedicationPreference({
  medication,
  paymentRequired = false,
  paymentDueDate = "December 15, 2024",
  showAverageResults = true,
  className
}: MedicationPreferenceProps) {
  const statusConfig = {
    pending: {
      variant: "pending" as const,
      icon: BadgeAlert,
      text: "Pending Provider Approval"
    },
    approved: {
      variant: "default" as const,
      icon: BadgeCheck,
      text: "Approved by Provider"
    },
    denied: {
      variant: "outline" as const,
      icon: null,
      text: "Not Approved",
      className: "bg-red-100 text-red-800 border-red-200"
    }
  }

  const config = statusConfig[medication.status]
  const StatusIcon = config.icon

  return (
    <div className={cn("bg-gray-50 rounded-lg p-4 space-y-3", className)}>
      <div className="space-y-2">
        <h3 className="font-semibold text-base">{medication.name}</h3>
        <Badge 
          variant={config.variant}
          className={cn("text-xs w-fit flex items-center gap-1", config.className)}
        >
          {StatusIcon && <StatusIcon className="h-3 w-3" />}
          {config.text}
        </Badge>
      </div>
      <div className="text-sm text-muted-foreground">
        <p><span className="font-medium">Dosage:</span> {medication.dosage}</p>
      </div>
      {medication.description && (
        <p className="text-sm text-muted-foreground">{medication.description}</p>
      )}

      {medication.averageResults && showAverageResults && (
        <div className="bg-blue-50 rounded-lg p-4 mt-3">
          <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Average Results from Clinical Studies for {medication.name}
          </h4>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Weight Loss:</span>
              <span className="font-medium">{medication.averageResults.weightLoss}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Blood Sugar Improvement:</span>
              <span className="font-medium">{medication.averageResults.bloodSugar}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Patient Satisfaction:</span>
              <span className="font-medium">{medication.averageResults.satisfaction}</span>
            </div>
          </div>
        </div>
      )}

      {paymentRequired && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
          <div className="flex items-start gap-2">
            <div className="text-red-600 text-sm font-medium">
              Payment Required
            </div>
          </div>
          <p className="text-sm text-red-700 mt-1">
            {medication.status === 'pending' 
              ? `Payment is required before ${paymentDueDate} to receive this medication once approved.`
              : `Payment is required before ${paymentDueDate} to continue receiving this medication.`
            }
          </p>
        </div>
      )}
    </div>
  )
}