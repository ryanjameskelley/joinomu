"use client"

import * as React from "react"
import { parseDate } from "chrono-node"
import { CalendarIcon } from "lucide-react"

import { Button } from "./button"
import { Calendar } from "./calendar"
import { Input } from "./input"
import { Label } from "./label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover"

function formatDate(date: Date | undefined) {
  if (!date) {
    return ""
  }

  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

export interface DateInputProps {
  label: string
  value?: string
  placeholder?: string
  helpText?: string
  onChange?: (value: string, date: Date | undefined) => void
  id?: string
  className?: string
}

export function DateInput({
  label,
  value: initialValue = "",
  placeholder = "Tomorrow or next week",
  helpText,
  onChange,
  id = "date-input",
  className
}: DateInputProps) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState(initialValue)
  const [date, setDate] = React.useState<Date | undefined>(
    parseDate(initialValue) || undefined
  )
  const [month, setMonth] = React.useState<Date | undefined>(date)

  const handleValueChange = (newValue: string) => {
    setValue(newValue)
    const parsedDate = parseDate(newValue)
    if (parsedDate) {
      setDate(parsedDate)
      setMonth(parsedDate)
    }
    onChange?.(newValue, parsedDate || undefined)
  }

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    const formattedValue = formatDate(selectedDate)
    setValue(formattedValue)
    setOpen(false)
    onChange?.(formattedValue, selectedDate)
  }

  return (
    <div className={`flex flex-col gap-3 ${className || ''}`}>
      {label && (
        <Label htmlFor={id} className="px-1">
          {label}
        </Label>
      )}
      <div className="relative flex gap-2">
        <Input
          id={id}
          value={value}
          placeholder={placeholder}
          className="bg-background pr-10 w-full"
          onChange={(e) => handleValueChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault()
              setOpen(true)
            }
          }}
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
            >
              <CalendarIcon className="size-3.5" />
              <span className="sr-only">Select date</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="end">
            <Calendar
              mode="single"
              selected={date}
              captionLayout="dropdown"
              month={month}
              onMonthChange={setMonth}
              onSelect={handleDateSelect}
            />
          </PopoverContent>
        </Popover>
      </div>
      {helpText && (
        <div className="text-muted-foreground px-1 text-sm">
          {helpText}
        </div>
      )}
    </div>
  )
}