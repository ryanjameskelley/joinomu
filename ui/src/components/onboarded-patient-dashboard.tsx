"use client"

import * as React from "react"
import { Clock, TrendingUp, Users, CalendarDays, Cross, BadgeAlert, BadgeCheck } from "lucide-react"
import { cn } from "../lib/utils"
import { Button } from "./button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"
import { Badge } from "./badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select"

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

export interface VisitInfo {
  doctorName: string
  doctorTitle: string
  date: string
  time: string
  type: string
  status: 'scheduled' | 'confirmed' | 'pending'
  medicationName?: string
  medicationDosage?: string
  medicationCategory?: 'weightloss' | 'mens-health' | 'general'
}

// Keep for backward compatibility
export interface AppointmentInfo extends VisitInfo {}

export interface OnboardedPatientDashboardProps {
  medications?: MedicationInfo[]
  visits?: VisitInfo[]
  appointment?: AppointmentInfo // Keep for backward compatibility
  selectedCategory?: 'weightloss' | 'mens-health' | 'all'
  onCategoryChange?: (category: 'weightloss' | 'mens-health' | 'all') => void
  onRescheduleVisit?: (visit: VisitInfo) => void
  onRescheduleAppointment?: () => void // Keep for backward compatibility
  onMedicationAction?: () => void
  showAverageResults?: boolean
  paymentRequired?: boolean
  paymentDueDate?: string
  className?: string
  variant?: 'medication-only' | 'visit-only' | 'appointment-only' | 'both'
}

function MedicationCard({ 
  medications, 
  onMedicationAction,
  showAverageResults = true,
  paymentRequired = false,
  paymentDueDate = "December 15, 2024",
  className 
}: { 
  medications: MedicationInfo[]
  onMedicationAction?: () => void
  showAverageResults?: boolean
  paymentRequired?: boolean
  paymentDueDate?: string
  className?: string 
}) {
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

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg">Medication Preferences</CardTitle>
        </div>
        <CardDescription>
          Your selected medications and treatment plans
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 flex flex-col">
        {medications.map((medication, index) => {
          const config = statusConfig[medication.status]
          const StatusIcon = config.icon
          
          return (
            <div key={index} className="bg-gray-50 rounded-lg p-4 space-y-3">
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
                <div className="text-red-600 text-sm font-medium">Payment Required</div>
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
        })}

        <div className="flex-1" />
        {medications.some(med => med.status === 'pending') && (
          <div className="pt-4 border-t mt-auto">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={onMedicationAction}
            >
              Change Medication Preferences
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function VisitsCard({ 
  visits, 
  onRescheduleVisit,
  className 
}: { 
  visits: VisitInfo[]
  onRescheduleVisit?: (visit: VisitInfo) => void
  className?: string 
}) {
  const statusColors = {
    scheduled: "bg-blue-100 text-blue-800 border-blue-200",
    confirmed: "bg-green-100 text-green-800 border-green-200",
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200"
  }

  const statusText = {
    scheduled: "Scheduled",
    confirmed: "Confirmed", 
    pending: "Pending Confirmation"
  }

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg">Visits</CardTitle>
        </div>
        <CardDescription>
          Your upcoming visits with healthcare providers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 flex flex-col">
        {visits.map((visit, index) => (
          <div key={index} className="bg-gray-50 rounded-lg p-4 space-y-4">
            <div className="flex items-center gap-3">
              <Users className="h-4 w-4" />
              <div className="flex-1">
                <p className="font-semibold">{visit.doctorName}</p>
                <p className="text-sm text-muted-foreground">{visit.doctorTitle}</p>
                {visit.medicationName && (
                  <div className="flex items-center gap-2 mt-1">
                    <Cross className="h-3 w-3" />
                    <span className="text-xs text-muted-foreground">
                      {visit.medicationName} {visit.medicationDosage}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <CalendarDays className="h-4 w-4" />
              <div>
                <p className="font-medium">{visit.date}</p>
                <p className="text-sm text-muted-foreground">{visit.type}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4" />
              <div className="flex items-center gap-2">
                <p className="font-medium">{visit.time}</p>
                <Badge 
                  variant="outline" 
                  className={cn("text-xs", statusColors[visit.status])}
                >
                  {statusText[visit.status]}
                </Badge>
              </div>
            </div>

            <div className="pt-2 border-t">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => onRescheduleVisit?.(visit)}
              >
                Reschedule Visit
              </Button>
            </div>
          </div>
        ))}

        <div className="flex-1" />
      </CardContent>
    </Card>
  )
}

// Legacy AppointmentCard for backward compatibility
function AppointmentCard({ 
  appointment, 
  onRescheduleAppointment,
  className 
}: { 
  appointment: AppointmentInfo
  onRescheduleAppointment?: () => void
  className?: string 
}) {
  const statusColors = {
    scheduled: "bg-blue-100 text-blue-800 border-blue-200",
    confirmed: "bg-green-100 text-green-800 border-green-200",
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200"
  }

  const statusText = {
    scheduled: "Scheduled",
    confirmed: "Confirmed", 
    pending: "Pending Confirmation"
  }

  return (
    <VisitsCard 
      visits={[appointment]}
      onRescheduleVisit={() => onRescheduleAppointment?.()}
      className={className}
    />
  )
}

export function OnboardedPatientDashboard({
  medications = [],
  visits,
  appointment,
  selectedCategory = 'all',
  onCategoryChange,
  onRescheduleVisit,
  onRescheduleAppointment,
  onMedicationAction,
  showAverageResults = true,
  paymentRequired = false,
  paymentDueDate = "December 15, 2024",
  className,
  variant = 'both'
}: OnboardedPatientDashboardProps) {
  const filteredMedications = selectedCategory === 'all' 
    ? medications 
    : medications.filter(med => med.category === selectedCategory)

  // Use visits if provided, otherwise convert appointment for backward compatibility
  const visitsData = visits || (appointment ? [appointment] : [])
  const onRescheduleHandler = onRescheduleVisit || (() => onRescheduleAppointment?.())

  if (variant === 'medication-only' && filteredMedications.length > 0) {
    return (
      <div className={cn("w-full max-w-md", className)}>
        {onCategoryChange && (
          <div className="mb-4">
            <Select value={selectedCategory} onValueChange={onCategoryChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select treatment category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Treatments</SelectItem>
                <SelectItem value="weightloss">Weight Loss</SelectItem>
                <SelectItem value="mens-health">Men's Health</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        <MedicationCard 
          medications={filteredMedications}
          onMedicationAction={onMedicationAction}
          showAverageResults={showAverageResults}
          paymentRequired={paymentRequired}
          paymentDueDate={paymentDueDate}
        />
      </div>
    )
  }

  if ((variant === 'visit-only' || variant === 'appointment-only') && visitsData.length > 0) {
    return (
      <div className={cn("w-full max-w-md", className)}>
        <VisitsCard 
          visits={visitsData}
          onRescheduleVisit={onRescheduleHandler}
        />
      </div>
    )
  }

  return (
    <div className={cn("w-full max-w-4xl mx-auto", className)}>
      {onCategoryChange && medications.length <= 1 && (
        <div className="mb-6">
          <Select value={selectedCategory} onValueChange={onCategoryChange}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select treatment category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Treatments</SelectItem>
              <SelectItem value="weightloss">Weight Loss</SelectItem>
              <SelectItem value="mens-health">Men's Health</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredMedications.length > 0 && (
          <MedicationCard 
            medications={filteredMedications}
            onMedicationAction={onMedicationAction}
            showAverageResults={showAverageResults}
            paymentRequired={paymentRequired}
            paymentDueDate={paymentDueDate}
          />
        )}
        {visitsData.length > 0 && (
          <VisitsCard 
            visits={visitsData}
            onRescheduleVisit={onRescheduleHandler}
          />
        )}
      </div>
    </div>
  )
}