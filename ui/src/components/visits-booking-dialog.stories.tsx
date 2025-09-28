import type { Meta, StoryObj } from '@storybook/react'
import { VisitsBookingDialog } from './visits-booking-dialog'
import { action } from '@storybook/addon-actions'
import { useState } from 'react'
import { Button } from './button'

const meta: Meta<typeof VisitsBookingDialog> = {
  title: 'Atomic/Organisms/VisitsBookingDialog',
  component: VisitsBookingDialog,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A simplified visit booking dialog based on the calendar component. Allows patients to select a date, time, and medication/provider combination in a single streamlined interface.',
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
    status: 'approved' as const,
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

// Generate mock slots for the current date
const generateMockSlots = (providerId: string, startDate: string, endDate: string) => {
  const slots = []
  const date = new Date(startDate)
  const dateStr = date.toISOString().split('T')[0]
  
  // Generate morning slots (9 AM - 12 PM)
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
  
  // Generate afternoon slots (2 PM - 5 PM)
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
  
  return slots
}

const mockGetAvailableSlots = async (
  providerId: string,
  startDate: string,
  endDate: string,
  treatmentType?: string
) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800))
  
  const slots = generateMockSlots(providerId, startDate, endDate)
  
  return {
    data: slots,
    error: null
  }
}

const mockBookAppointment = async (appointmentData: any) => {
  action('book-appointment')(appointmentData)
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1200))
  
  // Simulate successful booking
  return {
    success: true,
    message: 'Visit booked successfully',
    appointmentId: 'apt-12345'
  }
}

// Story wrapper component to manage dialog state
const DialogWrapper = ({ children, ...props }: any) => {
  const [open, setOpen] = useState(false)
  
  return (
    <div>
      <Button onClick={() => setOpen(true)}>
        Schedule Visit
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
      <VisitsBookingDialog {...args} />
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

export const SingleMedication: Story = {
  render: (args) => (
    <DialogWrapper>
      <VisitsBookingDialog {...args} />
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
        story: 'When patient has only one approved medication preference, they still see all provider options.',
      },
    },
  },
}

export const SingleProvider: Story = {
  render: (args) => (
    <DialogWrapper>
      <VisitsBookingDialog {...args} />
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

export const NoAvailableSlots: Story = {
  render: (args) => (
    <DialogWrapper>
      <VisitsBookingDialog {...args} />
    </DialogWrapper>
  ),
  args: {
    patientProfileId: 'patient-123',
    medicationPreferences: mockMedicationPreferences,
    providers: mockProviders,
    onBookAppointment: mockBookAppointment,
    onGetAvailableSlots: async () => {
      await new Promise(resolve => setTimeout(resolve, 800))
      return {
        data: [], // No available slots
        error: null
      }
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows message when selected provider has no available appointment slots for the chosen date.',
      },
    },
  },
}

export const BookingError: Story = {
  render: (args) => (
    <DialogWrapper>
      <VisitsBookingDialog {...args} />
    </DialogWrapper>
  ),
  args: {
    patientProfileId: 'patient-123',
    medicationPreferences: mockMedicationPreferences,
    providers: mockProviders,
    onBookAppointment: async (appointmentData: any) => {
      action('book-appointment')(appointmentData)
      await new Promise(resolve => setTimeout(resolve, 1200))
      
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
        story: 'Demonstrates error handling when visit booking fails.',
      },
    },
  },
}