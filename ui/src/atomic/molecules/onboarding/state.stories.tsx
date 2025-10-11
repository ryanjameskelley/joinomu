import type { Meta, StoryObj } from '@storybook/react'
import { StateSelection } from './state'

const meta: Meta<typeof StateSelection> = {
  title: 'Atomic/Molecules/Onboarding/State',
  component: StateSelection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'State selection for onboarding, allowing users to select their state for medication shipping.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    onStateSelect: { action: 'state-selected' },
    onContinue: { action: 'continue-clicked' },
    onSignInClick: { action: 'sign-in-clicked' },
    className: { control: 'text' }
  }
}

export default meta
type Story = StoryObj<typeof StateSelection>

export const Default: Story = {
  args: {
    onStateSelect: (state: string) => {
      console.log('Selected state:', state)
    },
    onContinue: () => {
      console.log('Continue clicked')
    },
    onSignInClick: () => {
      console.log('Sign in clicked')
    }
  }
}