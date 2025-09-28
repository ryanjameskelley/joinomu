"use client"

import * as React from "react"
import { Calendar, Clock, CheckCircle, Edit3 } from "lucide-react"
import { cn } from "../lib/utils"
import { Button } from "./button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"
import { MedicationPreference, type MedicationInfo } from "./medication-preference"

export interface OnboardingCompletionProps {
  /**
   * Selected medication information
   */
  selectedMedication: MedicationInfo
  /**
   * Scheduled appointment information
   */
  scheduledAppointment: {
    doctorName: string
    doctorTitle: string
    date: string
    time: string
    type: string
  }
  /**
   * Callback for editing medication selection
   */
  onEditMedication?: () => void
  /**
   * Callback for rescheduling appointment
   */
  onRescheduleAppointment?: () => void
  /**
   * Callback for continuing to dashboard
   */
  onContinue?: () => void
  /**
   * Whether to show average results for medication
   */
  showAverageResults?: boolean
  /**
   * Whether payment is required
   */
  paymentRequired?: boolean
  /**
   * Payment due date
   */
  paymentDueDate?: string
  /**
   * Additional CSS classes
   */
  className?: string
}

function AppointmentCard({
  appointment,
  onReschedule,
  className
}: {
  appointment: OnboardingCompletionProps['scheduledAppointment']
  onReschedule?: () => void
  className?: string
}) {
  // Create a MedicationInfo object for the appointment using the existing component
  const appointmentAsMedication: MedicationInfo = {
    name: 'Upcoming Appointment',
    dosage: 'Initial Consultation',
    frequency: `${appointment.date} at ${appointment.time}`,
    status: 'approved',
    category: 'weightloss',
    description: `${appointment.type} with ${appointment.doctorName}, ${appointment.doctorTitle} to discuss your treatment plan and review your medication preferences.`,
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Your Scheduled Visit</h2>
        <Button
          variant="ghost"
          size="sm"
          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
          onClick={onReschedule}
        >
          <Edit3 className="h-4 w-4 mr-1" />
          Reschedule
        </Button>
      </div>
      
      <MedicationPreference
        medication={appointmentAsMedication}
        showAverageResults={false}
      />
      
      <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-md">
        <div className="flex items-start gap-2">
          <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-blue-900">What to expect:</p>
            <ul className="mt-1 space-y-1 text-blue-700">
              <li>• You'll receive appointment reminders via email and SMS</li>
              <li>• Join link will be sent 30 minutes before your appointment</li>
              <li>• Have your medical history and questions ready</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export function OnboardingCompletion({
  selectedMedication,
  scheduledAppointment,
  onEditMedication,
  onRescheduleAppointment,
  onContinue,
  showAverageResults = true,
  paymentRequired = false,
  paymentDueDate,
  className
}: OnboardingCompletionProps) {
  return (
    <div className={cn("w-full max-w-2xl mx-auto space-y-8", className)}>
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold">Onboarding Complete!</h1>
        <p className="text-muted-foreground">
          You're all set! Here's a summary of your selections and next steps.
        </p>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Selected Medication */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Your Selected Medication</h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
              onClick={onEditMedication}
            >
              <Edit3 className="h-4 w-4 mr-1" />
              Edit Selection
            </Button>
          </div>
          
          <MedicationPreference
            medication={selectedMedication}
            showAverageResults={showAverageResults}
            paymentRequired={paymentRequired}
            paymentDueDate={paymentDueDate}
          />
          
          <div className="text-xs text-muted-foreground bg-amber-50 p-3 rounded-md">
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-amber-900">Next Steps:</p>
                <p className="mt-1 text-amber-700">
                  Your provider will review your medical history and approve your medication within 24-48 hours. 
                  You'll receive an email notification with next steps.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Scheduled Appointment */}
        <AppointmentCard
          appointment={scheduledAppointment}
          onReschedule={onRescheduleAppointment}
        />
      </div>

      {/* Action Buttons */}
      <div className="pt-6 border-t">
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={onContinue}
            className="flex-1"
            size="lg"
          >
            Continue to Dashboard
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="sm:w-auto"
            onClick={() => window.print()}
          >
            Print Summary
          </Button>
        </div>
      </div>
    </div>
  )
}