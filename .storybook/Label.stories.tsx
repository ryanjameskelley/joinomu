import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Label, Input } from '@joinomu/ui'

const meta = {
  title: 'Atomic/Atoms/Label',
  component: Label,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    children: {
      control: 'text',
      description: 'The text content of the label'
    },
    htmlFor: {
      control: 'text',
      description: 'The id of the form element this label is associated with'
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes'
    },
  },
} satisfies Meta<typeof Label>

export default meta
type Story = StoryObj<typeof meta>

// Basic label
export const Default: Story = {
  args: {
    children: 'Email address',
    htmlFor: 'email',
  },
}

// Label with required indicator
export const Required: Story = {
  render: () => (
    <Label htmlFor="email">
      Email address <span className="text-destructive">*</span>
    </Label>
  ),
}

// Label with input field
export const WithInput: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="email">Email</Label>
      <Input
        type="email"
        id="email"
        placeholder="Email"
      />
    </div>
  ),
}

// Label with checkbox (this is the one that was missing)
export const WithCheckbox: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <input
        type="checkbox"
        id="terms"
        className="peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      />
      <Label 
        htmlFor="terms"
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        Accept terms and conditions
      </Label>
    </div>
  ),
}

// Healthcare context labels
export const PatientInfo: Story = {
  render: () => (
    <div className="space-y-3">
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="patient-id">Patient ID</Label>
        <Input
          type="text"
          id="patient-id"
          placeholder="Enter patient ID"
        />
      </div>
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="condition">Medical Condition</Label>
        <Input
          type="text"
          id="condition"
          placeholder="Enter diagnosis"
        />
      </div>
    </div>
  ),
}

// Disabled label
export const Disabled: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="disabled" className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        Disabled Field
      </Label>
      <Input
        type="text"
        id="disabled"
        placeholder="This field is disabled"
        disabled
      />
    </div>
  ),
}

// Label with helper text
export const WithHelper: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="password">Password</Label>
      <Input
        type="password"
        id="password"
        placeholder="Enter password"
      />
      <p className="text-xs text-muted-foreground">
        Must be at least 8 characters with numbers and special characters
      </p>
    </div>
  ),
}