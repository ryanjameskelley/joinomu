import type { Meta, StoryObj } from '@storybook/react'
import { OnboardingCompletion } from './onboarding-completion'
import { action } from '@storybook/addon-actions'

const meta: Meta<typeof OnboardingCompletion> = {
  title: 'Atomic/Organisms/Onboarding Completion',
  component: OnboardingCompletion,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Onboarding completion page that patients see after completing the third onboarding step (scheduling an appointment). Uses MedicationPreference components to display selected medication and scheduled visit information with edit capabilities.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    selectedMedication: {
      control: 'object',
      description: 'The medication selected during onboarding',
    },
    scheduledAppointment: {
      control: 'object',
      description: 'The appointment scheduled during onboarding',
    },
    showAverageResults: {
      control: 'boolean',
      description: 'Whether to show clinical study results for the medication',
    },
    paymentRequired: {
      control: 'boolean',
      description: 'Whether payment is required for the medication',
    },
    paymentDueDate: {
      control: 'text',
      description: 'Due date for payment',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Sample data for stories
const selectedMedication = {
  name: 'Semaglutide (Ozempic)',
  dosage: '0.25mg (starting dose)',
  frequency: 'Once weekly injection',
  status: 'pending' as const,
  category: 'weightloss' as const,
  description: 'Your provider will review your medical history and approve your preferred medication within 24-48 hours.',
  averageResults: {
    weightLoss: '12-15% body weight over 6 months',
    bloodSugar: '1.5-2.0% HbA1c reduction',
    satisfaction: '85% patient satisfaction in clinical trials'
  }
}

const scheduledAppointment = {
  doctorName: 'Dr. Sarah Johnson',
  doctorTitle: 'Board Certified Weight Management Specialist',
  date: 'December 15, 2024',
  time: '2:00 PM EST',
  type: 'Virtual Initial Consultation'
}

export const Default: Story = {
  args: {
    selectedMedication,
    scheduledAppointment,
    showAverageResults: true,
    paymentRequired: false,
    onEditMedication: action('Edit medication clicked'),
    onRescheduleAppointment: action('Reschedule appointment clicked'),
    onContinue: action('Continue to dashboard clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Default onboarding completion state showing medication pending approval and scheduled appointment.',
      },
    },
  },
}

export const WithPaymentRequired: Story = {
  args: {
    selectedMedication,
    scheduledAppointment,
    showAverageResults: true,
    paymentRequired: true,
    paymentDueDate: 'December 20, 2024',
    onEditMedication: action('Edit medication clicked'),
    onRescheduleAppointment: action('Reschedule appointment clicked'),
    onContinue: action('Continue to dashboard clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Onboarding completion with payment required notice for the selected medication.',
      },
    },
  },
}

export const WithoutClinicalResults: Story = {
  args: {
    selectedMedication: {
      ...selectedMedication,
      averageResults: undefined,
    },
    scheduledAppointment,
    showAverageResults: false,
    paymentRequired: false,
    onEditMedication: action('Edit medication clicked'),
    onRescheduleAppointment: action('Reschedule appointment clicked'),
    onContinue: action('Continue to dashboard clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Onboarding completion without clinical results displayed.',
      },
    },
  },
}

export const MensHealthExample: Story = {
  args: {
    selectedMedication: {
      name: 'Sildenafil (Viagra)',
      dosage: '50mg',
      frequency: 'As needed, max once daily',
      status: 'pending' as const,
      category: 'mens-health' as const,
      description: 'Your provider will review your medical history and approve your preferred medication within 24-48 hours.',
      averageResults: {
        weightLoss: 'N/A',
        bloodSugar: 'Improved blood flow',
        satisfaction: '89% patient satisfaction'
      }
    },
    scheduledAppointment: {
      doctorName: 'Dr. Michael Chen',
      doctorTitle: 'Board Certified Urologist',
      date: 'December 18, 2024',
      time: '10:30 AM EST',
      type: 'Virtual Men\'s Health Consultation'
    },
    showAverageResults: true,
    paymentRequired: false,
    onEditMedication: action('Edit medication clicked'),
    onRescheduleAppointment: action('Reschedule appointment clicked'),
    onContinue: action('Continue to dashboard clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Onboarding completion example for men\'s health treatment category.',
      },
    },
  },
}