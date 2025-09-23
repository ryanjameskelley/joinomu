import * as React from "react"
import { Card, CardContent } from "./card"
import { Separator } from "./separator"
import { cn } from "../lib/utils"

export interface MedicationCardProps {
  /**
   * The name of the medication
   */
  medicationName: string
  /**
   * The dosage of the medication (e.g., "1mg", "50mg", "200mg/ml")
   */
  dosage: string
  /**
   * The supply information (e.g., "30 day supply", "90 tablets", "1 month")
   */
  supply: string
  /**
   * Optional additional CSS classes
   */
  className?: string
  /**
   * Click handler for the medication card
   */
  onClick?: () => void
}

export function MedicationCard({
  medicationName,
  dosage,
  supply,
  className,
  onClick
}: MedicationCardProps) {
  return (
    <Card 
      className={cn(
        "w-full max-w-sm transition-all duration-200 hover:shadow-md", 
        onClick && "cursor-pointer hover:scale-[1.02]",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="space-y-1">
          <h3 className="text-base font-semibold leading-none tracking-tight text-foreground">
            {medicationName}
          </h3>
          <div className="flex items-center text-sm text-muted-foreground">
            <span>{dosage}</span>
            <Separator orientation="vertical" className="mx-2 h-4" />
            <span>{supply}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}