import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Progress } from '@joinomu/ui'

const meta = {
  title: 'Atomic/Atoms/Progress',
  component: Progress,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: 'The progress value'
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes'
    },
  },
} satisfies Meta<typeof Progress>

export default meta
type Story = StoryObj<typeof meta>

// Default progress
export const Default: Story = {
  args: {
    value: 60,
    className: 'w-[60%]',
  },
}

// Empty progress
export const Empty: Story = {
  args: {
    value: 0,
    className: 'w-[60%]',
  },
}

// Full progress
export const Full: Story = {
  args: {
    value: 100,
    className: 'w-[60%]',
  },
}

// Animated progress demo
export const Animated: Story = {
  render: () => {
    const [progress, setProgress] = React.useState(13)

    React.useEffect(() => {
      const timer = setTimeout(() => setProgress(66), 500)
      return () => clearTimeout(timer)
    }, [])

    return <Progress value={progress} className="w-[60%]" />
  },
}