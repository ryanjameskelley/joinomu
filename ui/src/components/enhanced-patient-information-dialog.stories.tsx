import type { Meta, StoryObj } from '@storybook/react'
import { EnhancedPatientInformationDialog } from './enhanced-patient-information-dialog'
import type { PatientMedication } from './enhanced-patient-information-dialog'
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