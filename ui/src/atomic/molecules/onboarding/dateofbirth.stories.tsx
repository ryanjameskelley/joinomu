import type { Meta, StoryObj } from '@storybook/react'
import { DateOfBirth } from './dateofbirth'

const meta: Meta<typeof DateOfBirth> = {
  title: 'Atomic/Molecules/Onboarding/DateOfBirth',
  component: DateOfBirth,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Date of birth input for onboarding, allowing users to enter their birth date in MM/DD/YYYY format.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    onDateChange: { action: 'date-changed' },
    onGenderSelect: { action: 'gender-selected' },
    onContinue: { action: 'continue-clicked' },
    onSignInClick: { action: 'sign-in-clicked' },
    className: { control: 'text' }
  }
}

export default meta
type Story = StoryObj<typeof DateOfBirth>

export const Default: Story = {
  args: {
    onDateChange: (date: string) => {
      console.log('Date changed:', date)
    },
    onGenderSelect: (gender: string) => {
      console.log('Gender selected:', gender)
    },
    onContinue: () => {
      console.log('Continue clicked')
    },
    onSignInClick: () => {
      console.log('Sign in clicked')
    }
  }
}