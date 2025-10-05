import type { Meta, StoryObj } from '@storybook/react'
import { AppointmentBookingDialog } from './appointment-booking-dialog'
import { action } from '@storybook/addon-actions'
import React, { useState } from 'react'
import { Button } from './button'

const meta: Meta<typeof AppointmentBookingDialog> = {
  title: 'Atomic/Organisms/AppointmentBookingDialog',
  component: AppointmentBookingDialog,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A multi-step dialog for booking appointments as part of patient onboarding. Integrates medication preferences with provider calendar availability.',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

// Mock data
const mockMedicationPreferences = [
  {
    id: 'med-1',
    medication_name: 'Semaglutide',
    preferred_dosage: '0.5mg weekly',
    status: 'approved' as const,
    treatment_type: 'weight_loss'
  },
  {
    id: 'med-2', 
    medication_name: 'Metformin',
    preferred_dosage: '500mg twice daily',
    status: 'approved' as const,
    treatment_type: 'diabetes_management'
  },
  {
    id: 'med-3',
    medication_name: 'Ozempic',
    preferred_dosage: '1.0mg weekly',
    status: 'pending' as const,
    treatment_type: 'weight_loss'
  }
]

const mockProviders = [
  {
    id: 'prov-1',
    name: 'Dr. Sarah Johnson',
    specialty: 'Endocrinology',
    profile_id: 'profile-1'
  },
  {
    id: 'prov-2',
    name: 'Dr. Michael Chen',
    specialty: 'Family Medicine',
    profile_id: 'profile-2'
  },
  {
    id: 'prov-3',
    name: 'Dr. Emily Rodriguez',
    specialty: 'Internal Medicine', 
    profile_id: 'profile-3'
  }
]

// Generate mock slots for the next two weeks
const generateMockSlots = (providerId: string, startDate: string, endDate: string) => {
  const slots = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  // Generate slots for weekdays only (Mon-Fri)
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay()
    if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday to Friday
      const dateStr = d.toISOString().split('T')[0]
      
      // Morning slots (9 AM - 12 PM)
      for (let hour = 9; hour < 12; hour++) {
        slots.push({
          slot_date: dateStr,
          slot_start_time: `${hour.toString().padStart(2, '0')}:00:00`,
          slot_end_time: `${hour.toString().padStart(2, '0')}:30:00`,
          duration_minutes: 30
        })
        
        slots.push({
          slot_date: dateStr,
          slot_start_time: `${hour.toString().padStart(2, '0')}:30:00`,
          slot_end_time: `${(hour + 1).toString().padStart(2, '0')}:00:00`,
          duration_minutes: 30
        })
      }
      
      // Afternoon slots (2 PM - 5 PM)
      for (let hour = 14; hour < 17; hour++) {
        slots.push({
          slot_date: dateStr,
          slot_start_time: `${hour.toString().padStart(2, '0')}:00:00`,
          slot_end_time: `${hour.toString().padStart(2, '0')}:30:00`,
          duration_minutes: 30
        })
        
        slots.push({
          slot_date: dateStr,
          slot_start_time: `${hour.toString().padStart(2, '0')}:30:00`,
          slot_end_time: `${(hour + 1).toString().padStart(2, '0')}:00:00`,
          duration_minutes: 30
        })
      }
    }
  }
  
  return slots
}

const mockGetAvailableSlots = async (
  providerId: string,
  startDate: string,
  endDate: string,
  treatmentType?: string
) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  const slots = generateMockSlots(providerId, startDate, endDate)
  
  return {
    data: slots,
    error: null
  }
}

const mockBookAppointment = async (appointmentData: any) => {
  action('book-appointment')(appointmentData)
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  // Simulate successful booking
  return {
    success: true,
    message: 'Appointment booked successfully',
    appointmentId: 'apt-12345'
  }
}

// Story wrapper component to manage dialog state
const DialogWrapper = ({ children, ...props }: any) => {
  const [open, setOpen] = useState(false)
  
  return (
    <div>
      <Button onClick={() => setOpen(true)}>
        Open Appointment Booking
      </Button>
      {React.cloneElement(children, {
        ...props,
        open,
        onOpenChange: setOpen
      })}
    </div>
  )
}

export const Default: Story = {
  render: (args) => (
    <DialogWrapper>
      <AppointmentBookingDialog {...args} />
    </DialogWrapper>
  ),
  args: {
    patientProfileId: 'patient-123',
    medicationPreferences: mockMedicationPreferences,
    providers: mockProviders,
    onBookAppointment: mockBookAppointment,
    onGetAvailableSlots: mockGetAvailableSlots,
  },
}

export const SingleMedicationPreference: Story = {
  render: (args) => (
    <DialogWrapper>
      <AppointmentBookingDialog {...args} />
    </DialogWrapper>
  ),
  args: {
    patientProfileId: 'patient-123',
    medicationPreferences: [mockMedicationPreferences[0]], // Only one approved med
    providers: mockProviders,
    onBookAppointment: mockBookAppointment,
    onGetAvailableSlots: mockGetAvailableSlots,
  },
  parameters: {
    docs: {
      description: {
        story: 'When patient has only one approved medication preference, it is auto-selected.',
      },
    },
  },
}

export const NoApprovedMedications: Story = {
  render: (args) => (
    <DialogWrapper>
      <AppointmentBookingDialog {...args} />
    </DialogWrapper>
  ),
  args: {
    patientProfileId: 'patient-123',
    medicationPreferences: [
      {
        ...mockMedicationPreferences[0],
        status: 'pending' as const
      }
    ],
    providers: mockProviders,
    onBookAppointment: mockBookAppointment,
    onGetAvailableSlots: mockGetAvailableSlots,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows message when patient has no approved medication preferences.',
      },
    },
  },
}

export const SingleProvider: Story = {
  render: (args) => (
    <DialogWrapper>
      <AppointmentBookingDialog {...args} />
    </DialogWrapper>
  ),
  args: {
    patientProfileId: 'patient-123',
    medicationPreferences: mockMedicationPreferences,
    providers: [mockProviders[0]], // Only one provider
    onBookAppointment: mockBookAppointment,
    onGetAvailableSlots: mockGetAvailableSlots,
  },
}

export const BookingError: Story = {
  render: (args) => (
    <DialogWrapper>
      <AppointmentBookingDialog {...args} />
    </DialogWrapper>
  ),
  args: {
    patientProfileId: 'patient-123',
    medicationPreferences: mockMedicationPreferences,
    providers: mockProviders,
    onBookAppointment: async (appointmentData: any) => {
      action('book-appointment')(appointmentData)
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      return {
        success: false,
        message: 'This time slot is no longer available. Please select another time.'
      }
    },
    onGetAvailableSlots: mockGetAvailableSlots,
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates error handling when appointment booking fails.',
      },
    },
  },
}

export const NoAvailableSlots: Story = {
  render: (args) => (
    <DialogWrapper>
      <AppointmentBookingDialog {...args} />
    </DialogWrapper>
  ),
  args: {
    patientProfileId: 'patient-123',
    medicationPreferences: mockMedicationPreferences,
    providers: mockProviders,
    onBookAppointment: mockBookAppointment,
    onGetAvailableSlots: async () => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      return {
        data: [], // No available slots
        error: null
      }
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows message when provider has no available appointment slots.',
      },
    },
  },
}

export const LoadingSlotsError: Story = {
  render: (args) => (
    <DialogWrapper>
      <AppointmentBookingDialog {...args} />
    </DialogWrapper>
  ),
  args: {
    patientProfileId: 'patient-123',
    medicationPreferences: mockMedicationPreferences,
    providers: mockProviders,
    onBookAppointment: mockBookAppointment,
    onGetAvailableSlots: async () => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      return {
        data: [],
        error: { message: 'Failed to load provider availability' }
      }
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates error handling when loading available slots fails.',
      },
    },
  },
}