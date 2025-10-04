import * as React from "react"
import { Card, CardContent } from "./card"
import { Separator } from "./separator"
import { Badge } from "./badge"
import { Button } from "./button"
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
  status?: 'pending' | 'approved' | 'denied' | 'discontinued' | 'active' | 'shipped' | 'delivered' | 'scheduled'
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
   * Optional estimated delivery date
   */
  estimatedDelivery?: string
  /**
   * Optional fulfillment status
   */
  fulfillmentStatus?: string
  /**
   * Optional next visit date
   */
  nextVisit?: string
  /**
   * Optional next prescription due date (ISO string)
   */
  nextPrescriptionDue?: string
  /**
   * Whether a refill has been requested by the patient
   */
  refillRequested?: boolean
  /**
   * Date when the refill was last requested
   */
  refillRequestedDate?: string
  /**
   * Date when the medication was last approved
   */
  approvalDate?: string
  /**
   * Optional edit handler - shows edit link when provided
   */
  onEdit?: () => void
  /**
   * Optional title click handler - makes title a clickable link when provided
   */
  onTitleClick?: () => void
  /**
   * Optional refill request handler - shows Request Refill button when provided and conditions are met
   */
  onRequestRefill?: () => void
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
  estimatedDelivery,
  fulfillmentStatus,
  nextVisit,
  nextPrescriptionDue,
  refillRequested,
  refillRequestedDate,
  approvalDate,
  onEdit,
  onTitleClick,
  onRequestRefill,
  className,
  onClick
}: MedicationCardProps) {
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved':
      case 'active':
      case 'delivered':
      case 'scheduled':
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

  // Check if estimated delivery date has passed
  const hasEstimatedDeliveryPassed = React.useMemo(() => {
    if (!estimatedDelivery) return false
    const today = new Date()
    const deliveryDate = new Date(estimatedDelivery)
    // Set both dates to start of day for accurate comparison
    today.setHours(0, 0, 0, 0)
    deliveryDate.setHours(0, 0, 0, 0)
    return deliveryDate < today
  }, [estimatedDelivery])

  // Check if refill request should be available (3 days before due date)
  const shouldShowRefillButton = React.useMemo(() => {
    // Don't show refill button if no due date or no handler
    if (!nextPrescriptionDue || !onRequestRefill) {
      return false
    }

    // Don't show for final statuses regardless of refill request status
    const finalStatuses = ['denied', 'discontinued', 'shipped', 'delivered']
    if (finalStatuses.includes(status || '')) {
      return false
    }

    // If status is pending (refill request submitted), don't show button
    if (status === 'pending') {
      return false
    }

    // If status is approved and refill was requested, check if approval came after refill request
    if (status === 'approved' && refillRequested) {
      // If we have both dates, compare them
      if (refillRequestedDate && approvalDate) {
        const refillDate = new Date(refillRequestedDate)
        const approvalDateTime = new Date(approvalDate)
        // Only hide button if approval came after refill request
        if (approvalDateTime > refillDate) {
          return false
        }
        // If approval is before refill request, show button (patient can request again)
      } else {
        // Fallback: if we don't have dates but refill was requested and status is approved
        return false
      }
    }

    // Only show for 'approved' or 'active' medications
    if (!['approved', 'active'].includes(status || '')) {
      return false
    }

    const today = new Date()
    const dueDate = new Date(nextPrescriptionDue)
    const daysDifference = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24))
    
    // Show refill button if due date is within 3 days (or past due)
    return daysDifference <= 3
  }, [nextPrescriptionDue, onRequestRefill, status, refillRequested, refillRequestedDate, approvalDate])

  return (
    <Card 
      className={cn(
        "w-full transition-all duration-200 hover:shadow-md", 
        !className?.includes('w-full') && "max-w-sm",
        onClick && "cursor-pointer hover:scale-[1.02]",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-2">
            {onTitleClick ? (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onTitleClick()
                }}
                className="text-base font-semibold leading-none tracking-tight text-foreground hover:underline text-left"
              >
                {medicationName}
              </button>
            ) : (
              <h3 className="text-base font-semibold leading-none tracking-tight text-foreground">
                {medicationName}
              </h3>
            )}
            <div className="flex items-center gap-2">
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit()
                  }}
                  className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                >
                  Edit
                </button>
              )}
              {shouldShowRefillButton ? (
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRequestRefill!()
                  }}
                  className="text-xs h-6 px-3"
                >
                  Request Refill
                </Button>
              ) : (
                status && (
                  <Badge 
                    variant={getStatusBadgeVariant(status)}
                    className="capitalize text-xs"
                  >
                    {status}
                  </Badge>
                )
              )}
            </div>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <span>{dosage}</span>
            <Separator orientation="vertical" className="mx-2 h-4" />
            <span>{supply}</span>
          </div>
          {(orderDate || approvalId || orderNumber || estimatedDelivery || fulfillmentStatus || nextVisit || nextPrescriptionDue) && (
            <div className="flex items-center text-xs text-muted-foreground pt-1">
              {orderNumber && (
                <>
                  <span>{orderNumber}</span>
                  {(approvalId || orderDate || estimatedDelivery || nextVisit) && <Separator orientation="vertical" className="mx-2 h-3" />}
                </>
              )}
              {approvalId && (
                <>
                  <span>Approval: {approvalId.slice(0, 8)}...</span>
                  {(orderDate || estimatedDelivery || nextVisit) && <Separator orientation="vertical" className="mx-2 h-3" />}
                </>
              )}
              {orderDate && (
                <>
                  <span>Ordered: {orderDate}</span>
                  {((fulfillmentStatus && fulfillmentStatus !== 'delivered' && !hasEstimatedDeliveryPassed) || (estimatedDelivery && !hasEstimatedDeliveryPassed) || nextVisit || nextPrescriptionDue) && <Separator orientation="vertical" className="mx-2 h-3" />}
                </>
              )}
              {fulfillmentStatus && fulfillmentStatus !== 'delivered' && !hasEstimatedDeliveryPassed && (
                <>
                  <span>Order Status: {fulfillmentStatus === 'pharmacy_fulfilled' ? 'Pharmacy Fulfilled' : fulfillmentStatus.charAt(0).toUpperCase() + fulfillmentStatus.slice(1)}</span>
                  {(estimatedDelivery || nextVisit || nextPrescriptionDue) && <Separator orientation="vertical" className="mx-2 h-3" />}
                </>
              )}
              {estimatedDelivery && !hasEstimatedDeliveryPassed && (
                <>
                  <span>Estimated Delivery: {new Date(estimatedDelivery).toLocaleDateString('en-US', {
                    month: '2-digit',
                    day: '2-digit', 
                    year: 'numeric'
                  })}</span>
                  {(nextVisit || nextPrescriptionDue) && <Separator orientation="vertical" className="mx-2 h-3" />}
                </>
              )}
              {nextVisit && (
                <>
                  <span>Next Visit: {new Date(nextVisit).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}</span>
                  {nextPrescriptionDue && <Separator orientation="vertical" className="mx-2 h-3" />}
                </>
              )}
              {nextPrescriptionDue && (
                <span>Next Refill Due: {new Date(nextPrescriptionDue).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}</span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}