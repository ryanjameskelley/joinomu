import type { Meta, StoryObj } from '@storybook/react'
import { EnhancedPatientInformationDialog } from './enhanced-patient-information-dialog'
import { MedicationPreferencesDialog, type MedicationOption } from './medication-preferences-dialog'
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