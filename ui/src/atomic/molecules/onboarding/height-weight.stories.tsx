import type { Meta, StoryObj } from '@storybook/react'
import { HeightWeight } from './height-weight'

const meta: Meta<typeof HeightWeight> = {
  title: 'Atomic/Molecules/Onboarding/HeightWeight',
  component: HeightWeight,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Height and weight collection for onboarding, allowing users to input their basic measurements for BMI calculation and treatment eligibility determination.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    onHeightFeetChange: { action: 'height-feet-changed' },
    onHeightInchesChange: { action: 'height-inches-changed' },
    onWeightChange: { action: 'weight-changed' },
    onContinue: { action: 'continue-clicked' },
    onSignInClick: { action: 'sign-in-clicked' },
    progress: { control: { type: 'range', min: 0, max: 100 } },
    title: { control: 'text' },
    description: { control: 'text' },
    className: { control: 'text' }
  }
}

export default meta
type Story = StoryObj<typeof HeightWeight>

export const Default: Story = {
  args: {
    onHeightFeetChange: (feet: string) => {
      console.log('Height feet changed:', feet)
    },
    onHeightInchesChange: (inches: string) => {
      console.log('Height inches changed:', inches)
    },
    onWeightChange: (weight: string) => {
      console.log('Weight changed:', weight)
    },
    onContinue: () => {
      console.log('Continue clicked')
    },
    onSignInClick: () => {
      console.log('Sign in clicked')
    },
    progress: 25
  }
}

