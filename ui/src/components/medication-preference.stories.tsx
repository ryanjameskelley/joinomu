import type { Meta, StoryObj } from '@storybook/react'
import { MedicationPreference, type MedicationInfo } from './medication-preference'
import { MedicationCard } from './medication-card'

const meta: Meta<typeof MedicationPreference> = {
  title: 'Atomic/Molecules/Medication Preference',
  component: MedicationPreference,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Medication preference cards showing different approval states. Used to display patient medication selections and their provider approval status.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    medication: {
      control: 'object',
      description: 'Individual medication information',
    },
    paymentRequired: {
      control: 'boolean',
      description: 'Whether payment is required for this medication',
    },
    paymentDueDate: {
      control: 'text',
      description: 'Due date for payment',
    },
    showAverageResults: {
      control: 'boolean',
      description: 'Whether to show average results from clinical studies',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Sample medications for different states
const pendingMedication: MedicationInfo = {
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
}

const approvedMedication: MedicationInfo = {
  name: 'Liraglutide (Saxenda)',
  dosage: '3.0mg',
  frequency: 'Daily injection',
  status: 'approved',
  category: 'weightloss',
  description: 'FDA-approved weight management medication',
  averageResults: {
    weightLoss: '8-10% body weight',
    bloodSugar: '0.8-1.2% HbA1c reduction',
    satisfaction: '78% patient satisfaction'
  }
}

const deniedMedication: MedicationInfo = {
  name: 'Tirzepatide (Mounjaro)',
  dosage: '2.5mg',
  frequency: 'Once weekly injection',
  status: 'denied',
  category: 'weightloss',
  description: 'Dual GLP-1/GIP receptor agonist for diabetes and weight management'
}

export const PendingProviderApproval: Story = {
  args: {
    medication: pendingMedication,
    paymentRequired: false,
    paymentDueDate: 'December 15, 2024',
  },
  parameters: {
    docs: {
      description: {
        story: 'Medication preference with pending provider approval status. Toggle "Payment Required" to see payment notice with contextual messaging.',
      },
    },
  },
}

export const Approved: Story = {
  args: {
    medication: approvedMedication,
    paymentRequired: false,
    paymentDueDate: 'January 10, 2025',
    showAverageResults: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Approved medication preference. Toggle "Payment Required" for payment notice and "Show Average Results" for clinical data.'
      },
    },
  },
}

export const Denied: Story = {
  args: {
    medication: deniedMedication,
    paymentRequired: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Denied medication preference showing red denial status. Clinical results and payment sections hidden by default for denied medications.',
      },
    },
  },
}

// New onboarding completion stories
const medicationPendingData: MedicationInfo = {
  name: 'Semaglutide (Ozempic)',
  dosage: '0.25mg (starting dose)',
  frequency: 'Once weekly injection',
  status: 'pending',
  category: 'weightloss',
  description: 'Your provider will review your medical history and approve your preferred medication within 24-48 hours.',
  averageResults: {
    weightLoss: '12-15% body weight over 6 months',
    bloodSugar: '1.5-2.0% HbA1c reduction',
    satisfaction: '85% patient satisfaction in clinical trials'
  }
}

export const MedicationPending: Story = {
  args: {
    medication: medicationPendingData,
    paymentRequired: false,
    showAverageResults: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Simple medication pending approval state for onboarding completion. Shows selected medication in a compact two-line format with clickable title and status badge.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        {/* Use the simple MedicationCard layout with clickable title */}
        <MedicationCard
          medicationName={medicationPendingData.name}
          dosage={medicationPendingData.dosage}
          supply="30 day supply"
          status="pending"
          onTitleClick={() => alert('Edit medication clicked')}
        />
      </div>
    ),
  ],
}

export const VisitScheduled: Story = {
  args: {
    medication: {
      name: 'Upcoming Appointment',
      dosage: 'Initial Consultation',
      frequency: 'December 15, 2024 at 2:00 PM',
      status: 'approved',
      category: 'weightloss',
      description: 'Virtual consultation with Dr. Sarah Johnson to discuss your weight loss goals and review your medication preferences.',
    } as MedicationInfo,
    showAverageResults: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Visit scheduled state for onboarding completion. Shows upcoming appointment details in a compact two-line format with clickable title for rescheduling.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        {/* Use the simple MedicationCard layout with clickable title */}
        <MedicationCard
          medicationName="Dr. Sarah Johnson"
          dosage="Initial Consultation"
          supply="December 15, 2024 at 2:00 PM"
          status="scheduled"
          onTitleClick={() => alert('Reschedule appointment clicked')}
        />
      </div>
    ),
  ],
}


