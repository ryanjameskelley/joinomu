import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './button'
import { Sonner, showToast } from './toast'
import { Toaster } from 'sonner'

const meta = {
  title: 'Atomic/Molecules/Sonner',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div>
        <Story />
        <Toaster 
          position="bottom-right"
          expand={true}
          visibleToasts={3}
          closeButton={false}
          theme="light"
          icons={false}
        />
      </div>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Success: Story = {
  args: {
    children: 'Show Success Toast',
    variant: 'default',
  },
  render: (args) => (
    <Button
      {...args}
      onClick={() =>
        showToast({
          title: 'Event has been created',
          description: 'Sunday, December 03, 2023 at 9:00 AM',
          variant: 'success',
          action: {
            label: 'Undo',
            onClick: () => console.log('Undo'),
          },
        })
      }
    />
  ),
}

export const Error: Story = {
  args: {
    children: 'Show Error Toast',
    variant: 'destructive',
  },
  render: (args) => (
    <Button
      {...args}
      onClick={() =>
        showToast({
          title: 'Something went wrong',
          description: 'Your request could not be processed',
          variant: 'error',
        })
      }
    />
  ),
}

export const Warning: Story = {
  args: {
    children: 'Show Warning Toast',
    variant: 'outline',
  },
  render: (args) => (
    <Button
      {...args}
      onClick={() =>
        showToast({
          title: 'Warning',
          description: 'Please review your information',
          variant: 'warning',
        })
      }
    />
  ),
}

export const Info: Story = {
  args: {
    children: 'Show Info Toast',
    variant: 'secondary',
  },
  render: (args) => (
    <Button
      {...args}
      onClick={() =>
        showToast({
          title: 'Information',
          description: 'This is an informational message',
          variant: 'info',
        })
      }
    />
  ),
}

export const MedicationSaved: Story = {
  args: {
    children: 'Medication Saved',
    variant: 'default',
  },
  render: (args) => (
    <Button
      {...args}
      onClick={() => Sonner.saved('Semaglutide')}
    />
  ),
}

export const MedicationError: Story = {
  args: {
    children: 'Medication Error',
    variant: 'destructive',
  },
  render: (args) => (
    <Button
      {...args}
      onClick={() => Sonner.error('Semaglutide', 'Database connection failed')}
    />
  ),
}

export const MedicationSaving: Story = {
  args: {
    children: 'Medication Saving',
    variant: 'outline',
  },
  render: (args) => (
    <Button
      {...args}
      onClick={() => Sonner.saving('Semaglutide')}
    />
  ),
}

export const CopiedReference: Story = {
  args: {
    children: 'Copy Reference',
    variant: 'secondary',
  },
  render: (args) => (
    <Button
      {...args}
      onClick={() => Sonner.copied('REF-B99EDA3A')}
    />
  ),
}