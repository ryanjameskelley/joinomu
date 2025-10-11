import type { Meta, StoryObj } from '@storybook/react'
import { WeightLossChallenges, programAdherenceReasons, programConsistencySupports } from './challenges'

const meta: Meta<typeof WeightLossChallenges> = {
  title: 'Atomic/Molecules/Onboarding/Challenges',
  component: WeightLossChallenges,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Weight loss challenges screening for onboarding, allowing users to select their top 3 biggest obstacles to weight loss to help providers understand their specific needs and barriers.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    onChallengesSelect: { action: 'challenges-selected' },
    onContinue: { action: 'continue-clicked' },
    onSignInClick: { action: 'sign-in-clicked' },
    className: { control: 'text' }
  }
}

export default meta
type Story = StoryObj<typeof WeightLossChallenges>

export const Default: Story = {
  args: {
    onChallengesSelect: (challenges: string[]) => {
      console.log('Selected challenges:', challenges)
    },
    onContinue: () => {
      console.log('Continue clicked')
    },
    onSignInClick: () => {
      console.log('Sign in clicked')
    },
    description: "Select your top 3."
  }
}

export const Elaborate: Story = {
  args: {
    onTextChange: (text: string) => {
      console.log('Text changed:', text)
    },
    onContinue: () => {
      console.log('Continue clicked')
    },
    onSignInClick: () => {
      console.log('Sign in clicked')
    },
    progress: 76,
    title: "Tell us more about the hardest part of losing weight for you.",
    description: undefined,
    showTextArea: true,
    textPlaceholder: "Please share more details about your biggest weight loss challenge..."
  },
  parameters: {
    docs: {
      description: {
        story: 'Text area mode for elaborating on weight loss challenges, allowing users to provide detailed explanations about their specific obstacles.'
      }
    }
  }
}

export const ProgramAdherence: Story = {
  args: {
    onChallengesSelect: (challenges: string[]) => {
      console.log('Selected program adherence reasons:', challenges)
    },
    onContinue: () => {
      console.log('Continue clicked')
    },
    onSignInClick: () => {
      console.log('Sign in clicked')
    },
    progress: 77,
    title: "Have you ever stopped a weight loss program before reaching your goal? If so, why?",
    description: undefined,
    challengeOptions: programAdherenceReasons,
    maxSelections: 10
  },
  parameters: {
    docs: {
      description: {
        story: 'Program adherence screening to understand reasons why users may have discontinued previous weight loss programs, helping providers address potential barriers.'
      }
    }
  }
}

export const ProgramConsistency: Story = {
  args: {
    onChallengesSelect: (challenges: string[]) => {
      console.log('Selected program consistency supports:', challenges)
    },
    onContinue: () => {
      console.log('Continue clicked')
    },
    onSignInClick: () => {
      console.log('Sign in clicked')
    },
    progress: 78,
    title: "What would make it easier for you to stick with a weight loss program?",
    description: "Select all that apply.",
    challengeOptions: programConsistencySupports,
    maxSelections: 10
  },
  parameters: {
    docs: {
      description: {
        story: 'Program consistency support screening to identify tools and resources that would help users maintain adherence to their weight loss program.'
      }
    }
  }
}