import type { Meta, StoryObj } from '@storybook/react'
import { ActivityLevelSelection } from './activity'

const meta: Meta<typeof ActivityLevelSelection> = {
  title: 'Atomic/Molecules/Onboarding/Activity',
  component: ActivityLevelSelection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Activity level selection for onboarding, allowing users to specify their daily exercise habits.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    onActivitySelect: { action: 'activity-selected' },
    onContinue: { action: 'continue-clicked' },
    onSignInClick: { action: 'sign-in-clicked' },
    className: { control: 'text' }
  }
}

export default meta
type Story = StoryObj<typeof ActivityLevelSelection>

export const ActivityLevel: Story = {
  args: {
    onActivitySelect: (activity: string) => {
      console.log('Selected activity level:', activity)
    },
    onContinue: () => {
      console.log('Continue clicked')
    },
    onSignInClick: () => {
      console.log('Sign in clicked')
    }
  }
}