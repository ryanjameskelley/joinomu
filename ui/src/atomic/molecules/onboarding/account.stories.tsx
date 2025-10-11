import type { Meta, StoryObj } from '@storybook/react'
import { AccountCreation } from './account'

const meta: Meta<typeof AccountCreation> = {
  title: 'Atomic/Molecules/Onboarding/Account',
  component: AccountCreation,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Account creation for onboarding, allowing users to create an account while showing their selected goals and motivations.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    selectedGoal: { control: 'select', options: ['1-15', '16-50', '51+', 'not-sure'] },
    selectedMotivations: { 
      control: 'check', 
      options: ['energy', 'confidence', 'healthier', 'clothes', 'own-skin'] 
    },
    onEmailChange: { action: 'email-changed' },
    onPasswordChange: { action: 'password-changed' },
    onConfirmPasswordChange: { action: 'confirm-password-changed' },
    onContinue: { action: 'continue-clicked' },
    onSignInClick: { action: 'sign-in-clicked' },
    className: { control: 'text' }
  }
}

export default meta
type Story = StoryObj<typeof AccountCreation>

export const Default: Story = {
  args: {
    selectedGoal: '1-15',
    selectedMotivations: ['energy', 'confidence'],
    onEmailChange: (email: string) => {
      console.log('Email changed:', email)
    },
    onPasswordChange: (password: string) => {
      console.log('Password changed:', password)
    },
    onConfirmPasswordChange: (confirmPassword: string) => {
      console.log('Confirm password changed:', confirmPassword)
    },
    onContinue: () => {
      console.log('Continue clicked')
    },
    onSignInClick: () => {
      console.log('Sign in clicked')
    }
  }
}