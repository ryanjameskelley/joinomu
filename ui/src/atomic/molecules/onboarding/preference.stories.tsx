import type { Meta, StoryObj } from '@storybook/react'
import { WeightLossMedicationPreference, Transition } from './preference'

const preferencesMeta: Meta<typeof WeightLossMedicationPreference> = {
  title: 'Atomic/Molecules/Onboarding/Preference',
  component: WeightLossMedicationPreference,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Weight loss medication preference selection for onboarding, allowing users to specify if they have a medication in mind.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    onPreferenceSelect: { action: 'preference-selected' },
    onSignInClick: { action: 'sign-in-clicked' },
    className: { control: 'text' }
  }
}

const transitionMeta: Meta<typeof Transition> = {
  title: 'Atomic/Molecules/Onboarding/Preference',
  component: Transition,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Transition screens with typewriter effect for onboarding flow.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    message: { control: 'text' },
    onContinue: { action: 'continue-clicked' },
    className: { control: 'text' }
  }
}

export default preferencesMeta
type PreferenceStory = StoryObj<typeof WeightLossMedicationPreference>
type TransitionStory = StoryObj<typeof Transition>

export const WeightLoss: PreferenceStory = {
  args: {
    onPreferenceSelect: (preference: string) => {
      console.log('Selected preference:', preference)
    },
    onSignInClick: () => {
      console.log('Sign in clicked')
    }
  }
}

export const TransitionYes: TransitionStory = {
  render: (args) => <Transition {...args} />,
  args: {
    message: "Great, you came prepared!\nLet's keep going to find which treatment option matches your goals and health history.",
    onContinue: () => console.log('Continue clicked')
  }
}

export const TransitionNo: TransitionStory = {
  render: (args) => <Transition {...args} />,
  args: {
    message: "Great, we'll find the perfect treatment for you.\nLet's start with some questions about your health history and goals.",
    onContinue: () => console.log('Continue clicked')
  }
}

