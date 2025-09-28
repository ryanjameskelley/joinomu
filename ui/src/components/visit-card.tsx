import * as React from "react"
import { Card, CardContent } from "./card"
import { Separator } from "./separator"
import { Badge } from "./badge"
import { Calendar, Clock } from "lucide-react"
import { cn } from "../lib/utils"

export interface VisitCardProps {
  /**
   * The patient's name for the visit
   */
  patientName: string
  /**
   * The appointment date (e.g., "2024-03-15")
   */
  appointmentDate: string
  /**
   * The appointment time (e.g., "2:30 PM", "14:30")
   */
  appointmentTime: string
  /**
   * The type of appointment/visit
   */
  visitType?: string
  /**
   * Status of the appointment
   */
  status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled'
  /**
   * Treatment type for the visit
   */
  treatmentType?: string
  /**
   * Optional additional CSS classes
   */
  className?: string
  /**
   * Click handler for the visit card
   */
  onClick?: () => void
}

const statusColors = {
  scheduled: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  confirmed: 'bg-green-100 text-green-800 hover:bg-green-200',
  completed: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
  cancelled: 'bg-red-100 text-red-800 hover:bg-red-200',
  no_show: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
  rescheduled: 'bg-purple-100 text-purple-800 hover:bg-purple-200'
}

export function VisitCard({
  patientName,
  appointmentDate,
  appointmentTime,
  visitType = 'Consultation',
  status = 'scheduled',
  treatmentType,
  className,
  onClick,
  ...props
}: VisitCardProps) {
  // Format date for display (avoid timezone issues with date-only strings)
  const formatDate = (dateString: string) => {
    try {
      // Parse as local date to avoid timezone shift issues
      // For "2025-09-30" format, split and create date manually
      const [year, month, day] = dateString.split('-').map(Number)
      const date = new Date(year, month - 1, day) // month is 0-indexed
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  return (
    <Card 
      className={cn(
        "w-full max-w-sm transition-all duration-200 hover:shadow-md",
        onClick && "cursor-pointer hover:scale-[1.02]",
        className
      )}
      onClick={onClick}
      {...props}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-semibold text-base truncate">{patientName}</h4>
              {status && (
                <Badge 
                  variant="secondary" 
                  className={cn("text-xs", statusColors[status])}
                >
                  {status.replace('_', ' ')}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(appointmentDate)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{appointmentTime}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-foreground">{visitType}</span>
              {treatmentType && (
                <>
                  <Separator orientation="vertical" className="h-4" />
                  <span className="text-muted-foreground capitalize">
                    {treatmentType.replace('_', ' ')}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}