import type { Meta, StoryObj } from '@storybook/react'
import { Transition } from './preference'

const meta: Meta<typeof Transition> = {
  title: 'Atomic/Molecules/Onboarding/Transition',
  component: Transition,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Health history transition screen for onboarding flow with smooth text animation.'
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

export default meta
type Story = StoryObj<typeof Transition>

export const HealthHistory: Story = {
  args: {
    message: "Congratulations! Your health assessment is complete 🎉\nWelcome to your personalized weight loss journey.",
    onContinue: () => console.log('Continue clicked')
  }
}

export const RecommendationTransition: Story = {
  args: {
    message: "✓ Weight loss profile\n✓ Health history\n\nGreat, all that's left is selecting a plan and the medications you'd like to discuss with your provider and scheduling your first visit.",
    onContinue: () => console.log('Continue clicked')
  }
}