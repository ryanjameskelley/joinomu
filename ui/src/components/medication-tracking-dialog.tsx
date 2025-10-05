import * as React from "react"
import { Button } from "./button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog"
import { Input } from "./input"
import { Label } from "./label"
import { Textarea } from "./textarea"
import { Calendar } from "./calendar"
import { Card, CardContent, CardFooter } from "./card"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { Clock, CalendarIcon } from "lucide-react"

export interface MedicationTrackingEntry {
  id?: string
  medication_preference_id: string
  taken_date: string
  taken_time?: string
  notes?: string
}

export interface MedicationTrackingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  medication: {
    name: string
    dosage: string
    id: string
  }
  entry?: MedicationTrackingEntry
  onSave: (entry: Omit<MedicationTrackingEntry, 'id'>) => Promise<void>
  isEditing?: boolean
}

export function MedicationTrackingDialog({
  open,
  onOpenChange,
  medication,
  entry,
  onSave,
  isEditing = false
}: MedicationTrackingDialogProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date())
  const [takenTime, setTakenTime] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [dateTimePopoverOpen, setDateTimePopoverOpen] = React.useState(false)

  // Helper function to format the selected date and time for display
  const formatDateTimeDisplay = () => {
    if (!selectedDate) return "Select date and time"
    
    const dateStr = selectedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric', 
      month: 'long',
      day: 'numeric'
    })
    
    if (takenTime) {
      // Convert 24-hour time to 12-hour format
      const [hours, minutes] = takenTime.split(':')
      const hour = parseInt(hours)
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const displayHour = hour % 12 || 12
      return `${dateStr} at ${displayHour}:${minutes} ${ampm}`
    }
    
    return dateStr
  }

  // Initialize form with current date and time or existing entry data
  React.useEffect(() => {
    if (open) {
      if (entry) {
        // Editing existing entry
        const entryDate = new Date(entry.taken_date)
        setSelectedDate(entryDate)
        setTakenTime(entry.taken_time || "")
        setNotes(entry.notes || "")
      } else {
        // Creating new entry - default to current date and time
        const now = new Date()
        setSelectedDate(now)
        const currentTime = now.toTimeString().slice(0, 5) // HH:MM
        setTakenTime(currentTime)
        setNotes("")
      }
    }
  }, [open, entry])

  const handleSave = async () => {
    if (!selectedDate) return

    setIsLoading(true)
    try {
      // Convert Date object to YYYY-MM-DD string
      const dateString = selectedDate.toISOString().split('T')[0]
      
      await onSave({
        medication_preference_id: medication.id,
        taken_date: dateString,
        taken_time: takenTime || undefined,
        notes: notes || undefined
      })
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to save tracking entry:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit' : 'Track'} {medication.name}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update your medication tracking entry'
              : `Record when you took your ${medication.dosage} dose`
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-6 py-4">
          {/* Date and Time Picker with Input Field */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="datetime-input">When did you take this dose?</Label>
            <Popover open={dateTimePopoverOpen} onOpenChange={setDateTimePopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="datetime-input"
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  onClick={() => setDateTimePopoverOpen(true)}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formatDateTimeDisplay()}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Card className="border-0 shadow-none">
                  <CardContent className="px-4 pt-4">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      className="bg-transparent p-0"
                    />
                  </CardContent>
                  <CardFooter className="flex flex-col gap-3 border-t px-4 !pt-4">
                    <div className="flex w-full flex-col gap-2">
                      <Label htmlFor="taken-time">Time</Label>
                      <div className="relative flex w-full items-center gap-2">
                        <Clock className="text-muted-foreground pointer-events-none absolute left-2.5 size-4 select-none" />
                        <Input
                          id="taken-time"
                          type="time"
                          step="1"
                          value={takenTime}
                          onChange={(e) => setTakenTime(e.target.value)}
                          className="appearance-none pl-8 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                        />
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Notes Section */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes about this dose..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!selectedDate || isLoading}>
            {isLoading ? (isEditing ? 'Updating...' : 'Saving...') : (isEditing ? 'Update' : 'Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}