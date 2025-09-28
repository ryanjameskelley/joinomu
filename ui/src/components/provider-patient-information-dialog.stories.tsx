import type { Meta, StoryObj } from '@storybook/react'
import { ProviderPatientInformationDialog, type ProviderPatientData, type PatientMedicationPreference, type PatientVisit } from './provider-patient-information-dialog'

const meta = {
  title: 'Atomic/Organisms/Patient Information/Provider',
  component: ProviderPatientInformationDialog,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Provider view of patient information dialog with patient medication preferences, treatment tracking, and comprehensive patient data review.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    patient: {
      description: 'Patient data object for provider view'
    },
    open: {
      control: 'boolean',
      description: 'Dialog open state'
    },
    onOpenChange: { action: 'open state changed' }
  },
} satisfies Meta<typeof ProviderPatientInformationDialog>

export default meta
type Story = StoryObj<typeof meta>

// Sample medication preferences
const sampleMedicationPreferences: PatientMedicationPreference[] = [
  {
    id: 'pref_1',
    medication_name: 'Semaglutide (Ozempic)',
    preferred_dosage: '1.0mg',
    frequency: 'Weekly injection',
    status: 'approved',
    requested_date: '2024-01-15',
    notes: 'Good candidate for GLP-1 therapy. Monitor blood glucose levels.'
  },
  {
    id: 'pref_2',
    medication_name: 'Tirzepatide (Mounjaro)',
    preferred_dosage: '5.0mg',
    frequency: 'Weekly injection',
    status: 'pending',
    requested_date: '2024-01-20',
    notes: 'Waiting for insurance approval. Alternative to current therapy.'
  },
  {
    id: 'pref_3',
    medication_name: 'Liraglutide (Saxenda)',
    preferred_dosage: '3.0mg',
    frequency: 'Daily injection',
    status: 'denied',
    requested_date: '2024-01-10',
    notes: 'Patient has history of pancreatitis. Not suitable for GLP-1 therapy.'
  },
  {
    id: 'pref_4',
    medication_name: 'Phentermine',
    preferred_dosage: '37.5mg',
    frequency: 'Daily',
    status: 'discontinued',
    requested_date: '2024-01-05',
    notes: 'Discontinued due to elevated blood pressure. Switched to GLP-1 therapy.'
  }
]

// Sample visit history
const sampleVisits: PatientVisit[] = [
  {
    id: 'visit_1',
    appointment_date: '2024-03-15',
    start_time: '2:30 PM',
    appointment_type: 'Follow-up Consultation',
    treatment_type: 'weight_management',
    status: 'completed',
    provider_notes: 'Patient responding well to GLP-1 therapy. Lost 8 lbs since last visit.',
    patient_notes: 'Feeling more energetic, appetite well controlled.'
  },
  {
    id: 'visit_2',
    appointment_date: '2024-03-22',
    start_time: '10:00 AM',
    appointment_type: 'Initial Consultation',
    treatment_type: 'weight_management',
    status: 'scheduled',
    provider_notes: 'Initial assessment and treatment planning.',
  },
  {
    id: 'visit_3',
    appointment_date: '2024-02-28',
    start_time: '11:15 AM',
    appointment_type: 'Check-up',
    treatment_type: 'diabetes_management',
    status: 'completed',
    provider_notes: 'Blood glucose levels improved. Continue current medication regimen.',
  },
  {
    id: 'visit_4',
    appointment_date: '2024-02-14',
    start_time: '3:45 PM',
    appointment_type: 'Lab Review',
    treatment_type: 'weight_management',
    status: 'cancelled',
    provider_notes: 'Patient rescheduled due to illness.',
  }
]

// Sample patient data for provider view
const samplePatient: ProviderPatientData = {
  id: 'pat_provider_123',
  name: 'Sarah Johnson',
  email: 'sarah.johnson@example.com',
  dateOfBirth: '1985-03-15',
  gender: 'Female',
  patientId: 'PAT-2024-001',
  phone: '+1 (555) 123-4567',
  address: '123 Main St, San Francisco, CA 94102',
  treatmentType: 'Weight Management',
  assignedDate: '2024-01-15',
  isPrimary: true,
  medicationPreferences: sampleMedicationPreferences,
  visits: sampleVisits
}

// Patient Information story
export const Information: Story = {
  args: {
    patient: samplePatient,
    open: true
  },
  parameters: {
    docs: {
      description: {
        story: 'Provider view of patient basic information including demographics, contact details, and treatment assignment information.'
      }
    }
  }
}

// Medications story - shows patient medication preferences with status badges
export const Medications: Story = {
  args: {
    patient: samplePatient,
    open: true
  },
  parameters: {
    docs: {
      description: {
        story: 'Provider medication management view showing patient medication preferences with status badges (pending, approved, denied, discontinued). Click on medications to view detailed information including start dates and approval history.'
      }
    }
  }
}

// Visits story - shows patient visit history with date/time in card format
export const Visits: Story = {
  args: {
    patient: samplePatient,
    open: true
  },
  parameters: {
    docs: {
      description: {
        story: 'Provider view of patient visit history showing appointments with dates, times, visit types, and status badges. Displays patient name, appointment details, and treatment types in card format similar to the medications section.'
      }
    }
  }
}