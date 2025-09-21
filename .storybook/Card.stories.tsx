import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { LoginForm } from '@joinomu/ui'

const meta = {
  title: 'Atomic/Molecules/Card',
  component: LoginForm,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof LoginForm>

export default meta
type Story = StoryObj<typeof meta>

export const Login: Story = {
  render: () => <LoginForm className="w-full max-w-md" />,
}