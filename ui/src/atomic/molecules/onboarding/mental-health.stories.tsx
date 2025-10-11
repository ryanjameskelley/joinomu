import type { Meta, StoryObj } from '@storybook/react'
import { MentalHealthScreening } from './mental-health'

const meta: Meta<typeof MentalHealthScreening> = {
  title: 'Atomic/Molecules/Onboarding/MentalHealth',
  component: MentalHealthScreening,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Mental health screening for onboarding, allowing users to indicate if they have been diagnosed with mental health conditions to help providers understand their complete medical history.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    onMentalHealthSelect: { action: 'mental-health-selected' },
    onContinue: { action: 'continue-clicked' },
    onSignInClick: { action: 'sign-in-clicked' },
    className: { control: 'text' }
  }
}

export default meta
type Story = StoryObj<typeof MentalHealthScreening>

export const MentalHealth: Story = {
  args: {
    onMentalHealthSelect: (option: string) => {
      console.log('Selected mental health option:', option)
    },
    onContinue: () => {
      console.log('Continue clicked')
    },
    onSignInClick: () => {
      console.log('Sign in clicked')
    }
  }
}

export const SelfHarmScreening: Story = {
  args: {
    onMentalHealthSelect: (option: string) => {
      console.log('Selected self-harm screening option:', option)
    },
    onContinue: () => {
      console.log('Continue clicked')
    },
    onSignInClick: () => {
      console.log('Sign in clicked')
    },
    progress: 87,
    title: "Do you currently have any desire to harm yourself or others?",
    description: "We ask so your provider can have a complete understanding of your current health and determine which treatment might be correct for you."
  },
  parameters: {
    docs: {
      description: {
        story: 'Self-harm screening question with custom title and description text.'
      }
    }
  }
}