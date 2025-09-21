import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Avatar, AvatarFallback, AvatarImage } from '@joinomu/ui'

const meta = {
  title: 'Atomic/Atoms/Avatar',
  component: Avatar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    className: { 
      control: 'text',
      description: 'Additional CSS classes to apply to the avatar'
    },
  },
} satisfies Meta<typeof Avatar>

export default meta
type Story = StoryObj<typeof meta>

// Basic avatar with image
export const Default: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
  ),
}

// Avatar with fallback (no image)
export const Name: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="" alt="No image" />
      <AvatarFallback>RK</AvatarFallback>
    </Avatar>
  ),
}

// Large avatar
export const Large: Story = {
  render: () => (
    <Avatar className="h-16 w-16">
      <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
      <AvatarFallback className="text-lg">CN</AvatarFallback>
    </Avatar>
  ),
}

// Small avatar
export const Small: Story = {
  render: () => (
    <Avatar className="h-8 w-8">
      <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
      <AvatarFallback className="text-xs">CN</AvatarFallback>
    </Avatar>
  ),
}

// Square avatar
export const Square: Story = {
  render: () => (
    <Avatar className="rounded-lg">
      <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
  ),
}

// Healthcare context examples
export const PatientAvatar: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="" alt="Patient" />
      <AvatarFallback className="bg-blue-100 text-blue-600">PT</AvatarFallback>
    </Avatar>
  ),
}

export const AdminAvatar: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="" alt="Admin" />
      <AvatarFallback className="bg-purple-100 text-purple-600">AD</AvatarFallback>
    </Avatar>
  ),
}

export const ProviderAvatar: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="" alt="Provider" />
      <AvatarFallback className="bg-green-100 text-green-600">DR</AvatarFallback>
    </Avatar>
  ),
}

// Avatar group for team display
export const AvatarGroup: Story = {
  render: () => (
    <div className="flex -space-x-2">
      <Avatar className="border-2 border-background">
        <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
      <Avatar className="border-2 border-background">
        <AvatarImage src="" alt="Patient" />
        <AvatarFallback className="bg-blue-100 text-blue-600">PT</AvatarFallback>
      </Avatar>
      <Avatar className="border-2 border-background">
        <AvatarImage src="" alt="Provider" />
        <AvatarFallback className="bg-green-100 text-green-600">DR</AvatarFallback>
      </Avatar>
      <Avatar className="border-2 border-background">
        <AvatarImage src="" alt="More" />
        <AvatarFallback className="bg-muted text-muted-foreground">+2</AvatarFallback>
      </Avatar>
    </div>
  ),
}

// Avatar sizes demonstration
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <div className="text-center">
        <Avatar className="h-6 w-6">
          <AvatarImage src="https://github.com/shadcn.png" alt="XS" />
          <AvatarFallback className="text-xs">XS</AvatarFallback>
        </Avatar>
        <p className="text-xs mt-1">XS</p>
      </div>
      <div className="text-center">
        <Avatar className="h-8 w-8">
          <AvatarImage src="https://github.com/shadcn.png" alt="SM" />
          <AvatarFallback className="text-xs">SM</AvatarFallback>
        </Avatar>
        <p className="text-xs mt-1">Small</p>
      </div>
      <div className="text-center">
        <Avatar>
          <AvatarImage src="https://github.com/shadcn.png" alt="MD" />
          <AvatarFallback>MD</AvatarFallback>
        </Avatar>
        <p className="text-xs mt-1">Default</p>
      </div>
      <div className="text-center">
        <Avatar className="h-12 w-12">
          <AvatarImage src="https://github.com/shadcn.png" alt="LG" />
          <AvatarFallback>LG</AvatarFallback>
        </Avatar>
        <p className="text-xs mt-1">Large</p>
      </div>
      <div className="text-center">
        <Avatar className="h-16 w-16">
          <AvatarImage src="https://github.com/shadcn.png" alt="XL" />
          <AvatarFallback className="text-lg">XL</AvatarFallback>
        </Avatar>
        <p className="text-xs mt-1">XL</p>
      </div>
    </div>
  ),
}

// Interactive avatar with status indicator
export const WithStatus: Story = {
  render: () => (
    <div className="relative">
      <Avatar>
        <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
      <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background"></div>
    </div>
  ),
}