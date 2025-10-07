import type { Meta, StoryObj } from '@storybook/react'
import { MetricsTracking } from '@joinomu/ui'

const meta: Meta<typeof MetricsTracking> = {
  title: 'Atomic/Organisms/Metrics Tracking/Metrics Tracking',
  component: MetricsTracking,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
A comprehensive metrics tracking component that provides input forms for various health metrics.

## Features

- **8 Health Metrics**: Weight, Steps, Sleep, Calories, Protein, Sugar, Water, and Average Heart Rate
- **Responsive Design**: Desktop sidebar navigation with mobile dropdown selection
- **Interactive Forms**: Specific input fields for each metric type with appropriate units
- **Save Functionality**: Save Metrics button available in both desktop sidebar and mobile view
- **Clean Design**: CircleDashed icons throughout with no colored indicators

## Mobile Behavior

On mobile devices, the sidebar is hidden and replaced with a borderless dropdown selector in the header, allowing users to switch between different metrics while maintaining full access to the input forms.

## Desktop Behavior

Desktop view features a persistent sidebar with CircleDashed icons and a Save Metrics button at the bottom of the sidebar.
        `,
      },
    },
  },
  argTypes: {
    defaultOpen: {
      control: 'boolean',
      description: 'Whether the dialog opens by default',
      defaultValue: true,
    },
    selectedMetric: {
      control: 'select',
      options: [
        'Weight',
        'Steps', 
        'Sleep',
        'Calories',
        'Protein',
        'Sugar',
        'Water',
        'Average Heart Rate',
      ],
      description: 'The initially selected metric to display',
      defaultValue: 'Weight',
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Weight: Story = {
  args: {
    defaultOpen: true,
    selectedMetric: 'Weight',
  },
  parameters: {
    docs: {
      description: {
        story: 'Weight tracking with number input and unit selector (lbs/kg).',
      },
    },
  },
}

export const Steps: Story = {
  args: {
    defaultOpen: true,
    selectedMetric: 'Steps',
  },
  parameters: {
    docs: {
      description: {
        story: 'Daily step count tracking with number input.',
      },
    },
  },
}

export const Sleep: Story = {
  args: {
    defaultOpen: true,
    selectedMetric: 'Sleep',
  },
  parameters: {
    docs: {
      description: {
        story: 'Sleep duration tracking with hours input.',
      },
    },
  },
}

export const Calories: Story = {
  args: {
    defaultOpen: true,
    selectedMetric: 'Calories',
  },
  parameters: {
    docs: {
      description: {
        story: 'Calorie intake tracking with number input.',
      },
    },
  },
}

export const Protein: Story = {
  args: {
    defaultOpen: true,
    selectedMetric: 'Protein',
  },
  parameters: {
    docs: {
      description: {
        story: 'Protein intake tracking with grams input.',
      },
    },
  },
}

export const Sugar: Story = {
  args: {
    defaultOpen: true,
    selectedMetric: 'Sugar',
  },
  parameters: {
    docs: {
      description: {
        story: 'Sugar intake tracking with grams input.',
      },
    },
  },
}

export const Water: Story = {
  args: {
    defaultOpen: true,
    selectedMetric: 'Water',
  },
  parameters: {
    docs: {
      description: {
        story: 'Water intake tracking with fluid ounces input.',
      },
    },
  },
}

export const AverageHeartRate: Story = {
  args: {
    defaultOpen: true,
    selectedMetric: 'Average Heart Rate',
  },
  parameters: {
    docs: {
      description: {
        story: 'Average heart rate tracking with BPM input.',
      },
    },
  },
}