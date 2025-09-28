"use client"

import * as React from "react"
import { Calendar, Clock, User, Stethoscope, Check, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "../lib/utils"
import { Button } from "./button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./dialog"
import { Label } from "./label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select"
import { Badge } from "./badge"
import { Separator } from "./separator"
import { Sonner } from "./toast"

export interface MedicationPreference {
  id: string
  medication_name: string
  preferred_dosage: string
  status: 'approved' | 'pending' | 'denied'
  treatment_type?: string
}

export interface Provider {
  id: string
  name: string
  specialty: string
  profile_id: string
}

export interface AppointmentSlot {
  slot_date: string
  slot_start_time: string
  slot_end_time: string
  duration_minutes: number
}

export interface AppointmentBookingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patientProfileId: string
  medicationPreferences: MedicationPreference[]
  providers: Provider[]
  onBookAppointment: (appointmentData: {
    patientProfileId: string
    providerId: string
    appointmentDate: string
    startTime: string
    treatmentType: string
    medicationPreferenceId: string
    appointmentType: string
    patientNotes?: string
  }) => Promise<{ success: boolean; message?: string; appointmentId?: string }>
  onGetAvailableSlots: (
    providerId: string,
    startDate: string,
    endDate: string,
    treatmentType?: string
  ) => Promise<{ data: AppointmentSlot[]; error?: any }>
}

export function AppointmentBookingDialog({
  open,
  onOpenChange,
  patientProfileId,
  medicationPreferences = [],
  providers = [],
  onBookAppointment,
  onGetAvailableSlots,
}: AppointmentBookingDialogProps) {
  const [step, setStep] = React.useState<'medication' | 'provider' | 'datetime' | 'confirm'>('medication')
  const [selectedMedicationId, setSelectedMedicationId] = React.useState<string>("")
  const [selectedProviderId, setSelectedProviderId] = React.useState<string>("")
  const [selectedSlot, setSelectedSlot] = React.useState<AppointmentSlot | null>(null)
  const [availableSlots, setAvailableSlots] = React.useState<AppointmentSlot[]>([])
  const [currentWeekStart, setCurrentWeekStart] = React.useState<Date>(() => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    const dayOfWeek = tomorrow.getDay()
    const start = new Date(tomorrow)
    start.setDate(tomorrow.getDate() - dayOfWeek)
    return start
  })
  const [loading, setLoading] = React.useState(false)
  const [isBooking, setIsBooking] = React.useState(false)

  // Auto-select medication if only one approved preference exists
  React.useEffect(() => {
    const approvedPreferences = medicationPreferences.filter(pref => pref.status === 'approved')
    if (approvedPreferences.length === 1 && !selectedMedicationId) {
      setSelectedMedicationId(approvedPreferences[0].id)
    }
  }, [medicationPreferences, selectedMedicationId])

  // Load available slots when provider and medication are selected
  React.useEffect(() => {
    if (selectedProviderId && selectedMedicationId && step === 'datetime') {
      loadAvailableSlots()
    }
  }, [selectedProviderId, selectedMedicationId, currentWeekStart, step])

  const selectedMedication = medicationPreferences.find(med => med.id === selectedMedicationId)
  const selectedProvider = providers.find(prov => prov.id === selectedProviderId)
  const approvedPreferences = medicationPreferences.filter(pref => pref.status === 'approved')

  const loadAvailableSlots = async () => {
    if (!selectedProviderId || !selectedMedication) return
    
    setLoading(true)
    try {
      const weekEnd = new Date(currentWeekStart)
      weekEnd.setDate(currentWeekStart.getDate() + 6)
      
      const startDate = currentWeekStart.toISOString().split('T')[0]
      const endDate = weekEnd.toISOString().split('T')[0]
      
      const result = await onGetAvailableSlots(
        selectedProviderId,
        startDate,
        endDate,
        selectedMedication.treatment_type
      )
      
      if (result.error) {
        console.error('Error loading slots:', result.error)
        Sonner.error('Loading slots', result.error.message || 'Failed to load available appointments')
      } else {
        setAvailableSlots(result.data || [])
      }
    } catch (error) {
      console.error('Exception loading slots:', error)
      Sonner.error('Loading slots', 'An error occurred while loading appointments')
    } finally {
      setLoading(false)
    }
  }

  const handleBookAppointment = async () => {
    if (!selectedSlot || !selectedMedication || !selectedProvider) return
    
    setIsBooking(true)
    try {
      const result = await onBookAppointment({
        patientProfileId,
        providerId: selectedProviderId,
        appointmentDate: selectedSlot.slot_date,
        startTime: selectedSlot.slot_start_time,
        treatmentType: selectedMedication.treatment_type || 'consultation',
        medicationPreferenceId: selectedMedicationId,
        appointmentType: 'consultation',
        patientNotes: `Initial consultation for ${selectedMedication.medication_name}`
      })
      
      if (result.success) {
        Sonner.saved(`Appointment with ${selectedProvider.name}`)
        onOpenChange(false)
        // Reset form
        setStep('medication')
        setSelectedSlot(null)
      } else {
        Sonner.error('Booking appointment', result.message || 'Failed to book appointment')
      }
    } catch (error) {
      console.error('Exception booking appointment:', error)
      Sonner.error('Booking appointment', 'An error occurred while booking your appointment')
    } finally {
      setIsBooking(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (timeStr: string) => {
    return new Date(`2000-01-01T${timeStr}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getWeekDays = () => {
    const days = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(currentWeekStart)
      day.setDate(currentWeekStart.getDate() + i)
      days.push(day)
    }
    return days
  }

  const getSlotsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return availableSlots.filter(slot => slot.slot_date === dateStr)
  }

  const goToPreviousWeek = () => {
    const newStart = new Date(currentWeekStart)
    newStart.setDate(currentWeekStart.getDate() - 7)
    setCurrentWeekStart(newStart)
  }

  const goToNextWeek = () => {
    const newStart = new Date(currentWeekStart)
    newStart.setDate(currentWeekStart.getDate() + 7)
    setCurrentWeekStart(newStart)
  }

  const canProceedToProvider = selectedMedicationId && approvedPreferences.length > 0
  const canProceedToDateTime = canProceedToProvider && selectedProviderId
  const canProceedToConfirm = canProceedToDateTime && selectedSlot
  const canBook = canProceedToConfirm && !isBooking

  const renderStepContent = () => {
    switch (step) {
      case 'medication':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Stethoscope className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Select Medication Preference</h3>
              <p className="text-sm text-muted-foreground">
                Choose the medication you'd like to discuss during your appointment
              </p>
            </div>

            {approvedPreferences.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    No approved medication preferences found. Please complete your medication preferences first.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                <Label>Approved Medications</Label>
                <Select value={selectedMedicationId} onValueChange={setSelectedMedicationId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a medication..." />
                  </SelectTrigger>
                  <SelectContent>
                    {approvedPreferences.map((preference) => (
                      <SelectItem key={preference.id} value={preference.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{preference.medication_name}</span>
                          <Badge variant="secondary" className="ml-2">
                            {preference.preferred_dosage}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {selectedMedication && (
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="font-medium">{selectedMedication.medication_name}</p>
                          <p className="text-sm text-muted-foreground">
                            Dosage: {selectedMedication.preferred_dosage}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        )

      case 'provider':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Select Provider</h3>
              <p className="text-sm text-muted-foreground">
                Choose your healthcare provider for this appointment
              </p>
            </div>

            <div className="space-y-3">
              <Label>Available Providers</Label>
              <Select value={selectedProviderId} onValueChange={setSelectedProviderId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a provider..." />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{provider.name}</span>
                        <span className="text-sm text-muted-foreground">{provider.specialty}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedProvider && (
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium">{selectedProvider.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedProvider.specialty}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )

      case 'datetime':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Select Date & Time</h3>
              <p className="text-sm text-muted-foreground">
                Choose your preferred appointment time
              </p>
            </div>

            <div className="space-y-4">
              {/* Week Navigation */}
              <div className="flex items-center justify-between">
                <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-sm font-medium">
                  {currentWeekStart.toLocaleDateString('en-US', { month: 'long' })} {currentWeekStart.getFullYear()}
                </div>
                <Button variant="outline" size="sm" onClick={goToNextWeek}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Calendar Grid */}
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">Loading available times...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {getWeekDays().map((day) => {
                    const slots = getSlotsForDate(day)
                    const isPast = day < new Date()
                    
                    return (
                      <Card key={day.toISOString()} className={cn("transition-all", isPast && "opacity-50")}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium">
                            {day.toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {isPast ? (
                            <p className="text-xs text-muted-foreground">Past date</p>
                          ) : slots.length === 0 ? (
                            <p className="text-xs text-muted-foreground">No available times</p>
                          ) : (
                            <div className="grid grid-cols-3 gap-2">
                              {slots.map((slot) => (
                                <Button
                                  key={`${slot.slot_date}-${slot.slot_start_time}`}
                                  variant={
                                    selectedSlot?.slot_date === slot.slot_date && 
                                    selectedSlot?.slot_start_time === slot.slot_start_time 
                                      ? "default" 
                                      : "outline"
                                  }
                                  size="sm"
                                  className="text-xs"
                                  onClick={() => setSelectedSlot(slot)}
                                >
                                  {formatTime(slot.slot_start_time)}
                                </Button>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )

      case 'confirm':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <CalendarDays className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Confirm Appointment</h3>
              <p className="text-sm text-muted-foreground">
                Please review your appointment details
              </p>
            </div>

            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Medication</span>
                  <span className="text-sm">{selectedMedication?.medication_name}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Provider</span>
                  <span className="text-sm">{selectedProvider?.name}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Date</span>
                  <span className="text-sm">{selectedSlot && formatDate(selectedSlot.slot_date)}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Time</span>
                  <span className="text-sm">
                    {selectedSlot && `${formatTime(selectedSlot.slot_start_time)} - ${formatTime(selectedSlot.slot_end_time)}`}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Duration</span>
                  <span className="text-sm">{selectedSlot?.duration_minutes} minutes</span>
                </div>
              </CardContent>
            </Card>

            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-xs text-muted-foreground">
                You'll receive a confirmation email once your appointment is booked. 
                You can reschedule or cancel up to 24 hours before your appointment time.
              </p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const getStepTitle = () => {
    switch (step) {
      case 'medication': return 'Medication'
      case 'provider': return 'Provider'
      case 'datetime': return 'Date & Time'
      case 'confirm': return 'Confirm'
      default: return ''
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule Your First Appointment</DialogTitle>
          <DialogDescription>
            Book your initial consultation to get started with your healthcare journey.
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between py-4">
          {['medication', 'provider', 'datetime', 'confirm'].map((stepName, index) => (
            <div key={stepName} className="flex items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                  stepName === step
                    ? "bg-primary text-primary-foreground"
                    : index < ['medication', 'provider', 'datetime', 'confirm'].indexOf(step)
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {index + 1}
              </div>
              <span className={cn(
                "ml-2 text-sm font-medium",
                stepName === step ? "text-foreground" : "text-muted-foreground"
              )}>
                {getStepTitle()}
              </span>
              {index < 3 && (
                <div className="w-8 h-px bg-border mx-4" />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6">
          <Button
            variant="outline"
            onClick={() => {
              const steps = ['medication', 'provider', 'datetime', 'confirm'] as const
              const currentIndex = steps.indexOf(step)
              if (currentIndex > 0) {
                setStep(steps[currentIndex - 1])
              }
            }}
            disabled={step === 'medication'}
          >
            Back
          </Button>

          {step === 'confirm' ? (
            <Button onClick={handleBookAppointment} disabled={!canBook}>
              {isBooking ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Booking...
                </>
              ) : (
                'Book Appointment'
              )}
            </Button>
          ) : (
            <Button
              onClick={() => {
                const steps = ['medication', 'provider', 'datetime', 'confirm'] as const
                const currentIndex = steps.indexOf(step)
                if (currentIndex < steps.length - 1) {
                  setStep(steps[currentIndex + 1])
                }
              }}
              disabled={
                (step === 'medication' && !canProceedToProvider) ||
                (step === 'provider' && !canProceedToDateTime) ||
                (step === 'datetime' && !canProceedToConfirm)
              }
            >
              Continue
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}