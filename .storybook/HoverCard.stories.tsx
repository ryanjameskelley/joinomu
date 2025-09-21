import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { HoverCard, HoverCardTrigger, HoverCardContent, Avatar, AvatarImage, AvatarFallback, Button } from '@joinomu/ui'

const meta = {
  title: 'Atomic/Atoms/HoverCard',
  component: HoverCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    openDelay: {
      control: 'number',
      description: 'The duration in milliseconds from when the trigger is hovered until the hover card opens'
    },
    closeDelay: {
      control: 'number', 
      description: 'The duration in milliseconds from when the trigger is no longer hovered until the hover card closes'
    },
  },
} satisfies Meta<typeof HoverCard>

export default meta
type Story = StoryObj<typeof meta>

// Basic hover card
export const Default: Story = {
  render: () => (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button variant="link">@joinomu</Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="flex justify-between space-x-4">
          <Avatar>
            <AvatarImage src="https://github.com/vercel.png" />
            <AvatarFallback>JO</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">@joinomu</h4>
            <p className="text-sm">
              Healthcare platform for patient management and provider coordination.
            </p>
            <div className="flex items-center pt-2">
              <span className="text-xs text-muted-foreground">
                Joined December 2021
              </span>
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  ),
}

// Patient profile hover card
export const PatientProfile: Story = {
  render: () => (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button variant="link">John Smith</Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="flex justify-between space-x-4">
          <Avatar>
            <AvatarImage src="" />
            <AvatarFallback className="bg-blue-100 text-blue-600">JS</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">John Smith</h4>
            <p className="text-sm text-muted-foreground">Patient ID: PT-001</p>
            <p className="text-sm">
              Age: 45 • Blood Type: O+
            </p>
            <div className="flex items-center pt-2">
              <span className="text-xs text-muted-foreground">
                Last visit: 2 days ago
              </span>
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  ),
}

// Provider profile hover card
export const ProviderProfile: Story = {
  render: () => (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button variant="link">Dr. Sarah Johnson</Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="flex justify-between space-x-4">
          <Avatar>
            <AvatarImage src="" />
            <AvatarFallback className="bg-green-100 text-green-600">SJ</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">Dr. Sarah Johnson</h4>
            <p className="text-sm text-muted-foreground">Cardiologist</p>
            <p className="text-sm">
              15+ years experience • Board certified
            </p>
            <div className="flex items-center pt-2">
              <span className="text-xs text-muted-foreground">
                Available today
              </span>
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  ),
}

// Medication hover card
export const MedicationInfo: Story = {
  render: () => (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button variant="link">Lisinopril 10mg</Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Lisinopril 10mg</h4>
          <p className="text-sm text-muted-foreground">ACE Inhibitor</p>
          <div className="space-y-1">
            <p className="text-sm"><strong>Dosage:</strong> Once daily</p>
            <p className="text-sm"><strong>Purpose:</strong> Blood pressure control</p>
            <p className="text-sm"><strong>Side effects:</strong> Dry cough, dizziness</p>
          </div>
          <div className="flex items-center pt-2">
            <span className="text-xs text-muted-foreground">
              Prescribed: 3 months ago
            </span>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  ),
}

// Appointment hover card
export const AppointmentDetails: Story = {
  render: () => (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button variant="link">Next Appointment</Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Cardiology Follow-up</h4>
          <div className="space-y-1">
            <p className="text-sm"><strong>Date:</strong> March 15, 2024</p>
            <p className="text-sm"><strong>Time:</strong> 2:30 PM</p>
            <p className="text-sm"><strong>Provider:</strong> Dr. Sarah Johnson</p>
            <p className="text-sm"><strong>Location:</strong> Room 204</p>
          </div>
          <div className="flex items-center pt-2">
            <span className="text-xs text-muted-foreground">
              Reminder sent
            </span>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  ),
}

// Custom delay hover card
export const CustomDelay: Story = {
  render: () => (
    <HoverCard openDelay={100} closeDelay={300}>
      <HoverCardTrigger asChild>
        <Button variant="link">Quick hover</Button>
      </HoverCardTrigger>
      <HoverCardContent>
        <p className="text-sm">
          This hover card opens quickly (100ms delay) and closes after 300ms.
        </p>
      </HoverCardContent>
    </HoverCard>
  ),
}

// With different positioning
export const Different: Story = {
  render: () => (
    <div className="flex gap-4">
      <HoverCard>
        <HoverCardTrigger asChild>
          <Button variant="outline">Top</Button>
        </HoverCardTrigger>
        <HoverCardContent side="top">
          <p className="text-sm">Positioned above the trigger</p>
        </HoverCardContent>
      </HoverCard>
      
      <HoverCard>
        <HoverCardTrigger asChild>
          <Button variant="outline">Right</Button>
        </HoverCardTrigger>
        <HoverCardContent side="right">
          <p className="text-sm">Positioned to the right</p>
        </HoverCardContent>
      </HoverCard>
      
      <HoverCard>
        <HoverCardTrigger asChild>
          <Button variant="outline">Left</Button>
        </HoverCardTrigger>
        <HoverCardContent side="left">
          <p className="text-sm">Positioned to the left</p>
        </HoverCardContent>
      </HoverCard>
    </div>
  ),
}