import type { Meta, StoryObj } from '@storybook/react'
import { PatientChecklist, type ChecklistItem } from './patient-checklist'
import { action } from '@storybook/addon-actions'

const meta: Meta<typeof PatientChecklist> = {
  title: 'Atomic/Molecules/PatientChecklist',
  component: PatientChecklist,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A patient onboarding checklist with timeline progress indicator. Items are disabled until the previous item is completed, following a sequential flow.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    items: {
      control: 'object',
      description: 'Array of checklist items with completion status',
    },
    onItemClick: {
      action: 'item-clicked',
      description: 'Callback when a checklist item is clicked',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Default checklist items
const defaultItems: ChecklistItem[] = [
  {
    id: 'plan',
    title: 'Select a plan',
    description: 'Choose the healthcare plan that fits your needs',
    completed: false,
  },
  {
    id: 'medication',
    title: 'Select medications', 
    description: "Select from the medications you're eligible for",
    completed: false,
  },
  {
    id: 'appointment',
    title: 'Schedule appointment',
    description: 'Book your first visit with a healthcare provider',
    completed: false,
  },
]

// Items with first step completed
const firstStepCompleted: ChecklistItem[] = [
  {
    id: 'plan',
    title: 'Select a plan',
    description: 'Choose the healthcare plan that fits your needs',
    completed: true,
  },
  {
    id: 'medication',
    title: 'Select medications',
    description: "Select from the medications you're eligible for", 
    completed: false,
  },
  {
    id: 'appointment',
    title: 'Schedule appointment',
    description: 'Book your first visit with a healthcare provider',
    completed: false,
  },
]

// Items with two steps completed
const twoStepsCompleted: ChecklistItem[] = [
  {
    id: 'plan',
    title: 'Select a plan',
    description: 'Choose the healthcare plan that fits your needs',
    completed: true,
  },
  {
    id: 'medication',
    title: 'Select medications',
    description: "Select from the medications you're eligible for",
    completed: true,
  },
  {
    id: 'appointment',
    title: 'Schedule appointment',
    description: 'Book your first visit with a healthcare provider',
    completed: false,
  },
]

// All items completed
const allCompleted: ChecklistItem[] = [
  {
    id: 'plan',
    title: 'Select a plan',
    description: 'Choose the healthcare plan that fits your needs',
    completed: true,
  },
  {
    id: 'medication',
    title: 'Select medications',
    description: "Select from the medications you're eligible for",
    completed: true,
  },
  {
    id: 'appointment',
    title: 'Schedule appointment',
    description: 'Book your first visit with a healthcare provider',
    completed: true,
  },
]

export const Default: Story = {
  args: {
    items: defaultItems,
    onItemClick: action('item-clicked'),
  },
}

export const FirstStepCompleted: Story = {
  args: {
    items: firstStepCompleted,
    onItemClick: action('item-clicked'),
  },
}

export const TwoStepsCompleted: Story = {
  args: {
    items: twoStepsCompleted,
    onItemClick: action('item-clicked'),
  },
}

export const AllCompleted: Story = {
  args: {
    items: allCompleted,
    onItemClick: action('item-clicked'),
  },
}

export const WithoutDescriptions: Story = {
  args: {
    items: [
      {
        id: 'plan',
        title: 'Select a plan',
        completed: true,
      },
      {
        id: 'medication',
        title: 'Select medications',
        completed: false,
      },
      {
        id: 'appointment',
        title: 'Schedule appointment',
        completed: false,
      },
    ],
    onItemClick: action('item-clicked'),
  },
}

export const Interactive: Story = {
  args: {
    items: defaultItems,
    onItemClick: action('item-clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive version where you can click on available items. Only the first item and completed items are clickable.',
      },
    },
  },
}