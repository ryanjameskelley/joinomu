import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { AlertCircle, Terminal, CircleCheck, Popcorn, BarChartBig, BadgeCheck } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle, Button, Badge } from '@joinomu/ui'

const meta = {
  title: 'Atomic/Atoms/Alert',
  component: Alert,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Alert>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Alert>
      <Popcorn className="h-4 w-4" />
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>
        You can add components to your app using the cli.
      </AlertDescription>
    </Alert>
  ),
}

export const Destructive: Story = {
  render: () => (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        Your session has expired. Please log in again.
      </AlertDescription>
    </Alert>
  ),
}

export const TitleOnly: Story = {
  render: () => (
    <Alert>
      <Terminal className="h-4 w-4" />
      <AlertTitle>System maintenance scheduled</AlertTitle>
    </Alert>
  ),
}

export const DescriptionOnly: Story = {
  render: () => (
    <Alert className="[&>div:last-child]:text-foreground">
      <Popcorn className="h-4 w-4" />
      <AlertDescription>
        This is a simple alert with only a description.
      </AlertDescription>
    </Alert>
  ),
}

export const WithoutIcon: Story = {
  render: () => (
    <Alert>
      <AlertTitle>No icon alert</AlertTitle>
      <AlertDescription>
        This alert doesn't have an icon.
      </AlertDescription>
    </Alert>
  ),
}

export const MedicationTrackingItem: Story = {
  render: () => (
    <Alert className="[&>div:last-child]:text-foreground flex items-center justify-between">
      <div className="flex items-start gap-3">
        <BadgeCheck className="h-4 w-4 mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <AlertTitle className="mb-0">Liraglutide (Saxenda)</AlertTitle>
            <Badge variant="secondary" className="text-xs">3.0 mg</Badge>
          </div>
          <AlertDescription className="text-xs text-muted-foreground">
            Wednesday 6:00 PM
          </AlertDescription>
        </div>
      </div>
      <Button variant="ghost" size="sm" className="ml-4 shrink-0">
        Information
      </Button>
    </Alert>
  ),
}

export const Track: Story = {
  render: () => (
    <Alert className="[&>div:last-child]:text-foreground flex items-center justify-between">
      <div className="flex items-start gap-3">
        <BarChartBig className="h-4 w-4 mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <AlertTitle className="mb-0">Semaglutide (Ozempic)</AlertTitle>
            <Badge variant="secondary" className="text-xs">0.5 mg</Badge>
          </div>
          <AlertDescription className="text-xs text-muted-foreground">
            Take Monday 8:00 AM
          </AlertDescription>
        </div>
      </div>
      <Button variant="outline" size="sm" className="ml-4 shrink-0">
        Take Shot
      </Button>
    </Alert>
  ),
}