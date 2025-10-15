import type { Meta, StoryObj } from '@storybook/react'
import { Switch } from './switch'

const meta: Meta<typeof Switch> = {
  title: 'Atomic/Atoms/Switch',
  component: Switch,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A switch component built on Radix UI primitives with optional label and description.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    checked: { control: 'boolean' },
    defaultChecked: { control: 'boolean' },
    disabled: { control: 'boolean' },
    label: { control: 'text' },
    description: { control: 'text' },
    onCheckedChange: { action: 'checkedChange' }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    label: 'Airplane Mode'
  }
}

export const WithDescription: Story = {
  args: {
    label: 'Marketing emails',
    description: 'Receive emails about new products, features, and more.'
  }
}

export const Checked: Story = {
  args: {
    label: 'Notifications',
    defaultChecked: true
  }
}

export const Disabled: Story = {
  args: {
    label: 'Disabled switch',
    disabled: true
  }
}

export const DisabledChecked: Story = {
  args: {
    label: 'Disabled checked',
    defaultChecked: true,
    disabled: true
  }
}