import type { Meta, StoryObj } from '@storybook/react'
import { PatientDashboard } from './patient-dashboard'
import { MedicationPreferencesDialog, type MedicationOption } from './medication-preferences-dialog'
import { action } from '@storybook/addon-actions'
import type { ChecklistItem } from './patient-checklist'
import type { MedicationInfo, AppointmentInfo } from './onboarded-patient-dashboard'
import { useState } from 'react'

const meta: Meta<typeof PatientDashboard> = {
  title: 'Atomic/Pages/Patients/Onboarding Dashboard',
  component: PatientDashboard,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Patient onboarding dashboard with sidebar navigation and interactive checklist for new patients.',
      },
    },
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: {
            width: '375px',
            height: '667px',
          },
        },
        tablet: {
          name: 'Tablet',
          styles: {
            width: '768px',
            height: '1024px',
          },
        },
        desktop: {
          name: 'Desktop',
          styles: {
            width: '1200px',
            height: '800px',
          },
        },
        wide: {
          name: 'Wide Desktop',
          styles: {
            width: '1920px',
            height: '1080px',
          },
        },
      },
      defaultViewport: 'desktop',
    },
  },
  tags: ['autodocs'],
  argTypes: {
    user: {
      control: 'object',
      description: 'User information for sidebar display',
    },
    onLogout: {
      action: 'logout-clicked',
      description: 'Callback when logout is clicked',
    },
    isOnboarded: {
      control: 'boolean',
      description: 'Whether patient has completed onboarding',
    },
    checklistItems: {
      control: 'object',
      description: 'Onboarding checklist items',
    },
    onChecklistItemClick: {
      action: 'checklist-item-clicked',
      description: 'Callback when checklist item is clicked',
    },
    medications: {
      control: 'object',
      description: 'Patient medications information',
    },
    selectedCategory: {
      control: 'select',
      options: ['all', 'weightloss', 'mens-health'],
      description: 'Selected treatment category filter',
    },
    onCategoryChange: {
      action: 'category-changed',
      description: 'Callback when category selection changes',
    },
    appointment: {
      control: 'object',
      description: 'Patient appointment information',
    },
    onRescheduleAppointment: {
      action: 'reschedule-clicked',
      description: 'Callback when reschedule button is clicked',
    },
    onMedicationAction: {
      action: 'medication-action-clicked',
      description: 'Callback when medication action button is clicked',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Sample data
const sampleUser = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  avatar: ''
}

const checklistItems: ChecklistItem[] = [
  {
    id: 'plan',
    title: 'Select a plan',
    description: 'Choose the healthcare plan that fits your needs',
    completed: false,
  },
  {
    id: 'medication',
    title: 'Select medication preferences',
    description: "Select from the medications you're eligible for",
    completed: false,
  },
  {
    id: 'appointment',
    title: 'Schedule appointment',
    description: 'Book your first visit with a healthcare provider',
    completed: false,
  },
]

const partiallyCompletedChecklist: ChecklistItem[] = [
  {
    id: 'plan',
    title: 'Select a plan',
    description: 'Choose the healthcare plan that fits your needs',
    completed: true,
  },
  {
    id: 'medication',
    title: 'Select medication preferences',
    description: "Select from the medications you're eligible for",
    completed: false,
  },
  {
    id: 'appointment',
    title: 'Schedule appointment',
    description: 'Book your first visit with a healthcare provider',
    completed: false,
  },
]

const sampleMedications: MedicationInfo[] = [
  {
    name: 'Semaglutide (Ozempic)',
    dosage: '0.5mg',
    frequency: 'Once weekly injection',
    status: 'pending',
    category: 'weightloss',
    description: 'GLP-1 receptor agonist for type 2 diabetes and weight management',
    averageResults: {
      weightLoss: '12-15% body weight',
      bloodSugar: '1.5-2.0% HbA1c reduction',
      satisfaction: '85% patient satisfaction'
    }
  },
  {
    name: 'Testosterone Cypionate',
    dosage: '200mg',
    frequency: 'Bi-weekly injection',
    status: 'approved',
    category: 'mens-health',
    description: 'Hormone replacement therapy for low testosterone',
    averageResults: {
      weightLoss: '5-8% body fat reduction',
      bloodSugar: 'Improved insulin sensitivity',
      satisfaction: '90% patient satisfaction'
    }
  }
]

const sampleAppointment: AppointmentInfo = {
  doctorName: 'Dr. Sarah Johnson',
  doctorTitle: 'Endocrinologist, MD',
  date: 'Tuesday, March 21, 2024',
  time: '2:30 PM EST',
  type: 'Initial Consultation',
  status: 'scheduled'
}

export const NewPatientWithChecklist: Story = {
  args: {
    user: sampleUser,
    isOnboarded: false,
    checklistItems: checklistItems,
    onLogout: action('logout-clicked'),
    onChecklistItemClick: action('checklist-item-clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'New patient view showing the onboarding checklist. All items are pending completion.',
      },
    },
  },
}

export const PartiallyOnboardedPatient: Story = {
  args: {
    user: sampleUser,
    isOnboarded: false,
    checklistItems: partiallyCompletedChecklist,
    onLogout: action('logout-clicked'),
    onChecklistItemClick: action('checklist-item-clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Patient with partial onboarding progress. First item completed, others still pending.',
      },
    },
  },
}

// Sample medication options that would come from Supabase
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

// Interactive story component for medication preferences
function PatientDashboardWithMedicationPreferences() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChecklistItemClick = (item: ChecklistItem) => {
    action('checklist-item-clicked')(item)
    if (item.id === 'medication') {
      setDialogOpen(true)
    }
  }

  const handleMedicationSubmit = async (preferences: { medicationId: string; dosage: string }) => {
    setLoading(true)
    action('medication-preferences-submitted')(preferences)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setLoading(false)
    setDialogOpen(false)
  }

  return (
    <>
      <PatientDashboard
        user={sampleUser}
        isOnboarded={false}
        checklistItems={partiallyCompletedChecklist}
        onLogout={action('logout-clicked')}
        onChecklistItemClick={handleChecklistItemClick}
      />
      <MedicationPreferencesDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        medications={sampleMedicationOptions}
        onSubmit={handleMedicationSubmit}
        loading={loading}
      />
    </>
  )
}

export const WithMedicationPreferences: Story = {
  render: () => <PatientDashboardWithMedicationPreferences />,
  parameters: {
    docs: {
      description: {
        story: 'Patient dashboard with medication preferences dialog integration. Click on "Select medication preferences" checklist item to open the dialog. The dialog shows medications from Supabase and allows dosage selection.'
      }
    }
  }
}

