import type { Meta, StoryObj } from '@storybook/react'
import { PatientTreatments, type MonthlyHistory } from './patient-treatments'
import { action } from '@storybook/addon-actions'

const meta: Meta<typeof PatientTreatments> = {
  title: 'Atomic/Pages/Patients/Treatments',
  component: PatientTreatments,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Patient treatments page showing next scheduled shot and historical medication tracking with scrollable history section.',
      },
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
    nextShot: {
      control: 'object',
      description: 'Next scheduled medication shot information',
    },
    history: {
      control: 'object', 
      description: 'Historical medication tracking data organized by month',
    },
    treatmentType: {
      control: 'text',
      description: 'Type of treatment for breadcrumb display',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Sample user data
const sampleUser = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  avatar: ''
}

// Weight loss treatment data
const weightLossNextShot = {
  medication: 'Semaglutide (Ozempic)',
  dosage: '0.5 mg',
  day: 'Monday',
  time: '8:00 AM'
}

const weightLossHistory: MonthlyHistory[] = [
  {
    month: 'December 2024',
    items: [
      {
        medication: 'Semaglutide (Ozempic)',
        dosage: '0.5 mg',
        date: 'Wednesday',
        time: '6:00 PM'
      },
      {
        medication: 'Semaglutide (Ozempic)',
        dosage: '0.5 mg',
        date: 'Monday',
        time: '8:00 AM'
      },
      {
        medication: 'Semaglutide (Ozempic)',
        dosage: '0.5 mg',
        date: 'Friday',
        time: '7:30 AM'
      }
    ]
  },
  {
    month: 'November 2024',
    items: [
      {
        medication: 'Semaglutide (Ozempic)',
        dosage: '0.25 mg',
        date: 'Wednesday',
        time: '6:00 PM'
      },
      {
        medication: 'Semaglutide (Ozempic)',
        dosage: '0.25 mg',
        date: 'Monday',
        time: '8:00 AM'
      },
      {
        medication: 'Semaglutide (Ozempic)',
        dosage: '0.25 mg',
        date: 'Friday',
        time: '7:30 AM'
      },
      {
        medication: 'Semaglutide (Ozempic)',
        dosage: '0.25 mg',
        date: 'Tuesday',
        time: '9:15 AM'
      }
    ]
  },
  {
    month: 'October 2024',
    items: [
      {
        medication: 'Semaglutide (Ozempic)',
        dosage: '0.25 mg',
        date: 'Saturday',
        time: '7:00 AM'
      },
      {
        medication: 'Semaglutide (Ozempic)',
        dosage: '0.25 mg',
        date: 'Wednesday',
        time: '6:30 PM'
      }
    ]
  }
]

// Men's health treatment data
const mensHealthNextShot = {
  medication: 'Testosterone Cypionate',
  dosage: '200 mg',
  day: 'Friday',
  time: '10:00 AM'
}

const mensHealthHistory: MonthlyHistory[] = [
  {
    month: 'December 2024',
    items: [
      {
        medication: 'Testosterone Cypionate',
        dosage: '200 mg',
        date: 'Friday',
        time: '10:00 AM'
      },
      {
        medication: 'Testosterone Cypionate', 
        dosage: '200 mg',
        date: 'Monday',
        time: '2:30 PM'
      }
    ]
  },
  {
    month: 'November 2024',
    items: [
      {
        medication: 'Testosterone Cypionate',
        dosage: '200 mg',
        date: 'Thursday',
        time: '9:00 AM'
      },
      {
        medication: 'Testosterone Cypionate',
        dosage: '200 mg', 
        date: 'Monday',
        time: '11:15 AM'
      },
      {
        medication: 'Testosterone Cypionate',
        dosage: '200 mg',
        date: 'Friday',
        time: '3:45 PM'
      }
    ]
  },
  {
    month: 'October 2024',
    items: [
      {
        medication: 'Testosterone Cypionate',
        dosage: '200 mg',
        date: 'Tuesday',
        time: '8:30 AM'
      },
      {
        medication: 'Testosterone Cypionate',
        dosage: '200 mg',
        date: 'Saturday',
        time: '1:00 PM'
      },
      {
        medication: 'Testosterone Cypionate',
        dosage: '200 mg',
        date: 'Wednesday',
        time: '4:20 PM'
      }
    ]
  }
]

export const WeightLoss: Story = {
  args: {
    user: sampleUser,
    onLogout: action('logout-clicked'),
    nextShot: weightLossNextShot,
    history: weightLossHistory,
    treatmentType: 'Weight Loss',
  },
  parameters: {
    docs: {
      description: {
        story: 'Weight loss treatment page showing Semaglutide (Ozempic) injections with next scheduled shot and historical tracking.',
      },
    },
  },
}

export const MensHealth: Story = {
  args: {
    user: sampleUser,
    onLogout: action('logout-clicked'),
    nextShot: mensHealthNextShot,
    history: mensHealthHistory,
    treatmentType: "Men's Health",
  },
  parameters: {
    docs: {
      description: {
        story: 'Men\'s health treatment page showing Testosterone Cypionate injections with next scheduled shot and historical tracking.',
      },
    },
  },
}