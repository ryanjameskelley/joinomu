import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { AdminSignupForm } from '@joinomu/ui'

const meta = {
  title: 'Atomic/Molecules/Forms/AdminSignupForm',
  component: AdminSignupForm,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    onSubmit: { action: 'submitted' },
    loading: { control: 'boolean' },
    error: { control: 'text' },
  },
} satisfies Meta<typeof AdminSignupForm>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    loading: false,
    error: '',
  },
}

export const Loading: Story = {
  args: {
    loading: true,
    error: '',
  },
}

export const WithError: Story = {
  args: {
    loading: false,
    error: 'Failed to create admin account. Please try again.',
  },
}

export const ValidationError: Story = {
  args: {
    loading: false,
    error: 'Password must be at least 6 characters',
  },
}