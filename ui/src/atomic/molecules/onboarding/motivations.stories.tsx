import type { Meta, StoryObj } from '@storybook/react'
import { WeightLossMotivations } from './motivations'

const meta: Meta<typeof WeightLossMotivations> = {
  title: 'Atomic/Molecules/Onboarding/Motivations',
  component: WeightLossMotivations,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Weight loss motivations selection for onboarding, allowing users to select multiple motivations for reaching their goal weight.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    selectedGoal: { control: 'select', options: ['1-15', '16-50', '51+', 'not-sure'] },
    onMotivationsSelect: { action: 'motivations-selected' },
    onContinue: { action: 'continue-clicked' },
    onSignInClick: { action: 'sign-in-clicked' },
    className: { control: 'text' }
  }
}

export default meta
type Story = StoryObj<typeof WeightLossMotivations>

export const WeightLoss: Story = {
  args: {
    selectedGoal: '1-15',
    onMotivationsSelect: (motivations: string[]) => {
      console.log('Selected motivations:', motivations)
    },
    onContinue: () => {
      console.log('Continue clicked')
    },
    onSignInClick: () => {
      console.log('Sign in clicked')
    }
  }
}