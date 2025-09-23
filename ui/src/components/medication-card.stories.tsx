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

// Weight loss medications
export const WeightLoss: Story = {
  args: {
    medicationName: 'Ozempic',
    dosage: '0.5mg',
    supply: '28 day supply'
  }
}

export const Tirzepatide: Story = {
  args: {
    medicationName: 'Tirzepatide',
    dosage: '5mg',
    supply: '30 day supply'
  }
}

export const Liraglutide: Story = {
  args: {
    medicationName: 'Liraglutide',
    dosage: '3mg',
    supply: '30 day supply'
  }
}

// Men's health medications
export const TestosteroneGel: Story = {
  args: {
    medicationName: 'Testosterone Gel',
    dosage: '50mg',
    supply: '30 day supply'
  }
}

export const TestosteroneCypionate: Story = {
  args: {
    medicationName: 'Testosterone Cypionate',
    dosage: '200mg/ml',
    supply: '10ml vial'
  }
}

export const Sildenafil: Story = {
  args: {
    medicationName: 'Sildenafil',
    dosage: '50mg',
    supply: '30 tablets'
  }
}

export const Tadalafil: Story = {
  args: {
    medicationName: 'Tadalafil',
    dosage: '20mg',
    supply: '30 tablets'
  }
}

export const Finasteride: Story = {
  args: {
    medicationName: 'Finasteride',
    dosage: '1mg',
    supply: '90 tablets'
  }
}

// Interactive example
export const Clickable: Story = {
  args: {
    medicationName: 'Phentermine',
    dosage: '37.5mg',
    supply: '30 capsules'
  },
  parameters: {
    docs: {
      description: {
        story: 'Example of a clickable medication card with hover effects'
      }
    }
  }
}

// Multiple cards in a grid layout
export const MultipleCards: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
      <MedicationCard 
        medicationName="Semaglutide" 
        dosage="1mg" 
        supply="30 day supply" 
      />
      <MedicationCard 
        medicationName="Testosterone Gel" 
        dosage="50mg" 
        supply="30 day supply" 
      />
      <MedicationCard 
        medicationName="Sildenafil" 
        dosage="50mg" 
        supply="30 tablets" 
      />
      <MedicationCard 
        medicationName="Tirzepatide" 
        dosage="5mg" 
        supply="30 day supply" 
      />
      <MedicationCard 
        medicationName="Finasteride" 
        dosage="1mg" 
        supply="90 tablets" 
      />
      <MedicationCard 
        medicationName="Liraglutide" 
        dosage="3mg" 
        supply="30 day supply" 
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example showing multiple medication cards in a responsive grid layout'
      }
    }
  }
}