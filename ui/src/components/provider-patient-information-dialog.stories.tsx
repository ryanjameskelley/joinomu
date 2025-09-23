import type { Meta, StoryObj } from '@storybook/react'
import { ProviderPatientInformationDialog, type ProviderPatientData, type PatientMedicationPreference } from './provider-patient-information-dialog'

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
    medicationName: 'Semaglutide (Ozempic)',
    dosage: '1.0mg',
    frequency: 'Weekly injection',
    status: 'approved',
    requestedDate: '2024-01-15',
    approvedDate: '2024-01-18',
    providerNotes: 'Good candidate for GLP-1 therapy. Monitor blood glucose levels.'
  },
  {
    id: 'pref_2',
    medicationName: 'Tirzepatide (Mounjaro)',
    dosage: '5.0mg',
    frequency: 'Weekly injection',
    status: 'pending',
    requestedDate: '2024-01-20',
    providerNotes: 'Waiting for insurance approval. Alternative to current therapy.'
  },
  {
    id: 'pref_3',
    medicationName: 'Liraglutide (Saxenda)',
    dosage: '3.0mg',
    frequency: 'Daily injection',
    status: 'denied',
    requestedDate: '2024-01-10',
    providerNotes: 'Patient has history of pancreatitis. Not suitable for GLP-1 therapy.'
  },
  {
    id: 'pref_4',
    medicationName: 'Phentermine',
    dosage: '37.5mg',
    frequency: 'Daily',
    status: 'discontinued',
    requestedDate: '2024-01-05',
    approvedDate: '2024-01-08',
    providerNotes: 'Discontinued due to elevated blood pressure. Switched to GLP-1 therapy.'
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
  medicationPreferences: sampleMedicationPreferences
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