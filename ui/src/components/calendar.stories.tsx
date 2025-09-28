import type { Meta, StoryObj } from '@storybook/react'
import * as React from 'react'
import { Calendar } from './calendar'
import { DateInput } from './date-input'
import { Button } from './button'
import { Card, CardContent, CardFooter } from './card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'

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

export const Visits: Story = {
  render: () => {
    const [date, setDate] = React.useState<Date | undefined>(
      new Date(2025, 5, 12)
    )
    const [selectedTime, setSelectedTime] = React.useState<string | null>("10:00")
    const [selectedMedicationProvider, setSelectedMedicationProvider] = React.useState<string>("")
    
    const timeSlots = Array.from({ length: 37 }, (_, i) => {
      const totalMinutes = i * 15
      const hour = Math.floor(totalMinutes / 60) + 9
      const minute = totalMinutes % 60
      return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
    })
    
    const bookedDates = Array.from(
      { length: 3 },
      (_, i) => new Date(2025, 5, 17 + i)
    )
    
    const medicationProviders = [
      { id: 'sema-johnson', label: 'Semaglutide - Dr. Sarah Johnson' },
      { id: 'metf-chen', label: 'Metformin - Dr. Michael Chen' },
      { id: 'ozem-rodriguez', label: 'Ozempic - Dr. Emily Rodriguez' },
      { id: 'wegovy-smith', label: 'Wegovy - Dr. Robert Smith' },
      { id: 'rybelsus-davis', label: 'Rybelsus - Dr. Lisa Davis' },
    ]

    return (
      <Card className="gap-0 p-0 md:max-w-[700px] lg:max-w-[800px] flex flex-col mx-auto">
        <CardContent className="relative p-0 md:pr-48 flex-1 min-h-0">
          <div className="p-6">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              defaultMonth={date}
              disabled={bookedDates}
              showOutsideDays={false}
              modifiers={{
                booked: bookedDates,
              }}
              modifiersClassNames={{
                booked: "[&>button]:line-through opacity-100",
              }}
              className="bg-transparent p-0 w-full [--cell-size:--spacing(12)] md:[--cell-size:--spacing(14)] [&_table]:w-full [&_td]:text-center [&_th]:text-center [&_table]:table-fixed"
              formatters={{
                formatWeekdayName: (date) => {
                  return date.toLocaleString("en-US", { weekday: "short" })
                },
              }}
            />
          </div>
          <div className="no-scrollbar inset-y-0 right-0 flex max-h-72 w-full scroll-pb-6 flex-col gap-4 overflow-y-auto border-t p-6 md:absolute md:max-h-none md:w-48 md:border-t-0 md:border-l">
            <div className="grid gap-2">
              {timeSlots.map((time) => (
                <Button
                  key={time}
                  variant={selectedTime === time ? "default" : "outline"}
                  onClick={() => setSelectedTime(time)}
                  className="w-full shadow-none"
                >
                  {time}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 border-t px-6 !py-5 md:flex-row">
          <div className="flex flex-col gap-3 w-full">
            <Select value={selectedMedicationProvider} onValueChange={setSelectedMedicationProvider}>
              <SelectTrigger>
                <SelectValue placeholder="Select medication and provider..." />
              </SelectTrigger>
              <SelectContent>
                {medicationProviders.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-sm">
              {date && selectedTime && selectedMedicationProvider ? (
                <>
                  Your visit is booked for{" "}
                  <span className="font-medium">
                    {" "}
                    {date?.toLocaleDateString("en-US", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}{" "}
                  </span>
                  at <span className="font-medium">{selectedTime}</span> with{" "}
                  <span className="font-medium">
                    {medicationProviders.find(p => p.id === selectedMedicationProvider)?.label}
                  </span>.
                </>
              ) : (
                <>Select a date, time, and medication/provider for your visit.</>
              )}
            </div>
          </div>
          <Button
            disabled={!date || !selectedTime || !selectedMedicationProvider}
            className="w-full md:ml-auto md:w-auto"
            variant="outline"
          >
            Continue
          </Button>
        </CardFooter>
      </Card>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Healthcare visit scheduling calendar with medication selection and provider assignment. Users can select appointment dates, times, and specify which medication consultation they need with their assigned provider.',
      },
    },
  },
}