import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { 
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from '@joinomu/ui'

const meta = {
  title: 'Atomic/Molecules/Command',
  component: Command,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply to the command'
    },
  },
} satisfies Meta<typeof Command>

export default meta
type Story = StoryObj<typeof meta>

// Basic command menu
export const Default: Story = {
  render: () => (
    <Command className="rounded-lg border shadow-md max-w-[450px]">
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem>
            <span>Calendar</span>
          </CommandItem>
          <CommandItem>
            <span>Search Emoji</span>
          </CommandItem>
          <CommandItem>
            <span>Calculator</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Settings">
          <CommandItem>
            <span>Profile</span>
            <CommandShortcut>⌘P</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <span>Billing</span>
            <CommandShortcut>⌘B</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <span>Settings</span>
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
}

// Healthcare-specific command menu
export const HealthcareCommands: Story = {
  render: () => (
    <Command className="rounded-lg border shadow-md max-w-[450px]">
      <CommandInput placeholder="Search patients, appointments, or actions..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Quick Actions">
          <CommandItem>
            <span>New Patient</span>
            <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <span>Schedule Appointment</span>
            <CommandShortcut>⌘A</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <span>View Calendar</span>
            <CommandShortcut>⌘C</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Patient Management">
          <CommandItem>
            <span>Search Patients</span>
            <CommandShortcut>⌘F</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <span>Medical Records</span>
            <CommandShortcut>⌘R</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <span>Prescriptions</span>
            <CommandShortcut>⌘P</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Admin">
          <CommandItem>
            <span>User Management</span>
            <CommandShortcut>⌘U</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <span>System Settings</span>
            <CommandShortcut>⌘,</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
}

// Patient search command
export const PatientSearch: Story = {
  render: () => (
    <Command className="rounded-lg border shadow-md max-w-[450px]">
      <CommandInput placeholder="Search patients by name or ID..." />
      <CommandList>
        <CommandEmpty>No patients found.</CommandEmpty>
        <CommandGroup heading="Recent Patients">
          <CommandItem>
            <div className="flex flex-col items-start">
              <span>John Smith</span>
              <span className="text-xs text-muted-foreground">ID: PT-001 • Last visit: 2 days ago</span>
            </div>
          </CommandItem>
          <CommandItem>
            <div className="flex flex-col items-start">
              <span>Sarah Johnson</span>
              <span className="text-xs text-muted-foreground">ID: PT-002 • Last visit: 1 week ago</span>
            </div>
          </CommandItem>
          <CommandItem>
            <div className="flex flex-col items-start">
              <span>Michael Brown</span>
              <span className="text-xs text-muted-foreground">ID: PT-003 • Last visit: 3 days ago</span>
            </div>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="All Patients">
          <CommandItem>
            <span>View All Patients</span>
            <CommandShortcut>⌘A</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <span>Add New Patient</span>
            <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
}

// Command menu with loading state
export const Loading: Story = {
  render: () => (
    <Command className="rounded-lg border shadow-md max-w-[450px]">
      <CommandInput placeholder="Searching..." />
      <CommandList>
        <CommandEmpty>Loading...</CommandEmpty>
      </CommandList>
    </Command>
  ),
}

// Compact command menu
export const Compact: Story = {
  render: () => (
    <Command className="rounded-lg border shadow-md max-w-[300px]">
      <CommandInput placeholder="Quick search..." />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup>
          <CommandItem>Profile</CommandItem>
          <CommandItem>Settings</CommandItem>
          <CommandItem>Help</CommandItem>
          <CommandItem>Logout</CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
}

// Command menu with keyboard shortcuts
export const WithShortcuts: Story = {
  render: () => (
    <Command className="rounded-lg border shadow-md max-w-[450px]">
      <CommandInput placeholder="Type a command..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem>
            <span>Dashboard</span>
            <CommandShortcut>⌘D</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <span>Patients</span>
            <CommandShortcut>⌘P</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <span>Appointments</span>
            <CommandShortcut>⌘A</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <span>Reports</span>
            <CommandShortcut>⌘R</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem>
            <span>New</span>
            <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <span>Save</span>
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <span>Print</span>
            <CommandShortcut>⌘⇧P</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
}