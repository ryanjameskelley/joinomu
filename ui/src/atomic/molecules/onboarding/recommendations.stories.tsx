import type { Meta, StoryObj } from '@storybook/react'
import { MedicationRecommendation } from './recommendations'

const meta: Meta<typeof MedicationRecommendation> = {
  title: 'Atomic/Molecules/Onboarding/Recommendations',
  component: MedicationRecommendation,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Medication recommendation component for onboarding, displaying BMI visualization, qualification status, and medication benefits to help users understand why medication may be right for them.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    onContinue: { action: 'continue-clicked' },
    onSignInClick: { action: 'sign-in-clicked' },
    className: { control: 'text' }
  }
}

export default meta
type Story = StoryObj<typeof MedicationRecommendation>

export const Medication: Story = {
  args: {
    onContinue: () => {
      console.log('Continue clicked')
    },
    onSignInClick: () => {
      console.log('Sign in clicked')
    }
  }
}

export const HowMedicationHelps: Story = {
  args: {
    title: "How medication helps",
    subtitle: "",
    showBMICard: false,
    showHowMedicationHelps: true,
    onContinue: () => {
      console.log('Continue clicked')
    },
    onSignInClick: () => {
      console.log('Sign in clicked')
    }
  }
}