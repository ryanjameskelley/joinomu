import type { Meta, StoryObj } from '@storybook/react'
import { PatientDashboard } from './patient-dashboard'
import { action } from '@storybook/addon-actions'
import type { MedicationInfo, VisitInfo, AppointmentInfo } from './onboarded-patient-dashboard'

const meta: Meta<typeof PatientDashboard> = {
  title: 'Atomic/Pages/Patients/Onboarded Dashboard',
  component: PatientDashboard,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Patient dashboard for onboarded users, displaying medication and appointment information in a two-column layout.',
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
      description: 'Whether patient has completed onboarding (should be true for this dashboard)',
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
    showAverageResults: {
      control: 'boolean',
      description: 'Whether to show average results from clinical studies',
    },
    paymentRequired: {
      control: 'boolean',
      description: 'Whether payment is required for medications',
    },
    paymentDueDate: {
      control: 'text',
      description: 'Due date for payment',
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

const approvedMedications: MedicationInfo[] = [
  {
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
  },
  {
    name: 'Finasteride',
    dosage: '1mg',
    frequency: 'Daily oral tablet',
    status: 'approved',
    category: 'mens-health',
    description: 'Hair loss prevention medication'
  }
]

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

export const FullOnboardedDashboard: Story = {
  args: {
    user: sampleUser,
    isOnboarded: true,
    medications: sampleMedications,
    visits: sampleVisits,
    showAverageResults: false,
    paymentRequired: false,
    paymentDueDate: 'December 15, 2024',
    onLogout: action('logout-clicked'),
    onRescheduleVisit: action('reschedule-visit-clicked'),
    onMedicationAction: action('medication-action-clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Complete onboarded patient dashboard with both medication and appointment information displayed in two-column layout.',
      },
    },
  },
}

export const ApprovedMedicationConfirmedAppointment: Story = {
  args: {
    user: sampleUser,
    isOnboarded: true,
    medications: [approvedMedications[0]],
    visits: [sampleVisits[1]],
    showAverageResults: false,
    paymentRequired: false,
    paymentDueDate: 'December 15, 2024',
    onLogout: action('logout-clicked'),
    onRescheduleVisit: action('reschedule-visit-clicked'),
    onMedicationAction: action('medication-action-clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Onboarded patient with approved medication and confirmed appointment - optimal post-onboarding state.',
      },
    },
  },
}

export const MedicationOnlyView: Story = {
  args: {
    user: sampleUser,
    isOnboarded: true,
    medications: [sampleMedications[0]],
    showAverageResults: false,
    paymentRequired: false,
    paymentDueDate: 'December 15, 2024',
    onLogout: action('logout-clicked'),
    onMedicationAction: action('medication-action-clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Onboarded patient with only medication information (no appointment scheduled yet).',
      },
    },
  },
}

export const VisitsOnlyView: Story = {
  args: {
    user: sampleUser,
    isOnboarded: true,
    visits: sampleVisits,
    showAverageResults: false,
    paymentRequired: false,
    paymentDueDate: 'December 15, 2024',
    onLogout: action('logout-clicked'),
    onRescheduleVisit: action('reschedule-visit-clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Onboarded patient with multiple provider visits showing medication responsibilities.'
      },
    },
  },
}

export const EmptyOnboardedDashboard: Story = {
  args: {
    user: sampleUser,
    isOnboarded: true,
    showAverageResults: false,
    paymentRequired: false,
    paymentDueDate: 'December 15, 2024',
    onLogout: action('logout-clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Onboarded patient with no medication or visit data - shows placeholder content.'
      },
    },
  },
}

export const MultipleMedicationsWithFilter: Story = {
  args: {
    user: sampleUser,
    isOnboarded: true,
    medications: sampleMedications,
    visits: sampleVisits,
    selectedCategory: 'weightloss',
    showAverageResults: false,
    onCategoryChange: action('category-changed'),
    onLogout: action('logout-clicked'),
    onRescheduleVisit: action('reschedule-visit-clicked'),
    onMedicationAction: action('medication-action-clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Onboarded patient with multiple treatment categories and category filter showing weight loss only.',
      },
    },
  },
}

export const AllTreatmentsView: Story = {
  args: {
    user: sampleUser,
    isOnboarded: true,
    medications: sampleMedications,
    visits: sampleVisits,
    selectedCategory: 'all',
    showAverageResults: false,
    onCategoryChange: action('category-changed'),
    onLogout: action('logout-clicked'),
    onRescheduleVisit: action('reschedule-visit-clicked'),
    onMedicationAction: action('medication-action-clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Onboarded patient dashboard showing all treatment categories (Weight Loss + Men\'s Health).',
      },
    },
  },
}