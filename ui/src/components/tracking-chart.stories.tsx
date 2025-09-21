import type { Meta, StoryObj } from '@storybook/react'
import { TrackingChart } from './tracking-chart'

const meta: Meta<typeof TrackingChart> = {
  title: 'Atomic/Organisms/Charts/Tracking Chart',
  component: TrackingChart,
  parameters: {
    docs: {
      description: {
        component: 'Interactive tracking chart with date range picker for visualizing visitor analytics data over time.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Chart title',
    },
    description: {
      control: 'text',
      description: 'Chart description',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
    selectedMetric: {
      control: 'select',
      options: ['weight', 'steps', 'sleep', 'calories', 'protein', 'sugar', 'water', 'heart-rate'],
      description: 'Initially selected metric',
    },
    affirmation: {
      control: 'text',
      description: 'Positive affirmation message',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Weight: Story = {
  args: {
    title: 'Weight',
    description: 'Daily weight tracking',
    selectedMetric: 'weight',
    affirmation: 'Your body is transforming with each healthy choice - trust the process and celebrate progress.',
  },
  parameters: {
    docs: {
      description: {
        story: 'Weight tracking chart showing daily weight measurements over time.',
      },
    },
  },
}

export const Steps: Story = {
  args: {
    title: 'Steps',
    description: 'Daily step count tracking',
    selectedMetric: 'steps',
    affirmation: 'Every step forward is a victory - you are building strength and endurance one stride at a time.',
  },
  parameters: {
    docs: {
      description: {
        story: 'Steps tracking chart for monitoring daily physical activity.',
      },
    },
  },
}

export const Sleep: Story = {
  args: {
    title: 'Sleep',
    description: 'Sleep quality and duration tracking',
    selectedMetric: 'sleep',
    affirmation: 'Quality rest is your foundation for success - prioritizing sleep shows you value your wellbeing.',
  },
  parameters: {
    docs: {
      description: {
        story: 'Sleep tracking chart for monitoring sleep patterns and quality.',
      },
    },
  },
}

export const Calories: Story = {
  args: {
    title: 'Calories',
    description: 'Daily calorie intake tracking',
    selectedMetric: 'calories',
    affirmation: 'Mindful eating fuels your body and spirit - you are making choices that honor your health.',
  },
  parameters: {
    docs: {
      description: {
        story: 'Calorie tracking chart for monitoring daily nutritional intake.',
      },
    },
  },
}

export const Protein: Story = {
  args: {
    title: 'Protein',
    description: 'Daily protein intake tracking',
    selectedMetric: 'protein',
    affirmation: 'Strong muscles, strong mind - you are building the foundation for a vibrant, energetic life.',
  },
  parameters: {
    docs: {
      description: {
        story: 'Protein tracking chart for monitoring daily protein consumption.',
      },
    },
  },
}

export const Sugar: Story = {
  args: {
    title: 'Sugar',
    description: 'Daily sugar intake tracking',
    selectedMetric: 'sugar',
    affirmation: 'Balance brings freedom - each mindful choice helps you feel more energized and in control.',
  },
  parameters: {
    docs: {
      description: {
        story: 'Sugar tracking chart for monitoring daily sugar consumption.',
      },
    },
  },
}

export const Water: Story = {
  args: {
    title: 'Water',
    description: 'Daily water intake tracking',
    selectedMetric: 'water',
    affirmation: 'Hydration is self-care in action - you are nourishing every cell and feeling the difference.',
  },
  parameters: {
    docs: {
      description: {
        story: 'Water tracking chart for monitoring daily hydration levels.',
      },
    },
  },
}

export const HeartRate: Story = {
  args: {
    title: 'Heart Rate',
    description: 'Average heart rate tracking',
    selectedMetric: 'heart-rate',
    affirmation: 'Your heart grows stronger with every beat - you are investing in a lifetime of vitality.',
  },
  parameters: {
    docs: {
      description: {
        story: 'Heart rate tracking chart for monitoring cardiovascular health.',
      },
    },
  },
}