import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { AccountDialog } from './account-dialog'

const meta: Meta<typeof AccountDialog> = {
  title: 'Atomic/Organisms/AccountDialog',
  component: AccountDialog,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A comprehensive account management dialog with 4 sections: Account, Health Profile, Billing and Plans, and Preferences. Built using the expandable dialog pattern with sidebar navigation and always displayed in fullscreen mode.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    open: { control: 'boolean' },
    activeSection: { control: 'text' },
    onOpenChange: { action: 'openChange' },
    onSectionChange: { action: 'sectionChange' }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Account: Story = {
  args: {
    open: true,
    activeSection: 'Account'
  }
}

export const HealthProfile: Story = {
  args: {
    open: true,
    activeSection: 'Health Profile'
  }
}


export const BillingAndPlans: Story = {
  args: {
    open: true,
    activeSection: 'Billing and Plans'
  }
}

export const Preferences: Story = {
  args: {
    open: true,
    activeSection: 'Preferences'
  }
}

export const EditMembership: Story = {
  args: {
    open: true,
    activeSection: 'Edit Membership'
  }
}

export const AddShippingAddress: Story = {
  args: {
    open: true,
    activeSection: 'Add Shipping Address'
  }
}