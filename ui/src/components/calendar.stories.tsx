import type { Meta, StoryObj } from '@storybook/react'
import * as React from 'react'
import { Calendar } from './calendar'
import { DateInput } from './date-input'

const meta: Meta<typeof Calendar> = {
  title: 'Atomic/Molecules/Calendar',
  component: Calendar,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Modern calendar component built with react-day-picker v9 following latest shadcn best practices with proper dropdown month/year selectors.',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const CalendarDemo: Story = {
  render: () => {
    const [date, setDate] = React.useState<Date | undefined>(new Date())

    return (
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        className="rounded-md border shadow-sm"
        captionLayout="dropdown"
      />
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Default calendar with single date selection mode and dropdown month/year selectors.',
      },
    },
  },
}

export const DateInputDemo: Story = {
  render: () => {
    return (
      <DateInput
        label="Schedule Date"
        placeholder="Tomorrow or next week"
        helpText="Your post will be published on the selected date."
        onChange={(value, date) => {
          console.log('Date changed:', { value, date })
        }}
      />
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Smart date input with natural language parsing and calendar picker. Users can type dates like "tomorrow", "next week", or use the calendar picker.',
      },
    },
  },
}