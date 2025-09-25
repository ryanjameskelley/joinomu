import * as React from "react"
import { Card, CardContent } from "./card"
import { Separator } from "./separator"
import { Badge } from "./badge"
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
   * Optional status for the medication
   */
  status?: 'pending' | 'approved' | 'denied' | 'discontinued' | 'active' | 'shipped' | 'delivered'
  /**
   * Optional order date for Orders variant
   */
  orderDate?: string
  /**
   * Optional approval ID for Orders variant  
   */
  approvalId?: string
  /**
   * Optional order number for Preferred variant
   */
  orderNumber?: string
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
  status,
  orderDate,
  approvalId,
  orderNumber,
  className,
  onClick
}: MedicationCardProps) {
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved':
      case 'active':
      case 'delivered':
        return 'default' as const
      case 'pending':
      case 'shipped':
        return 'secondary' as const
      case 'denied':
      case 'discontinued':
        return 'destructive' as const
      default:
        return 'outline' as const
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
    >
      <CardContent className="p-4">
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-semibold leading-none tracking-tight text-foreground">
              {medicationName}
            </h3>
            {status && (
              <Badge 
                variant={getStatusBadgeVariant(status)}
                className="capitalize text-xs"
              >
                {status}
              </Badge>
            )}
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <span>{dosage}</span>
            <Separator orientation="vertical" className="mx-2 h-4" />
            <span>{supply}</span>
          </div>
          {(orderDate || approvalId || orderNumber) && (
            <div className="flex items-center text-xs text-muted-foreground pt-1">
              {orderNumber && (
                <>
                  <span>{orderNumber}</span>
                  {(approvalId || orderDate) && <Separator orientation="vertical" className="mx-2 h-3" />}
                </>
              )}
              {approvalId && (
                <>
                  <span>Approval: {approvalId.slice(0, 8)}...</span>
                  {orderDate && <Separator orientation="vertical" className="mx-2 h-3" />}
                </>
              )}
              {orderDate && (
                <span>Ordered: {orderDate}</span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}