import type { Meta, StoryObj } from '@storybook/react'
import { AdditionalInformation } from './additional'

const meta: Meta<typeof AdditionalInformation> = {
  title: 'Atomic/Molecules/Onboarding/Additional',
  component: AdditionalInformation,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Additional information and questions component for onboarding, allowing users to provide any extra information or questions for their provider with a convenient checkbox for "no additional information" scenarios.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    onTextChange: { action: 'text-changed' },
    onCheckboxChange: { action: 'checkbox-changed' },
    onContinue: { action: 'continue-clicked' },
    onSignInClick: { action: 'sign-in-clicked' },
    className: { control: 'text' }
  }
}

export default meta
type Story = StoryObj<typeof AdditionalInformation>

export const Default: Story = {
  args: {
    onTextChange: (text: string) => {
      console.log('Text changed:', text)
    },
    onCheckboxChange: (checked: boolean) => {
      console.log('Checkbox changed:', checked)
    },
    onContinue: () => {
      console.log('Continue clicked')
    },
    onSignInClick: () => {
      console.log('Sign in clicked')
    }
  }
}