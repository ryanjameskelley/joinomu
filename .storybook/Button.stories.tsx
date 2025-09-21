import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Container, ChevronRight, GitBranch } from 'lucide-react'
import { Button } from '@joinomu/ui'

const meta = {
  title: 'Atomic/Atoms/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

// Default example from claude.md
export const Default: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2 md:flex-row">
      <Button>Button</Button>
    </div>
  ),
}

// Examples from shadcn documentation
export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary',
  },
}

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Destructive',
  },
}

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline',
  },
}

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost',
  },
}

export const Link: Story = {
  args: {
    variant: 'link',
    children: 'Link',
  },
}

export const IconButton: Story = {
  args: {
    variant: 'secondary',
    size: 'icon',
    children: <Container />,
  },
}

export const WithIcon: Story = {
  args: {
    variant: 'outline',
    size: 'default',
    children: (
      <>
        <Container />
        Button
      </>
    ),
  },
}