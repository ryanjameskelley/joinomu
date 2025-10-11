import type { Meta, StoryObj } from '@storybook/react'
import { DiagnosedConditionsScreening, familyMedicalHistoryConditions, familyHealthOptions } from './diagnosed-conditions'

const meta: Meta<typeof DiagnosedConditionsScreening> = {
  title: 'Atomic/Molecules/Onboarding/DiagnosedConditions',
  component: DiagnosedConditionsScreening,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Diagnosed conditions screening for onboarding, allowing users to indicate which medical conditions they have been diagnosed with to help providers understand their health history.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    onConditionsSelect: { action: 'conditions-selected' },
    onContinue: { action: 'continue-clicked' },
    onSignInClick: { action: 'sign-in-clicked' },
    className: { control: 'text' }
  }
}

export default meta
type Story = StoryObj<typeof DiagnosedConditionsScreening>

export const DiagnosedConditions: Story = {
  args: {
    onConditionsSelect: (conditions: string[]) => {
      console.log('Selected conditions:', conditions)
    },
    onContinue: () => {
      console.log('Continue clicked')
    },
    onSignInClick: () => {
      console.log('Sign in clicked')
    }
  }
}

export const ChronicDiseases: Story = {
  args: {
    onConditionsSelect: (conditions: string[]) => {
      console.log('Selected chronic diseases:', conditions)
    },
    onContinue: () => {
      console.log('Continue clicked')
    },
    onSignInClick: () => {
      console.log('Sign in clicked')
    },
    progress: 89,
    title: "Do you have any medical conditions or chronic diseases?",
    description: "This helps your provider get a complete understanding of your medical history. Include any conditions impacting your blood pressure, heart, kidneys (including kidney stones) or liver, and any diseases such as diabetes, high cholesterol, stroke, cancer, or gout."
  },
  parameters: {
    docs: {
      description: {
        story: 'Chronic diseases screening with custom title and detailed description for comprehensive medical history.'
      }
    }
  }
}

export const FamilyMedicalHistory: Story = {
  args: {
    onConditionsSelect: (conditions: string[]) => {
      console.log('Selected family medical history conditions:', conditions)
    },
    onContinue: () => {
      console.log('Continue clicked')
    },
    onSignInClick: () => {
      console.log('Sign in clicked')
    },
    progress: 90,
    title: "Have you or a family member ever been diagnosed with any of the following conditions?",
    description: "Some conditions can determine which treatments are right for you",
    conditions: familyMedicalHistoryConditions
  },
  parameters: {
    docs: {
      description: {
        story: 'Family medical history screening to identify genetic or hereditary conditions that may affect treatment options.'
      }
    }
  }
}

export const FamilyHealth: Story = {
  args: {
    onConditionsSelect: (conditions: string[]) => {
      console.log('Selected family health option:', conditions)
    },
    onContinue: () => {
      console.log('Continue clicked')
    },
    onSignInClick: () => {
      console.log('Sign in clicked')
    },
    progress: 91,
    title: "Has a close family member under the age of 40 passed away unexpectedly?",
    description: "Close family members can be a parent, sibling or child. We ask so your provider can determine the appropriate treatment for you.",
    conditions: familyHealthOptions
  },
  parameters: {
    docs: {
      description: {
        story: 'Family health screening for unexpected deaths in close family members under 40 to assess genetic risk factors.'
      }
    }
  }
}