import type { Meta, StoryObj } from '@storybook/react'
import * as React from 'react'
import { Calendar } from './calendar'

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