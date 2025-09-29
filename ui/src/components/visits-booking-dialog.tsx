"use client"

import * as React from "react"
import { Button } from "./button"
import { Calendar } from "./calendar"
import { Card, CardContent, CardFooter } from "./card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"
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

export interface ExistingAppointment {
  id: string
  providerId: string
  providerName: string
  appointmentDate: string
  startTime: string
  treatmentType: string
  appointmentType: string
}

export interface VisitsBookingDialogProps {
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
  // Reschedule mode props
  isRescheduleMode?: boolean
  existingAppointment?: ExistingAppointment
  onRescheduleAppointment?: (appointmentData: {
    appointmentId: string
    appointmentDate: string
    startTime: string
  }) => Promise<{ success: boolean; message?: string }>
}

export function VisitsBookingDialog({
  open,
  onOpenChange,
  patientProfileId,
  medicationPreferences = [],
  providers = [],
  onBookAppointment,
  onGetAvailableSlots,
  isRescheduleMode = false,
  existingAppointment,
  onRescheduleAppointment,
}: VisitsBookingDialogProps) {
  // Debug logging
  React.useEffect(() => {
    console.log('🔍 VisitsBookingDialog props changed:', {
      open,
      patientProfileId,
      medicationPreferences: medicationPreferences.length,
      providers: providers.length,
      isRescheduleMode,
      existingAppointment
    })
  }, [open, patientProfileId, medicationPreferences, providers, isRescheduleMode, existingAppointment])

  // Update date and time when reschedule mode changes
  React.useEffect(() => {
    if (isRescheduleMode && existingAppointment) {
      console.log('🔍 Setting up reschedule mode with appointment:', existingAppointment)
      
      // Parse and set the appointment date (avoid timezone issues)
      const [year, month, day] = existingAppointment.appointmentDate.split('-').map(Number)
      const appointmentDate = new Date(year, month - 1, day) // month is 0-indexed
      console.log('🔍 Setting date to:', appointmentDate, 'from:', existingAppointment.appointmentDate)
      setDate(appointmentDate)
      setCalendarMonth(new Date(year, month - 1, 1)) // Also set calendar month
      
      // Parse and set the appointment time - ensure it persists
      const appointmentTime = existingAppointment.startTime.slice(0, 5) // Convert HH:MM:SS to HH:MM
      console.log('🔍 Setting time to:', appointmentTime, 'from:', existingAppointment.startTime)
      setSelectedTime(appointmentTime)
      
      // Set the provider selection (though it's hidden in reschedule mode)
      const providerSelection = `${existingAppointment.providerId}-${existingAppointment.treatmentType}`
      console.log('🔍 Setting provider selection to:', providerSelection)
      setSelectedMedicationProvider(providerSelection)
    } else if (!isRescheduleMode) {
      // Reset to defaults when not in reschedule mode
      setDate(new Date())
      setSelectedTime(null)
      setSelectedMedicationProvider("")
    }
  }, [isRescheduleMode, existingAppointment])
  const [date, setDate] = React.useState<Date | undefined>(() => {
    if (isRescheduleMode && existingAppointment) {
      const [year, month, day] = existingAppointment.appointmentDate.split('-').map(Number)
      return new Date(year, month - 1, day) // month is 0-indexed
    }
    return new Date()
  })
  const [calendarMonth, setCalendarMonth] = React.useState<Date>(() => {
    if (isRescheduleMode && existingAppointment) {
      const [year, month] = existingAppointment.appointmentDate.split('-').map(Number)
      return new Date(year, month - 1, 1) // First day of the month for calendar display
    }
    return new Date()
  })
  const [selectedTime, setSelectedTime] = React.useState<string | null>(
    isRescheduleMode && existingAppointment 
      ? existingAppointment.startTime.slice(0, 5) // Convert HH:MM:SS to HH:MM
      : null
  )
  const [selectedMedicationProvider, setSelectedMedicationProvider] = React.useState<string>(
    isRescheduleMode && existingAppointment 
      ? `${existingAppointment.providerId}-${existingAppointment.treatmentType}`
      : ""
  )
  const [availableSlots, setAvailableSlots] = React.useState<AppointmentSlot[]>([])
  const [bookedDates, setBookedDates] = React.useState<Date[]>([])
  const [loading, setLoading] = React.useState(false)
  const [isBooking, setIsBooking] = React.useState(false)
  
  // Track if appointment details have been changed for button state logic
  const appointmentChanged = React.useMemo(() => {
    if (!isRescheduleMode || !existingAppointment) return false
    
    const selectedDateStr = date?.toISOString().split('T')[0]
    const originalDateStr = existingAppointment.appointmentDate
    const originalTimeStr = existingAppointment.startTime.slice(0, 5)
    
    // Require either date OR time to be different from original appointment
    // This ensures user must select a different provider time slot
    const dateChanged = selectedDateStr !== originalDateStr
    const timeChanged = selectedTime !== originalTimeStr
    const hasChanged = dateChanged || timeChanged
    
    console.log('🔍 Appointment change check:', {
      selectedDate: selectedDateStr,
      originalDate: originalDateStr,
      selectedTime,
      originalTime: originalTimeStr,
      dateChanged,
      timeChanged,
      hasChanged
    })
    
    return hasChanged
  }, [isRescheduleMode, existingAppointment, date, selectedTime])

  // Create medication-provider combinations (smart matching)
  const medicationProviders = React.useMemo(() => {
    const combinations: Array<{ id: string; label: string; medicationId: string; providerId: string; treatmentType?: string }> = []
    
    medicationPreferences.forEach(med => {
      // Find the most appropriate provider for this medication
      let matchingProvider = null
      
      // First try to match by treatment type
      if (med.treatment_type) {
        // Map treatment types to provider specialties
        const treatmentToSpecialty = {
          'weight_loss': 'Weight Loss',
          'mens_health': 'Mens Health',
          'consultation': null // Can match any provider
        }
        
        const expectedSpecialty = treatmentToSpecialty[med.treatment_type as keyof typeof treatmentToSpecialty]
        if (expectedSpecialty) {
          matchingProvider = providers.find(provider => 
            provider.specialty === expectedSpecialty || 
            (provider.treatment_type && provider.treatment_type === med.treatment_type)
          )
        }
      }
      
      // If no specific match, use the primary provider
      if (!matchingProvider) {
        matchingProvider = providers.find(provider => provider.is_primary) || providers[0]
      }
      
      if (matchingProvider) {
        combinations.push({
          id: `${med.id}-${matchingProvider.id}`,
          label: `${med.medication_name} Visit`,
          medicationId: med.id,
          providerId: matchingProvider.id,
          treatmentType: med.treatment_type
        })
      }
    })
    
    return combinations
  }, [medicationPreferences, providers])

  // Load available slots when date or medication/provider selection changes
  React.useEffect(() => {
    if (date && (selectedMedicationProvider || (isRescheduleMode && existingAppointment))) {
      loadAvailableSlots()
    }
  }, [selectedMedicationProvider, date, isRescheduleMode, existingAppointment])

  const loadAvailableSlots = async () => {
    if (!date) return
    
    // In reschedule mode, use existing appointment data
    if (isRescheduleMode && existingAppointment) {
      setLoading(true)
      // Preserve the existing selected time in reschedule mode
      const existingTime = existingAppointment.startTime.slice(0, 5)
      
      try {
        const startDate = date.toISOString().split('T')[0]
        const endDate = date.toISOString().split('T')[0] // Same day for now
        
        console.log('🔍 Reschedule mode - fetching slots for provider:', {
          providerId: existingAppointment.providerId,
          treatmentType: existingAppointment.treatmentType,
          date: startDate,
          preservingTime: existingTime
        })
        
        const result = await onGetAvailableSlots(
          existingAppointment.providerId,
          startDate,
          endDate,
          existingAppointment.treatmentType
        )
        
        if (result.error) {
          console.error('Error loading slots:', result.error)
          Sonner.error('Loading slots', result.error.message || 'Failed to load available appointments')
          setAvailableSlots([])
        } else {
          const slots = result.data || []
          setAvailableSlots(slots)
          
          // Ensure the existing appointment time remains selected after slots load
          console.log('🔍 Slots loaded, preserving existing time selection:', existingTime)
          setSelectedTime(existingTime)
        }
      } catch (error) {
        console.error('Exception loading slots:', error)
        Sonner.error('Loading slots', 'An error occurred while loading appointments')
        setAvailableSlots([])
        // Still preserve the existing time even if slots fail to load
        setSelectedTime(existingTime)
      } finally {
        setLoading(false)
      }
      return
    }
    
    // Regular booking mode
    if (!selectedMedicationProvider) return

    const selectedCombo = medicationProviders.find(mp => mp.id === selectedMedicationProvider)
    if (!selectedCombo) return

    setLoading(true)
    setSelectedTime(null) // Reset selected time when slots change (only in booking mode)
    
    try {
      const startDate = date.toISOString().split('T')[0]
      const endDate = date.toISOString().split('T')[0] // Same day for now
      
      const result = await onGetAvailableSlots(
        selectedCombo.providerId,
        startDate,
        endDate,
        selectedCombo.treatmentType
      )
      
      if (result.error) {
        console.error('Error loading slots:', result.error)
        Sonner.error('Loading slots', result.error.message || 'Failed to load available appointments')
        setAvailableSlots([])
      } else {
        setAvailableSlots(result.data || [])
      }
    } catch (error) {
      console.error('Exception loading slots:', error)
      Sonner.error('Loading slots', 'An error occurred while loading appointments')
      setAvailableSlots([])
    } finally {
      setLoading(false)
    }
  }

  const handleBookAppointment = async () => {
    if (!selectedTime || !selectedMedicationProvider || !date) return

    const selectedCombo = medicationProviders.find(mp => mp.id === selectedMedicationProvider)
    if (!selectedCombo) return

    setIsBooking(true)
    try {
      const result = await onBookAppointment({
        patientProfileId,
        providerId: selectedCombo.providerId,
        appointmentDate: date.toISOString().split('T')[0],
        startTime: selectedTime,
        treatmentType: selectedCombo.treatmentType || 'consultation',
        medicationPreferenceId: selectedCombo.medicationId,
        appointmentType: 'consultation',
        patientNotes: `Initial consultation for ${selectedCombo.label.split(' - ')[0]}`
      })
      
      if (result.success) {
        const providerName = selectedCombo.label.split(' - ')[1]
        Sonner.saved(`Appointment with ${providerName}`)
        onOpenChange(false)
        // Reset form
        setSelectedTime(null)
        setSelectedMedicationProvider("")
        setDate(new Date())
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

  const handleRescheduleAppointment = async () => {
    if (!selectedTime || !date || !existingAppointment || !onRescheduleAppointment) return

    setIsBooking(true)
    try {
      const result = await onRescheduleAppointment({
        appointmentId: existingAppointment.id,
        appointmentDate: date.toISOString().split('T')[0],
        startTime: selectedTime
      })
      
      if (result.success) {
        // Create appointment details string for the toast
        const appointmentDetails = `${date?.toLocaleDateString("en-US", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })} at ${selectedTime}`
        
        Sonner.appointmentRescheduled(appointmentDetails)
        onOpenChange(false)
      } else {
        Sonner.error('Reschedule failed', result.message || 'Failed to reschedule appointment')
      }
    } catch (error) {
      console.error('Exception rescheduling appointment:', error)
      Sonner.error('Reschedule appointment', 'An error occurred while rescheduling your appointment')
    } finally {
      setIsBooking(false)
    }
  }


  // Generate time slots (9 AM to 5 PM, 15-minute intervals)
  const timeSlots = React.useMemo(() => {
    if (!date) return []
    
    // In reschedule mode, we don't need a provider selection to show time slots
    if (isRescheduleMode || selectedMedicationProvider) {
      const dateStr = date.toISOString().split('T')[0]
      let slots = availableSlots
        .filter(slot => slot.slot_date === dateStr)
        .map(slot => slot.slot_start_time.slice(0, 5)) // Convert HH:MM:SS to HH:MM
      
      // In reschedule mode, ensure the existing appointment time is always available as an option
      if (isRescheduleMode && existingAppointment) {
        const existingTime = existingAppointment.startTime.slice(0, 5)
        if (!slots.includes(existingTime)) {
          // Add the existing time to the beginning of the slots array
          slots = [existingTime, ...slots]
          console.log('🔍 Added existing appointment time to available slots:', existingTime)
        }
      }
      
      return slots.sort() // Sort times chronologically
    }
    
    return []
  }, [availableSlots, date, isRescheduleMode, selectedMedicationProvider, existingAppointment])

  const selectedMedicationProviderData = medicationProviders.find(mp => mp.id === selectedMedicationProvider)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 md:max-w-[700px] lg:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>
            {isRescheduleMode ? 'Reschedule Your Visit' : 'Schedule Your Visit'}
          </DialogTitle>
          <DialogDescription>
            {isRescheduleMode 
              ? `Modify your appointment with ${existingAppointment?.providerName || 'your provider'}.`
              : 'Book your appointment with your healthcare provider.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <Card className="gap-0 p-0 md:max-w-[700px] lg:max-w-[800px] flex flex-col mx-auto border-0 shadow-none">
          <CardContent className="relative p-0 md:pr-64 flex-1 min-h-0">
            <div className="p-6">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                month={calendarMonth}
                onMonthChange={setCalendarMonth}
                disabled={bookedDates}
                showOutsideDays={false}
                modifiers={{
                  booked: bookedDates,
                }}
                modifiersClassNames={{
                  booked: "[&>button]:line-through opacity-100",
                }}
                className="bg-transparent p-0 w-full [--cell-size:--spacing(12)] md:[--cell-size:--spacing(14)] [&_table]:w-full [&_td]:text-center [&_th]:text-center [&_table]:table-fixed"
                formatters={{
                  formatWeekdayName: (date) => {
                    return date.toLocaleString("en-US", { weekday: "short" })
                  },
                }}
              />
            </div>
            <div className="no-scrollbar inset-y-0 right-0 flex max-h-96 w-full scroll-pb-6 flex-col border-t p-6 md:absolute md:max-h-none md:w-64 md:border-t-0 md:border-l">
              {/* Provider Selection - Hide in reschedule mode */}
              {!isRescheduleMode && (
                <div className={`flex flex-col gap-3 ${selectedMedicationProvider ? 'pb-4 border-b' : ''}`}>
                  <label className="text-sm font-medium">Select Provider & Treatment</label>
                  <Select 
                    value={selectedMedicationProvider} 
                    onValueChange={setSelectedMedicationProvider}
                    onOpenChange={(open) => {
                      // Focus trap for select when it opens
                      if (open) {
                        setTimeout(() => {
                          const selectTrigger = document.querySelector('[data-state="open"] [role="combobox"]')
                          if (selectTrigger && selectTrigger instanceof HTMLElement) {
                            selectTrigger.focus()
                          }
                        }, 50)
                      }
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select provider..." />
                    </SelectTrigger>
                    <SelectContent>
                      {medicationProviders.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {/* Available Times Section - takes up remaining space */}
              <div className="flex flex-col gap-4 flex-1 overflow-y-auto">
                {(isRescheduleMode || selectedMedicationProvider) ? (
                  <>
                    <div className="text-sm font-medium text-center">Available Times</div>
                    {loading ? (
                      <div className="text-sm text-muted-foreground text-center">Loading times...</div>
                    ) : timeSlots.length === 0 ? (
                      <div className="text-sm text-muted-foreground text-center">
                        No available times
                      </div>
                    ) : (
                      <div className="grid gap-2">
                        {timeSlots.map((time) => (
                          <Button
                            key={time}
                            variant={selectedTime === time ? "default" : "outline"}
                            onClick={() => setSelectedTime(time)}
                            className="w-full shadow-none"
                            size="sm"
                          >
                            {time}
                          </Button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground text-center">
                    No provider selected
                  </div>
                )}
              </div>
              
              {/* Action Buttons - Fixed to bottom */}
              <div className="pt-4 border-t mt-auto space-y-2">
                {isRescheduleMode ? (
                  <Button
                    disabled={!date || !selectedTime || isBooking || !appointmentChanged}
                    className="w-full"
                    onClick={handleRescheduleAppointment}
                  >
                    {isBooking ? "Rescheduling..." : "Reschedule Appointment"}
                  </Button>
                ) : (
                  <Button
                    disabled={!date || !selectedTime || !selectedMedicationProvider || isBooking}
                    className="w-full"
                    onClick={handleBookAppointment}
                  >
                    {isBooking ? "Booking..." : "Book Visit"}
                  </Button>
                )}
                
                {date && selectedTime && (isRescheduleMode || selectedMedicationProviderData) && (
                  <div className="text-xs text-muted-foreground text-center mt-2">
                    {date?.toLocaleDateString("en-US", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}{" "}
                    at {selectedTime}
                    {!isRescheduleMode && selectedMedicationProviderData && (
                      <> with {selectedMedicationProviderData.label}</>
                    )}
                    {isRescheduleMode && existingAppointment && (
                      <> with {existingAppointment.providerName}</>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}