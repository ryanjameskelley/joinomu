import type { Meta, StoryObj } from '@storybook/react'
import { MedicationCard } from './medication-card'

const meta = {
  title: 'Atomic/Molecules/Medications',
  component: MedicationCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A simple card component for displaying medication information with name, dosage, and supply details.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    medicationName: {
      control: 'text',
      description: 'The name of the medication'
    },
    dosage: {
      control: 'text', 
      description: 'The dosage of the medication'
    },
    supply: {
      control: 'text',
      description: 'The supply information'
    },
    onClick: { action: 'clicked' }
  },
} satisfies Meta<typeof MedicationCard>

export default meta
type Story = StoryObj<typeof meta>

// Primary story with Semaglutide
export const Default: Story = {
  args: {
    medicationName: 'Semaglutide',
    dosage: '1mg',
    supply: '30 day supply'
  }
}

// Preferred medications - includes status tag and order number
export const Preferred: Story = {
  args: {
    medicationName: 'Semaglutide',
    dosage: '1mg',
    supply: '30 day supply',
    status: 'approved',
    orderNumber: 'ORD001'
  },
  parameters: {
    docs: {
      description: {
        story: 'Medication card for preferred medications with status badge and order number. Used in patient medication preferences.'
      }
    }
  }
}

// Orders - includes status, date and approval info
export const Orders: Story = {
  args: {
    medicationName: 'Semaglutide',
    dosage: '1mg',
    supply: '30 day supply',
    status: 'delivered',
    orderDate: '2024-01-15',
    approvalId: 'b89c1bf3-17a7-4807-8532-894825150e41'
  },
  parameters: {
    docs: {
      description: {
        story: 'Medication card for orders with delivery status, order date, and approval ID. Used in patient medication orders.'
      }
    }
  }
}