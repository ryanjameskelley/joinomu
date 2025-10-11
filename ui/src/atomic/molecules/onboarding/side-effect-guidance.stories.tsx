import type { Meta, StoryObj } from '@storybook/react'
import { SideEffectGuidance } from './side-effect-guidance'

const meta: Meta<typeof SideEffectGuidance> = {
  title: 'Atomic/Molecules/Onboarding/SideEffectGuidance',
  component: SideEffectGuidance,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Side effect guidance screening for onboarding, allowing users to indicate which side effects they would like personalized treatment plans for to help providers create customized care approaches.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    onSideEffectGuidanceSelect: { action: 'side-effect-guidance-selected' },
    onContinue: { action: 'continue-clicked' },
    onSignInClick: { action: 'sign-in-clicked' },
    className: { control: 'text' }
  }
}

export default meta
type Story = StoryObj<typeof SideEffectGuidance>

export const Default: Story = {
  args: {
    onSideEffectGuidanceSelect: (sideEffects: string[]) => {
      console.log('Selected side effect guidance options:', sideEffects)
    },
    onContinue: () => {
      console.log('Continue clicked')
    },
    onSignInClick: () => {
      console.log('Sign in clicked')
    }
  }
}