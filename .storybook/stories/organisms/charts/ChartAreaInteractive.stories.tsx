import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { ChartAreaInteractive } from '@joinomu/ui/components/chart-area-interactive'

const meta: Meta<typeof ChartAreaInteractive> = {
  title: 'Atomic/Organisms/Charts/Area Chart Interactive',
  component: ChartAreaInteractive,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'An interactive area chart component with time range selection for displaying data trends over time. Features gradient fills, hover tooltips, and responsive design.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    // This component doesn't accept props, so no argTypes needed
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Default story showing the interactive area chart
export const Default: Story = {
  render: () => <ChartAreaInteractive />,
  parameters: {
    docs: {
      description: {
        story: 'The default interactive area chart showing visitor data with desktop and mobile metrics. Users can filter by different time ranges (7 days, 30 days, 3 months).',
      },
    },
  },
}

// Container story showing the chart in a constrained width
export const InContainer: Story = {
  render: () => (
    <div className="w-[800px] h-[500px]">
      <ChartAreaInteractive />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Area chart displayed within a constrained container to demonstrate responsive behavior.',
      },
    },
  },
}

// Full width story
export const FullWidth: Story = {
  render: () => (
    <div className="w-full max-w-4xl">
      <ChartAreaInteractive />
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'Area chart displayed at full width to show how it scales across different screen sizes.',
      },
    },
  },
}

// Compact version story
export const Compact: Story = {
  render: () => (
    <div className="w-[600px] h-[350px]">
      <ChartAreaInteractive />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Compact version of the area chart suitable for dashboard widgets and smaller display areas.',
      },
    },
  },
}