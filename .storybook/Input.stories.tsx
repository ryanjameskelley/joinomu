import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Button, Input, Label } from '@joinomu/ui'

const meta = {
  title: 'Atomic/Atoms/Input',
  component: Input,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

// Default example from shadcn docs
export const Default: Story = {
  args: {
    type: 'email',
    placeholder: 'Email',
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    type: 'email',
    placeholder: 'Email',
  },
}

export const WithLabel: Story = {
  render: () => (
    <div className="p-8">
      <div className="w-full max-w-sm">
        <Label htmlFor="email" className="block mb-2">Email</Label>
        <Input type="email" id="email" placeholder="Email" />
      </div>
    </div>
  ),
}

export const FileInput: Story = {
  render: () => (
    <div className="p-8">
      <div className="w-full max-w-sm">
        <Label htmlFor="picture" className="block mb-2">Picture</Label>
        <Input id="picture" type="file" />
      </div>
    </div>
  ),
}

export const WithButton: Story = {
  render: () => (
    <div className="flex w-full max-w-sm items-center gap-2">
      <Input type="email" placeholder="Email" />
      <Button type="submit" variant="outline">
        Subscribe
      </Button>
    </div>
  ),
}