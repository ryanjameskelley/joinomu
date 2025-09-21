import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { AdminLoginForm } from '@joinomu/ui'

const meta = {
  title: 'Atomic/Molecules/Forms/AdminLoginForm',
  component: AdminLoginForm,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    onSubmit: { action: 'submitted' },
    loading: { control: 'boolean' },
    error: { control: 'text' },
  },
} satisfies Meta<typeof AdminLoginForm>

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
    error: 'Invalid email or password. Please try again.',
  },
}

export const AccessDeniedError: Story = {
  args: {
    loading: false,
    error: 'Access denied. Admin privileges required.',
  },
}

export const AccountInactiveError: Story = {
  args: {
    loading: false,
    error: 'Admin account is not active. Please contact your administrator.',
  },
}