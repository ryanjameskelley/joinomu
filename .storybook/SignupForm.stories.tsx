import type { Meta, StoryObj } from '@storybook/react'
import * as React from 'react'
import { SignupForm } from '@joinomu/ui'

const meta = {
  title: 'Atomic/Molecules/Forms/SignupForm',
  component: SignupForm,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SignupForm>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <SignupForm 
      className="w-full max-w-md" 
      onSubmit={(email, password, fullName) => {
        console.log('Signup attempted:', { email, password: '***', fullName })
      }}
    />
  ),
}

export const Loading: Story = {
  render: () => (
    <SignupForm 
      className="w-full max-w-md" 
      loading={true}
      onSubmit={(email, password, fullName) => {
        console.log('Signup attempted:', { email, password: '***', fullName })
      }}
    />
  ),
}

export const WithError: Story = {
  render: () => (
    <SignupForm 
      className="w-full max-w-md" 
      error="Email address is already registered"
      onSubmit={(email, password, fullName) => {
        console.log('Signup attempted:', { email, password: '***', fullName })
      }}
    />
  ),
}

export const PasswordMismatch: Story = {
  render: () => {
    const [error, setError] = React.useState('')
    
    return (
      <SignupForm 
        className="w-full max-w-md" 
        error={error}
        onSubmit={(email, password, fullName) => {
          setError('This is an example of form validation error')
        }}
      />
    )
  },
}