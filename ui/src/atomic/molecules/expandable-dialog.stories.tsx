import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { ExpandableDialog } from './expandable-dialog'
import { User } from 'lucide-react'

const meta: Meta<typeof ExpandableDialog> = {
  title: 'Atomic/Molecules/ExpandableDialog',
  component: ExpandableDialog,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'An expandable dialog component with sidebar navigation, based on the patient information dialog pattern. Features expandable/collapsible view, breadcrumb navigation, and customizable sidebar items.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    open: { control: 'boolean' },
    title: { control: 'text' },
    description: { control: 'text' },
    activeSection: { control: 'text' },
    onOpenChange: { action: 'openChange' },
    onSectionChange: { action: 'sectionChange' }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    open: true,
    title: "Expandable Dialog",
    description: "A dialog with expandable content and sidebar navigation",
    activeSection: "Information",
    sidebarItems: [
      {
        id: 'information',
        name: 'Information',
        icon: User
      }
    ]
  }
}