import type { Meta, StoryObj } from '@storybook/react'
import { Pricing } from './pricing'

const meta: Meta<typeof Pricing> = {
  title: 'Atomic/Organisms/Pricing',
  component: Pricing,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A floating pricing panel that covers the entire viewport with 24px margins from each edge, similar to the expanded patient information dialog but without close functionality or sidebar.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    open: { control: 'boolean' },
    onOpenChange: { action: 'openChange' },
    className: { control: 'text' }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    open: true,
    onOpenChange: () => console.log('Open change triggered')
  }
}