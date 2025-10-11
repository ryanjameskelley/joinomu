import type { Meta, StoryObj } from '@storybook/react'
import { WeightLossOnboardingEntry, PathEntry } from './entry'

const weightLossMeta: Meta<typeof WeightLossOnboardingEntry> = {
  title: 'Atomic/Molecules/Onboarding/Entry',
  component: WeightLossOnboardingEntry,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'The entry point for weight loss onboarding, allowing users to select their weight loss goals.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    onGoalSelect: { action: 'goal-selected' },
    onSignInClick: { action: 'sign-in-clicked' },
    className: { control: 'text' }
  }
}

const pathMeta: Meta<typeof PathEntry> = {
  title: 'Atomic/Molecules/Onboarding/Entry',
  component: PathEntry,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Path entry for onboarding, allowing users to select multiple health areas to improve.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    onAreasSelect: { action: 'areas-selected' },
    onContinue: { action: 'continue-clicked' },
    onSignInClick: { action: 'sign-in-clicked' },
    className: { control: 'text' }
  }
}

export default weightLossMeta
type WeightLossStory = StoryObj<typeof WeightLossOnboardingEntry>
type PathStory = StoryObj<typeof PathEntry>

export const WeightLoss: WeightLossStory = {
  args: {
    onGoalSelect: (goal: string) => {
      console.log('Selected goal:', goal)
    },
    onSignInClick: () => {
      console.log('Sign in clicked')
    }
  }
}

export const PathEntryStory: PathStory = {
  render: (args) => <PathEntry {...args} />,
  args: {
    onAreasSelect: (areas: string[]) => {
      console.log('Selected areas:', areas)
    },
    onContinue: () => {
      console.log('Continue clicked')
    },
    onSignInClick: () => {
      console.log('Sign in clicked')
    }
  }
}