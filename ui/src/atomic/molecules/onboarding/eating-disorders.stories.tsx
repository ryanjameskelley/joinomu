import type { Meta, StoryObj } from '@storybook/react'
import { EatingDisordersScreening } from './eating-disorders'

const meta: Meta<typeof EatingDisordersScreening> = {
  title: 'Atomic/Molecules/Onboarding/EatingDisorders',
  component: EatingDisordersScreening,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Eating disorders screening for onboarding, allowing users to indicate any relevant symptoms to help providers recommend appropriate treatment.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    onSymptomSelect: { action: 'symptoms-selected' },
    onContinue: { action: 'continue-clicked' },
    onSignInClick: { action: 'sign-in-clicked' },
    className: { control: 'text' }
  }
}

export default meta
type Story = StoryObj<typeof EatingDisordersScreening>

export const EatingDisorders: Story = {
  args: {
    onSymptomSelect: (symptoms: string[]) => {
      console.log('Selected symptoms:', symptoms)
    },
    onContinue: () => {
      console.log('Continue clicked')
    },
    onSignInClick: () => {
      console.log('Sign in clicked')
    }
  }
}