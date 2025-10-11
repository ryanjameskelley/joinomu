import type { Meta, StoryObj } from '@storybook/react'
import { MedicationHistoryScreening, yesNoOptions, alcoholFrequencyOptions, recreationalDrugOptions, heartRateOptions, gastrointestinalSymptomsOptions, sideEffectsOptions } from './medication-history'

const meta: Meta<typeof MedicationHistoryScreening> = {
  title: 'Atomic/Molecules/Onboarding/MedicationHistory',
  component: MedicationHistoryScreening,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Medication history screening for onboarding, allowing users to indicate their GLP-1 medication experience to help providers understand their treatment history.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    onMedicationHistorySelect: { action: 'medication-history-selected' },
    onContinue: { action: 'continue-clicked' },
    onSignInClick: { action: 'sign-in-clicked' },
    className: { control: 'text' }
  }
}

export default meta
type Story = StoryObj<typeof MedicationHistoryScreening>

export const MedicationHistory: Story = {
  args: {
    onMedicationHistorySelect: (option: string) => {
      console.log('Selected medication history option:', option)
    },
    onContinue: () => {
      console.log('Continue clicked')
    },
    onSignInClick: () => {
      console.log('Sign in clicked')
    }
  }
}

export const Procedures: Story = {
  args: {
    onMedicationHistorySelect: (option: string) => {
      console.log('Selected procedures option:', option)
    },
    onContinue: () => {
      console.log('Continue clicked')
    },
    onSignInClick: () => {
      console.log('Sign in clicked')
    },
    progress: 86,
    title: "Have you had any surgeries or medical procedures?",
    description: "This helps your caregiver get a complete understanding of your medical history so they can recommend the best treatment for you.",
    options: yesNoOptions
  },
  parameters: {
    docs: {
      description: {
        story: 'Medical procedures screening to assess surgical history that may impact treatment recommendations.'
      }
    }
  }
}

export const Supplements: Story = {
  args: {
    onMedicationHistorySelect: (option: string) => {
      console.log('Selected supplements option:', option)
    },
    onContinue: () => {
      console.log('Continue clicked')
    },
    onSignInClick: () => {
      console.log('Sign in clicked')
    },
    progress: 87,
    title: "Do you currently take any medications or supplements?",
    options: yesNoOptions
  },
  parameters: {
    docs: {
      description: {
        story: 'Current medications and supplements screening to understand potential drug interactions and treatment considerations.'
      }
    }
  }
}

export const Allergies: Story = {
  args: {
    onMedicationHistorySelect: (option: string) => {
      console.log('Selected allergies option:', option)
    },
    onContinue: () => {
      console.log('Continue clicked')
    },
    onSignInClick: () => {
      console.log('Sign in clicked')
    },
    progress: 88,
    title: "Do you have any allergies?",
    description: "Include any allergies to food, dyes, prescriptions or over the counter medications, herbs, vitamins, supplements, or anything else.",
    options: yesNoOptions
  },
  parameters: {
    docs: {
      description: {
        story: 'Comprehensive allergy screening to identify potential contraindications and ensure safe treatment recommendations.'
      }
    }
  }
}

export const Drinking: Story = {
  args: {
    onMedicationHistorySelect: (option: string) => {
      console.log('Selected drinking frequency option:', option)
    },
    onContinue: () => {
      console.log('Continue clicked')
    },
    onSignInClick: () => {
      console.log('Sign in clicked')
    },
    progress: 89,
    title: "How often do you consume 5 or more alcoholic drinks in one occasion?",
    description: "Sometimes alcohol can impact effectiveness of certain medications and it's important for your provider to know to give you the best guidance.",
    options: alcoholFrequencyOptions
  },
  parameters: {
    docs: {
      description: {
        story: 'Alcohol consumption frequency screening to assess potential medication interactions and treatment effectiveness.'
      }
    }
  }
}

export const Drugs: Story = {
  args: {
    onMedicationHistorySelect: (options: string[]) => {
      console.log('Selected recreational drug options:', options)
    },
    onContinue: () => {
      console.log('Continue clicked')
    },
    onSignInClick: () => {
      console.log('Sign in clicked')
    },
    progress: 90,
    title: "Have you taken any of the following recreational drugs in the past 6 months?",
    description: "We ask so your provider can have a complete understanding of your current health and determine which treatment might be right for you.",
    options: recreationalDrugOptions,
    multiSelect: true
  },
  parameters: {
    docs: {
      description: {
        story: 'Recreational drug usage screening with multi-select options to assess potential interactions and safety considerations for treatment.'
      }
    }
  }
}

export const Smoking: Story = {
  args: {
    onMedicationHistorySelect: (option: string) => {
      console.log('Selected smoking option:', option)
    },
    onContinue: () => {
      console.log('Continue clicked')
    },
    onSignInClick: () => {
      console.log('Sign in clicked')
    },
    progress: 91,
    title: "Are you currently using any nicotine replacement products to help you stop smoking?",
    description: "We ask to make sure there aren't any interactions with potential treatments.",
    options: yesNoOptions
  },
  parameters: {
    docs: {
      description: {
        story: 'Nicotine replacement product usage screening to assess potential interactions with treatment medications.'
      }
    }
  }
}

export const HeartRate: Story = {
  args: {
    onMedicationHistorySelect: (option: string) => {
      console.log('Selected heart rate option:', option)
    },
    onContinue: () => {
      console.log('Continue clicked')
    },
    onSignInClick: () => {
      console.log('Sign in clicked')
    },
    progress: 92,
    title: "What is your average resting heart rate?",
    description: "You can find your average resting heart rate manually or by owning a wearable like an Apple Watch or an Oura Ring.",
    options: heartRateOptions
  },
  parameters: {
    docs: {
      description: {
        story: 'Resting heart rate screening to assess cardiovascular health and determine appropriate treatment considerations.'
      }
    }
  }
}

export const Gastrointestinal: Story = {
  args: {
    onMedicationHistorySelect: (options: string[]) => {
      console.log('Selected gastrointestinal symptoms:', options)
    },
    onContinue: () => {
      console.log('Continue clicked')
    },
    onSignInClick: () => {
      console.log('Sign in clicked')
    },
    progress: 93,
    title: "Do you ever experience any of these gastrointestinal symptoms?",
    description: "A licensed provider may be able to help you manage side effects with a personalized treatment plan.",
    options: gastrointestinalSymptomsOptions,
    multiSelect: true
  },
  parameters: {
    docs: {
      description: {
        story: 'Gastrointestinal symptoms screening with multi-select options to assess digestive health and potential side effects management.'
      }
    }
  }
}

export const SideEffects: Story = {
  args: {
    onMedicationHistorySelect: (options: string[]) => {
      console.log('Selected side effects:', options)
    },
    onContinue: () => {
      console.log('Continue clicked')
    },
    onSignInClick: () => {
      console.log('Sign in clicked')
    },
    progress: 94,
    title: "Do you tend to experience any of these side effects when you start new medications or supplements?",
    description: "A licensed provider can help you manage side effects with a personalized treatment plan. Select all that apply to you.",
    options: sideEffectsOptions,
    multiSelect: true
  },
  parameters: {
    docs: {
      description: {
        story: 'Side effects screening with multi-select options to assess common medication reactions and enable personalized treatment planning.'
      }
    }
  }
}