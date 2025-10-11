import type { Meta, StoryObj } from '@storybook/react'
import { SideEffectDosing } from './side-effect-dosing'

const meta: Meta<typeof SideEffectDosing> = {
  title: 'Atomic/Molecules/Onboarding/SideEffectDosing',
  component: SideEffectDosing,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Side effect dosing preferences for onboarding, allowing users to indicate their interest in personalized dosage plans to manage medication side effects.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    onDosingSelect: { action: 'dosing-selected' },
    onContinue: { action: 'continue-clicked' },
    onSignInClick: { action: 'sign-in-clicked' },
    className: { control: 'text' }
  }
}

export default meta
type Story = StoryObj<typeof SideEffectDosing>

export const Gastrointestinal: Story = {
  args: {
    onDosingSelect: (option: string) => {
      console.log('Selected dosing option:', option)
    },
    onContinue: () => {
      console.log('Continue clicked')
    },
    onSignInClick: () => {
      console.log('Sign in clicked')
    }
  }
}

export const EnergySideEffectDosing: Story = {
  args: {
    onDosingSelect: (option: string) => {
      console.log('Selected energy dosing option:', option)
    },
    onContinue: () => {
      console.log('Continue clicked')
    },
    onSignInClick: () => {
      console.log('Sign in clicked')
    },
    progress: 97,
    title: "Would you be interested in your provider considering a personalized dosage plan that can help manage side effects like fatigue and energy loss?"
  },
  parameters: {
    docs: {
      description: {
        story: 'Energy side effect dosing preferences to assess patient interest in personalized dosing strategies for managing fatigue and energy-related side effects.'
      }
    }
  }
}

export const MuscleLossSideEffectDosing: Story = {
  args: {
    onDosingSelect: (option: string) => {
      console.log('Selected muscle loss dosing option:', option)
    },
    onContinue: () => {
      console.log('Continue clicked')
    },
    onSignInClick: () => {
      console.log('Sign in clicked')
    },
    progress: 98,
    title: "Would you be interested in your provider considering a personalized dosage plan that can help manage side effects like muscle loss?"
  },
  parameters: {
    docs: {
      description: {
        story: 'Muscle loss side effect dosing preferences to assess patient interest in personalized dosing strategies for managing muscle loss side effects.'
      }
    }
  }
}