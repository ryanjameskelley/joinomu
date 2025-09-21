import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Badge } from '@joinomu/ui'

const meta = {
  title: 'Atomic/Atoms/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'destructive', 'outline'],
      description: 'The visual style variant of the badge'
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply to the badge'
    },
    children: {
      control: 'text',
      description: 'The content of the badge'
    },
  },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

// Default badge
export const Default: Story = {
  args: {
    children: 'Badge',
    variant: 'default',
  },
}

// Secondary badge
export const Secondary: Story = {
  args: {
    children: 'Secondary',
    variant: 'secondary',
  },
}

// Destructive badge
export const Destructive: Story = {
  args: {
    children: 'Destructive',
    variant: 'destructive',
  },
}

// Outline badge
export const Outline: Story = {
  args: {
    children: 'Outline',
    variant: 'outline',
  },
}

// Healthcare status badges
export const HealthcareStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">Active</Badge>
      <Badge variant="secondary">Scheduled</Badge>
      <Badge variant="destructive">Critical</Badge>
      <Badge variant="outline">Pending</Badge>
      <Badge className="bg-green-100 text-green-800">Stable</Badge>
      <Badge className="bg-yellow-100 text-yellow-800">Attention</Badge>
      <Badge className="bg-blue-100 text-blue-800">New Patient</Badge>
    </div>
  ),
}

// Patient priority badges
export const PatientPriority: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="destructive">High Priority</Badge>
      <Badge className="bg-orange-100 text-orange-800">Medium Priority</Badge>
      <Badge variant="secondary">Low Priority</Badge>
      <Badge variant="outline">Standard</Badge>
    </div>
  ),
}

// Medication status badges
export const MedicationStatus: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge className="bg-green-100 text-green-800">Active</Badge>
      <Badge variant="secondary">Discontinued</Badge>
      <Badge className="bg-yellow-100 text-yellow-800">Under Review</Badge>
      <Badge variant="destructive">Contraindicated</Badge>
    </div>
  ),
}

// Appointment type badges
export const AppointmentTypes: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">Consultation</Badge>
      <Badge className="bg-blue-100 text-blue-800">Follow-up</Badge>
      <Badge className="bg-purple-100 text-purple-800">Surgery</Badge>
      <Badge variant="secondary">Routine Check</Badge>
      <Badge variant="destructive">Emergency</Badge>
    </div>
  ),
}

// User role badges
export const UserRoles: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge className="bg-blue-100 text-blue-800">Patient</Badge>
      <Badge className="bg-green-100 text-green-800">Provider</Badge>
      <Badge className="bg-purple-100 text-purple-800">Admin</Badge>
      <Badge className="bg-orange-100 text-orange-800">Nurse</Badge>
      <Badge variant="secondary">Staff</Badge>
    </div>
  ),
}

// Insurance status badges
export const InsuranceStatus: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge className="bg-green-100 text-green-800">Verified</Badge>
      <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      <Badge variant="destructive">Expired</Badge>
      <Badge variant="outline">Not Provided</Badge>
    </div>
  ),
}

// Test result badges
export const TestResults: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge className="bg-green-100 text-green-800">Normal</Badge>
      <Badge className="bg-yellow-100 text-yellow-800">Borderline</Badge>
      <Badge variant="destructive">Abnormal</Badge>
      <Badge variant="secondary">Pending</Badge>
      <Badge variant="outline">Not Available</Badge>
    </div>
  ),
}