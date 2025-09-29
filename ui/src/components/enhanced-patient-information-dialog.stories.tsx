import type { Meta, StoryObj } from '@storybook/react'
import { EnhancedPatientInformationDialog } from './enhanced-patient-information-dialog'
import { MedicationPreferencesDialog, type MedicationOption } from './medication-preferences-dialog'
import type { PatientMedication, PatientMedicationPreference, PatientMedicationOrder, PatientAppointment } from './enhanced-patient-information-dialog'
import type { Patient } from './patient-table'

const meta = {
  title: 'Atomic/Organisms/Patient Information/Admin',
  component: EnhancedPatientInformationDialog,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Enhanced patient information dialog with integrated medication management for admin users. Features vertical scrolling medications list and detailed payment/shipping tracking.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    patient: {
      description: 'Patient data object'
    },
    medications: {
      description: 'Array of patient medications'
    },
    open: {
      control: 'boolean',
      description: 'Dialog open state'
    },
    isAdmin: {
      control: 'boolean',
      description: 'Admin view mode'
    },
    onOpenChange: { action: 'open state changed' },
    onMedicationUpdate: { action: 'medication updated' }
  },
} satisfies Meta<typeof EnhancedPatientInformationDialog>

export default meta
type Story = StoryObj<typeof meta>

// Sample patient data
const samplePatient: Patient = {
  id: 'pat_1234567890',
  profile_id: 'prof_1234567890',
  first_name: 'Sarah',
  last_name: 'Johnson',
  email: 'sarah.johnson@example.com',
  phone: '+1 (555) 123-4567',
  date_of_birth: '1985-03-15',
  has_completed_intake: true,
  treatment_type: 'weight_loss',
  assigned_providers: ['Dr. Smith', 'Dr. Brown'],
  created_at: '2024-01-01T00:00:00Z',
  medications: ['Semaglutide', 'Tirzepatide']
}

// Sample medication data
const sampleMedications: PatientMedication[] = [
  {
    id: '1',
    name: 'Semaglutide',
    dosage: '1mg',
    supply: '30 day supply',
    status: 'active',
    lastPaymentDate: '2024-01-15',
    shippedToPharmacyDate: '2024-01-18',
    trackingNumber: 'TRK123456789'
  },
  {
    id: '2',
    name: 'Tirzepatide',
    dosage: '5mg',
    supply: '30 day supply',
    status: 'shipped',
    lastPaymentDate: '2024-01-10',
    shippedToPharmacyDate: '2024-01-12',
    trackingNumber: 'TRK987654321'
  },
  {
    id: '3',
    name: 'Liraglutide',
    dosage: '3mg',
    supply: '30 day supply',
    status: 'pending',
    lastPaymentDate: '2024-01-05'
  }
]

const weightLossMedications: PatientMedication[] = [
  {
    id: '1',
    name: 'Semaglutide',
    dosage: '1mg',
    supply: '30 day supply',
    status: 'active',
    lastPaymentDate: '2024-01-15',
    shippedToPharmacyDate: '2024-01-18',
    trackingNumber: 'TRK123456789'
  },
  {
    id: '2',
    name: 'Tirzepatide',
    dosage: '5mg',
    supply: '30 day supply',
    status: 'delivered',
    lastPaymentDate: '2024-01-10',
    shippedToPharmacyDate: '2024-01-12',
    trackingNumber: 'TRK987654321'
  }
]

const mensHealthMedications: PatientMedication[] = [
  {
    id: '1',
    name: 'Testosterone Cypionate',
    dosage: '200mg/ml',
    supply: '10ml vial',
    status: 'active',
    lastPaymentDate: '2024-01-15',
    shippedToPharmacyDate: '2024-01-18',
    trackingNumber: 'TRK123456789'
  },
  {
    id: '2',
    name: 'Sildenafil',
    dosage: '50mg',
    supply: '30 tablets',
    status: 'delivered',
    lastPaymentDate: '2024-01-10',
    shippedToPharmacyDate: '2024-01-12',
    trackingNumber: 'TRK987654321'
  },
  {
    id: '3',
    name: 'Finasteride',
    dosage: '1mg',
    supply: '90 tablets',
    status: 'active',
    lastPaymentDate: '2024-01-12',
    shippedToPharmacyDate: '2024-01-15',
    trackingNumber: 'TRK789123456'
  }
]

// Sample preferred medications data
const samplePreferredMedications: PatientMedicationPreference[] = [
  {
    id: '356b8ae1-bf50-4bf2-80cc-05a0846da760',
    medication_name: 'Semaglutide',
    preferred_dosage: '0.5mg',
    frequency: 'weekly',
    status: 'approved',
    requested_date: '2025-09-20T10:00:00Z',
    notes: 'Starting dose for weight management'
  },
  {
    id: '456c9bf2-cf51-5cf3-91dd-16b1957ea871',
    medication_name: 'Tirzepatide',
    preferred_dosage: '2.5mg',
    frequency: 'weekly',
    status: 'pending',
    requested_date: '2025-09-22T14:30:00Z',
    notes: 'Alternative GLP-1 option'
  },
  {
    id: '567d0cf3-df62-6df4-a2ee-27c2a68fb982',
    medication_name: 'Liraglutide',
    preferred_dosage: '1.8mg',
    frequency: 'daily',
    status: 'denied',
    requested_date: '2025-09-18T09:15:00Z',
    notes: 'Daily administration not preferred'
  }
]

// Sample medication orders data
const sampleMedicationOrders: PatientMedicationOrder[] = [
  {
    id: 'b89c1bf3-17a7-4807-8532-894825150e41',
    approval_id: '9b71930b-f0be-4e7d-8c80-221d11de24c0',
    medication_name: 'Semaglutide',
    quantity: 1,
    dosage: '0.5mg',
    total_amount: 1199.99,
    payment_status: 'completed',
    fulfillment_status: 'delivered',
    created_at: '2025-09-21T08:00:00Z',
    shipped_date: '2025-09-22T15:30:00Z',
    tracking_number: 'TRK1234567890'
  },
  {
    id: 'c9ad2cf4-28b8-5918-9643-995936261f52',
    approval_id: 'ab82041c-g1cf-5e8e-9d91-332e22ef35d1',
    medication_name: 'Tirzepatide',
    quantity: 1,
    dosage: '2.5mg',
    total_amount: 1399.99,
    payment_status: 'pending',
    fulfillment_status: 'processing',
    created_at: '2025-09-23T12:00:00Z'
  },
  {
    id: 'daae3df5-39c9-6a29-a754-aa6a47372g63',
    approval_id: 'bc93152d-h2df-6f9f-ae92-443f33fg46e2',
    medication_name: 'Testosterone Cypionate',
    quantity: 1,
    dosage: '200mg/ml',
    total_amount: 899.99,
    payment_status: 'completed',
    fulfillment_status: 'shipped',
    created_at: '2025-09-20T16:45:00Z',
    shipped_date: '2025-09-21T11:20:00Z',
    tracking_number: 'TRK0987654321'
  }
]

// Sample appointments data
const sampleAppointments: PatientAppointment[] = [
  {
    id: 'appt_1',
    appointment_id: '1dda6efb-6c80-46a8-88a7-1c09deba1fae',
    provider_id: 'prov_123',
    provider_name: 'Dr. Sarah Smith',
    appointment_date: '2025-10-15',
    start_time: '09:00:00',
    treatment_type: 'weight_loss',
    appointment_type: 'consultation',
    status: 'scheduled',
    patient_notes: 'Initial consultation for weight management'
  },
  {
    id: 'appt_2', 
    appointment_id: '2dda6efb-6c80-46a8-88a7-1c09deba2fae',
    provider_id: 'prov_456',
    provider_name: 'Dr. Michael Brown',
    appointment_date: '2025-10-22',
    start_time: '14:30:00',
    treatment_type: 'weight_loss',
    appointment_type: 'follow_up',
    status: 'scheduled',
    patient_notes: 'Follow-up appointment for dosage adjustment'
  },
  {
    id: 'appt_3',
    appointment_id: '3dda6efb-6c80-46a8-88a7-1c09deba3fae',
    provider_id: 'prov_123',
    provider_name: 'Dr. Sarah Smith',
    appointment_date: '2025-09-25',
    start_time: '11:00:00',
    treatment_type: 'weight_loss',
    appointment_type: 'consultation',
    status: 'completed',
    patient_notes: 'Completed initial consultation'
  },
  {
    id: 'appt_4',
    appointment_id: '4dda6efb-6c80-46a8-88a7-1c09deba4fae',
    provider_id: 'prov_789',
    provider_name: 'Dr. Jennifer Lee',
    appointment_date: '2025-10-08',
    start_time: '10:15:00',
    treatment_type: 'mens_health',
    appointment_type: 'consultation',
    status: 'cancelled',
    patient_notes: 'Cancelled due to scheduling conflict'
  }
]

// Sample providers data
const sampleProviders = [
  {
    id: 'prov_123',
    name: 'Dr. Sarah Smith',
    specialty: 'Weight Loss',
    profile_id: 'prof_smith_123'
  },
  {
    id: 'prov_456', 
    name: 'Dr. Michael Brown',
    specialty: 'Weight Loss',
    profile_id: 'prof_brown_456'
  },
  {
    id: 'prov_789',
    name: 'Dr. Jennifer Lee', 
    specialty: 'Mens Health',
    profile_id: 'prof_lee_789'
  }
]

// Information story - renamed from default
export const Information: Story = {
  args: {
    patient: samplePatient,
    open: true,
    isAdmin: true,
    initialSection: "Information"
  },
  parameters: {
    docs: {
      description: {
        story: 'Admin patient information view showing basic information, treatment details, and admin actions.'
      }
    }
  }
}

// Medications story - Admin view with medications
export const Medications: Story = {
  args: {
    patient: samplePatient,
    medications: sampleMedications,
    open: true,
    isAdmin: true,
    initialSection: "Medications"
  },
  parameters: {
    docs: {
      description: {
        story: 'Admin medication management interface showing vertically scrolling list of patient medications. Click on any medication card to view detailed payment and shipping information.'
      }
    }
  }
}

// Preferred Medications story - Admin view with preferred medications
export const PreferredMedications: Story = {
  args: {
    patient: samplePatient,
    preferredMedications: samplePreferredMedications,
    open: true,
    isAdmin: true,
    initialSection: "Preferred Medications"
  },
  parameters: {
    docs: {
      description: {
        story: 'Admin view of patient medication preferences from onboarding process. Shows status badges and preference reference numbers.'
      }
    }
  }
}

// Orders story - Admin view with medication orders
export const Orders: Story = {
  args: {
    patient: samplePatient,
    medicationOrders: sampleMedicationOrders,
    open: true,
    isAdmin: true,
    initialSection: "Orders"
  },
  parameters: {
    docs: {
      description: {
        story: 'Admin view of patient medication orders. Shows order dates, approval IDs, and fulfillment status.'
      }
    }
  }
}

// Visits story - Admin view with patient appointments
export const Visits: Story = {
  args: {
    patient: samplePatient,
    appointments: sampleAppointments,
    providers: sampleProviders,
    medicationPreferences: samplePreferredMedications,
    open: true,
    isAdmin: true,
    initialSection: "Visits",
    onRescheduleAppointment: async (data) => {
      console.log('Reschedule appointment:', data)
      return { success: true, message: 'Appointment rescheduled successfully' }
    },
    onGetAvailableSlots: async (providerId, startDate, endDate, treatmentType) => {
      console.log('Get available slots:', { providerId, startDate, endDate, treatmentType })
      return {
        data: [
          { slot_date: startDate, slot_start_time: '09:00:00', slot_end_time: '09:30:00', duration_minutes: 30 },
          { slot_date: startDate, slot_start_time: '10:00:00', slot_end_time: '10:30:00', duration_minutes: 30 },
          { slot_date: startDate, slot_start_time: '11:00:00', slot_end_time: '11:30:00', duration_minutes: 30 },
          { slot_date: startDate, slot_start_time: '14:00:00', slot_end_time: '14:30:00', duration_minutes: 30 },
          { slot_date: startDate, slot_start_time: '15:00:00', slot_end_time: '15:30:00', duration_minutes: 30 }
        ]
      }
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Admin view of patient visits/appointments with reschedule functionality. Displays all appointments with status badges and allows admins to reschedule any scheduled appointment by clicking the "Reschedule" button.'
      }
    }
  }
}

// Sample medication options for preferences dialog
const sampleMedicationOptions: MedicationOption[] = [
  {
    id: 'semaglutide',
    name: 'Semaglutide (Ozempic)',
    description: 'GLP-1 receptor agonist for weight management',
    category: 'weight_loss',
    available_dosages: ['0.25mg', '0.5mg', '1.0mg', '2.0mg']
  },
  {
    id: 'tirzepatide',
    name: 'Tirzepatide (Mounjaro)',
    description: 'Dual GLP-1/GIP receptor agonist',
    category: 'weight_loss',
    available_dosages: ['2.5mg', '5mg', '7.5mg', '10mg', '12.5mg', '15mg']
  },
  {
    id: 'liraglutide',
    name: 'Liraglutide (Saxenda)',
    description: 'FDA-approved weight management medication',
    category: 'weight_loss',
    available_dosages: ['0.6mg', '1.2mg', '1.8mg', '2.4mg', '3.0mg']
  },
  {
    id: 'testosterone',
    name: 'Testosterone Cypionate',
    description: 'Hormone replacement therapy',
    category: 'mens_health',
    available_dosages: ['100mg/ml', '200mg/ml']
  },
  {
    id: 'sildenafil',
    name: 'Sildenafil (Generic Viagra)',
    description: 'For erectile dysfunction',
    category: 'mens_health',
    available_dosages: ['25mg', '50mg', '100mg']
  }
]

// Medication Preferences Dialog Stories
const medicationPreferencesMeta = {
  title: 'Atomic/Organisms/Patient Information/Medication Preferences',
  component: MedicationPreferencesDialog,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Dialog for patients to select their medication preferences during onboarding. Allows selection of medication and dosage from available options.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Dialog open state'
    },
    medications: {
      description: 'Available medication options'
    },
    loading: {
      control: 'boolean',
      description: 'Loading state for form submission'
    },
    onOpenChange: { action: 'open state changed' },
    onSubmit: { action: 'preferences submitted' }
  }
} satisfies Meta<typeof MedicationPreferencesDialog>

type MedPrefsStory = StoryObj<typeof medicationPreferencesMeta>

export const MedicationPreferences: MedPrefsStory = {
  args: {
    open: true,
    medications: sampleMedicationOptions,
    loading: false
  },
  parameters: {
    docs: {
      description: {
        story: 'Medication preferences selection dialog for patient onboarding. Select a medication to see available dosages. Form validates that both medication and dosage are selected before allowing submission.'
      }
    }
  }
}

export const MedicationPreferencesLoading: MedPrefsStory = {
  args: {
    open: true,
    medications: sampleMedicationOptions,
    loading: true
  },
  parameters: {
    docs: {
      description: {
        story: 'Medication preferences dialog in loading state during form submission. Submit button shows loading text and all form elements are disabled.'
      }
    }
  }
}

MedicationPreferences.meta = medicationPreferencesMeta