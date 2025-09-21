import type { Meta, StoryObj } from '@storybook/react'
import { OnboardedPatientDashboard, type MedicationInfo, type VisitInfo, type AppointmentInfo } from './onboarded-patient-dashboard'
import { action } from '@storybook/addon-actions'

const meta: Meta<typeof OnboardedPatientDashboard> = {
  title: 'Atomic/Molecules/OnboardedPatientDashboard',
  component: OnboardedPatientDashboard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Individual medication and appointment cards for onboarded patients. Can be used separately or together in a two-column layout.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['medication-only', 'appointment-only', 'both'],
      description: 'Component variant to display',
    },
    medication: {
      control: 'object',
      description: 'Patient medication information',
    },
    visits: {
      control: 'object',
      description: 'Patient visits information with multiple providers',
    },
    appointment: {
      control: 'object',
      description: 'Patient appointment information (legacy)',
    },
    onRescheduleVisit: {
      action: 'reschedule-visit-clicked',
      description: 'Callback when reschedule visit button is clicked',
    },
    onRescheduleAppointment: {
      action: 'reschedule-clicked',
      description: 'Callback when reschedule button is clicked (legacy)',
    },
    onMedicationAction: {
      action: 'medication-action-clicked',
      description: 'Callback when medication action button is clicked',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Sample data
const sampleMedication: MedicationInfo = {
  name: 'Semaglutide (Ozempic)',
  dosage: '0.5mg',
  frequency: 'Once weekly injection',
  status: 'pending',
  description: 'GLP-1 receptor agonist for type 2 diabetes and weight management',
  averageResults: {
    weightLoss: '12-15% body weight',
    bloodSugar: '1.5-2.0% HbA1c reduction',
    satisfaction: '85% patient satisfaction'
  }
}

const approvedMedication: MedicationInfo = {
  name: 'Liraglutide (Saxenda)',
  dosage: '3.0mg',
  frequency: 'Daily injection',
  status: 'approved',
  description: 'FDA-approved weight management medication',
  averageResults: {
    weightLoss: '8-10% body weight',
    bloodSugar: '0.8-1.2% HbA1c reduction',
    satisfaction: '78% patient satisfaction'
  }
}

const sampleVisits: VisitInfo[] = [
  {
    doctorName: 'Dr. Sarah Johnson',
    doctorTitle: 'Endocrinologist, MD',
    date: 'Tuesday, March 21, 2024',
    time: '2:30 PM EST',
    type: 'Weight Loss Consultation',
    status: 'scheduled',
    medicationName: 'Semaglutide (Ozempic)',
    medicationDosage: '0.5mg',
    medicationCategory: 'weightloss'
  },
  {
    doctorName: 'Dr. Michael Chen',
    doctorTitle: 'Urologist, MD',
    date: 'Friday, March 24, 2024',
    time: '10:00 AM EST',
    type: 'Hormone Therapy Follow-up',
    status: 'confirmed',
    medicationName: 'Testosterone Cypionate',
    medicationDosage: '200mg',
    medicationCategory: 'mens-health'
  }
]

const sampleAppointment: AppointmentInfo = sampleVisits[0]

const confirmedAppointment: AppointmentInfo = sampleVisits[1]

export const MedicationOnly: Story = {
  args: {
    variant: 'medication-only',
    medications: [sampleMedications[0]],
    onMedicationAction: action('medication-action-clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Individual medication preference card with pending approval status and clinical results.',
      },
    },
  },
}

export const MedicationApproved: Story = {
  args: {
    variant: 'medication-only',
    medications: [approvedMedications[0]],
    onMedicationAction: action('medication-action-clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Medication card with approved status - no action button shown.',
      },
    },
  },
}

export const VisitsOnly: Story = {
  args: {
    variant: 'visit-only',
    visits: sampleVisits,
    onRescheduleVisit: action('reschedule-visit-clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Multiple visits showing different providers and their medication responsibilities.'
      },
    },
  },
}

export const SingleVisitConfirmed: Story = {
  args: {
    variant: 'visit-only',
    visits: [sampleVisits[1]],
    onRescheduleVisit: action('reschedule-visit-clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Single visit with confirmed status and medication information.'
      },
    },
  },
}

export const TwoColumnLayout: Story = {
  args: {
    variant: 'both',
    medications: [sampleMedications[0]],
    visits: [sampleVisits[0]],
    onRescheduleVisit: action('reschedule-visit-clicked'),
    onMedicationAction: action('medication-action-clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Medication and visit cards in responsive two-column layout.'
      },
    },
  },
}

export const ApprovedMedicationConfirmedVisit: Story = {
  args: {
    variant: 'both',
    medications: [approvedMedications[0]],
    visits: [sampleVisits[1]],
    onRescheduleVisit: action('reschedule-visit-clicked'),
    onMedicationAction: action('medication-action-clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Optimal state with approved medication and confirmed visit.'
      },
    },
  },
}

export const WithoutAverageResults: Story = {
  args: {
    variant: 'medication-only',
    medications: [{
      name: 'Metformin',
      dosage: '500mg',
      frequency: 'Twice daily with meals',
      status: 'pending',
      category: 'general',
      description: 'First-line medication for type 2 diabetes'
    }],
    onMedicationAction: action('medication-action-clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Medication card without average results data - simpler layout.',
      },
    },
  },
}

export const MultipleMedications: Story = {
  args: {
    variant: 'medication-only',
    medications: sampleMedications,
    selectedCategory: 'all',
    onCategoryChange: action('category-changed'),
    onMedicationAction: action('medication-action-clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Multiple medications from different categories with treatment selector.',
      },
    },
  },
}

export const WeightLossOnly: Story = {
  args: {
    variant: 'medication-only',
    medications: sampleMedications,
    selectedCategory: 'weightloss',
    onCategoryChange: action('category-changed'),
    onMedicationAction: action('medication-action-clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Filtered view showing only weight loss medications.',
      },
    },
  },
}

export const MensHealthOnly: Story = {
  args: {
    variant: 'medication-only',
    medications: sampleMedications,
    selectedCategory: 'mens-health',
    onCategoryChange: action('category-changed'),
    onMedicationAction: action('medication-action-clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Filtered view showing only men\'s health medications.',
      },
    },
  },
}