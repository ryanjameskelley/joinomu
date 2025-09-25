import * as React from 'react'
import {
  User,
  Pill,
  Activity,
  Maximize,
  Minimize,
  Calendar,
  Package,
  Truck,
  Heart,
  ShoppingCart,
  Copy,
} from 'lucide-react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './breadcrumb'
import { Button } from './button'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from './dialog'
import { Input } from './input'
import { Label } from './label'
import { MedicationCard } from './medication-card'
import { DateInput } from './date-input'
import { Separator } from './separator'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from './sidebar'
import { Badge } from './badge'
import { Sonner, dismissToast } from './toast'
import type { Patient } from './patient-table'
import { authService } from '../../../shared/src/auth/auth-service'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select'
import { Textarea } from './textarea'

export interface PatientMedication {
  id: string
  name: string
  dosage: string
  supply: string
  status: 'active' | 'pending' | 'shipped' | 'delivered'
  lastPaymentDate?: string
  sentToPharmacyDate?: string
  shippedToPharmacyDate?: string
  trackingNumber?: string
}

const patientNavData = {
  nav: [
    { name: "Information", icon: User },
    { name: "Medications", icon: Pill },
    { name: "Preferred Medications", icon: Heart },
    { name: "Orders", icon: ShoppingCart },
    { name: "Tracking", icon: Activity },
  ],
}

export interface PatientMedicationPreference {
  id: string
  medication_name: string
  preferred_dosage: string
  frequency: string
  status: 'pending' | 'approved' | 'denied'
  requested_date: string
  notes?: string
}

export interface PatientMedicationOrder {
  id: string
  approval_id: string
  preference_id?: string | null
  medication_name: string
  quantity: number
  dosage: string
  total_amount: number
  payment_status: string
  payment_method?: string
  payment_date?: string
  fulfillment_status: string
  created_at: string
  shipped_date?: string
  tracking_number?: string
  estimated_delivery?: string
  admin_notes?: string
}

export interface EnhancedPatientInformationDialogProps {
  patient: Patient | null
  medications?: PatientMedication[]
  preferredMedications?: PatientMedicationPreference[]
  medicationOrders?: PatientMedicationOrder[]
  open: boolean
  onOpenChange: (open: boolean) => void
  isAdmin?: boolean
  onMedicationUpdate?: (medicationId: string, updates: Partial<PatientMedication>) => void
  initialSection?: string
}

export function EnhancedPatientInformationDialog({
  patient,
  medications = [],
  preferredMedications = [],
  medicationOrders = [],
  open,
  onOpenChange,
  isAdmin = false,
  onMedicationUpdate,
  initialSection = "Information"
}: EnhancedPatientInformationDialogProps) {
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [activeSection, setActiveSection] = React.useState(initialSection)
  const [selectedMedication, setSelectedMedication] = React.useState<PatientMedication | null>(null)
  const [selectedPreference, setSelectedPreference] = React.useState<PatientMedicationPreference | null>(null)
  const [selectedOrder, setSelectedOrder] = React.useState<PatientMedicationOrder | null>(null)
  const [associatedOrders, setAssociatedOrders] = React.useState<PatientMedicationOrder[]>([])
  const [paymentDate, setPaymentDate] = React.useState("")
  const [sentToPharmacyDate, setSentToPharmacyDate] = React.useState("")
  const [shippedDate, setShippedDate] = React.useState("")
  const [trackingNumber, setTrackingNumber] = React.useState("")
  
  // Order editing state
  const [editingOrder, setEditingOrder] = React.useState(false)
  const [orderPaymentStatus, setOrderPaymentStatus] = React.useState("")
  const [orderPaymentMethod, setOrderPaymentMethod] = React.useState("")
  const [orderPaymentDate, setOrderPaymentDate] = React.useState("")
  const [orderFulfillmentStatus, setOrderFulfillmentStatus] = React.useState("")
  const [orderTrackingNumber, setOrderTrackingNumber] = React.useState("")
  const [orderShippedDate, setOrderShippedDate] = React.useState("")
  const [orderEstimatedDelivery, setOrderEstimatedDelivery] = React.useState("")
  const [orderAdminNotes, setOrderAdminNotes] = React.useState("")

  // Load selected medication data when changed
  React.useEffect(() => {
    if (selectedMedication) {
      setPaymentDate(selectedMedication.lastPaymentDate || "")
      setSentToPharmacyDate(selectedMedication.sentToPharmacyDate || "")
      setShippedDate(selectedMedication.shippedToPharmacyDate || "")
      setTrackingNumber(selectedMedication.trackingNumber || "")
    }
  }, [selectedMedication])

  // Load associated orders when a preference is selected
  React.useEffect(() => {
    const fetchAssociatedOrders = async () => {
      if (selectedPreference) {
        try {
          console.log('🔍 UI: Fetching orders for preference:', selectedPreference.id, 'REF:', selectedPreference.id.slice(0, 8).toUpperCase())
          const { data } = await authService.getOrdersByPreferenceId(selectedPreference.id)
          console.log('📦 UI: Received orders:', data?.length || 0, 'orders')
          setAssociatedOrders(data || [])
        } catch (error) {
          console.error('❌ UI: Error fetching associated orders:', error)
          setAssociatedOrders([])
        }
      } else {
        setAssociatedOrders([])
      }
    }

    fetchAssociatedOrders()
  }, [selectedPreference])

  // Load selected order data when changed
  React.useEffect(() => {
    if (selectedOrder) {
      setOrderPaymentStatus(selectedOrder.payment_status || "")
      setOrderPaymentMethod(selectedOrder.payment_method || "")
      setOrderPaymentDate(selectedOrder.payment_date || "")
      setOrderFulfillmentStatus(selectedOrder.fulfillment_status || "")
      setOrderTrackingNumber(selectedOrder.tracking_number || "")
      setOrderShippedDate(selectedOrder.shipped_date || "")
      setOrderEstimatedDelivery(selectedOrder.estimated_delivery || "")
      setOrderAdminNotes(selectedOrder.admin_notes || "")
      setEditingOrder(false)
    }
  }, [selectedOrder])

  if (!patient) {
    return null
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not provided"
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatName = (first_name: string, last_name: string) => {
    return `${first_name} ${last_name}`.trim() || "Unknown Patient"
  }

  const getIntakeStatus = (has_completed_intake?: boolean) => {
    if (has_completed_intake === true) {
      return "Complete"
    } else if (has_completed_intake === false) {
      return "Pending"
    }
    return "Unknown"
  }

  const getTreatmentPlan = () => {
    if (patient.treatment_type) {
      return patient.treatment_type.replace('_', ' ')
    }
    if (patient.treatment_types && patient.treatment_types.length > 0) {
      return patient.treatment_types.join(', ').replace(/_/g, ' ')
    }
    return "No active treatment plan"
  }

  const getPrimaryProvider = () => {
    if (patient.assigned_providers && patient.assigned_providers.length > 0) {
      return patient.assigned_providers[0]
    }
    return "No provider assigned"
  }

  const handleSaveMedication = async () => {
    if (selectedMedication && onMedicationUpdate) {
      let savingToastId: string | number | undefined
      
      try {
        // Show loading toast and store its ID
        savingToastId = Sonner.saving(selectedMedication.name)
        
        // Call the update function
        await onMedicationUpdate(selectedMedication.id, {
          lastPaymentDate: paymentDate,
          sentToPharmacyDate: sentToPharmacyDate,
          shippedToPharmacyDate: shippedDate,
          trackingNumber: trackingNumber
        })
        
        // Dismiss the saving toast
        if (savingToastId) {
          dismissToast(savingToastId)
        }
        
        // Show success toast
        Sonner.saved(selectedMedication.name)
        
      } catch (error) {
        // Dismiss the saving toast
        if (savingToastId) {
          dismissToast(savingToastId)
        }
        
        // Show error toast
        Sonner.error(selectedMedication.name, error instanceof Error ? error.message : 'Unknown error')
      }
    }
  }

  const handleSaveOrder = async () => {
    if (selectedOrder && isAdmin) {
      let savingToastId: string | number | undefined
      
      try {
        // Show loading toast
        savingToastId = Sonner.saving('Order ' + selectedOrder.id.slice(0, 8))
        
        // Call the update function
        const result = await authService.updateMedicationOrderAdmin(selectedOrder.id, {
          payment_status: orderPaymentStatus,
          payment_method: orderPaymentMethod,
          payment_date: orderPaymentDate,
          fulfillment_status: orderFulfillmentStatus,
          tracking_number: orderTrackingNumber,
          shipped_date: orderShippedDate,
          estimated_delivery: orderEstimatedDelivery,
          admin_notes: orderAdminNotes
        })
        
        // Dismiss the saving toast
        if (savingToastId) {
          dismissToast(savingToastId)
        }
        
        if (result.success) {
          // Show success toast
          Sonner.saved('Order ' + selectedOrder.id.slice(0, 8))
          setEditingOrder(false)
        } else {
          // Show error toast
          Sonner.error('Order ' + selectedOrder.id.slice(0, 8), result.error?.message || 'Unknown error')
        }
        
      } catch (error) {
        // Dismiss the saving toast
        if (savingToastId) {
          dismissToast(savingToastId)
        }
        
        // Show error toast
        Sonner.error('Order ' + selectedOrder.id.slice(0, 8), error instanceof Error ? error.message : 'Unknown error')
      }
    }
  }

  const getNextPaymentDate = (lastPaymentDate?: string) => {
    if (!lastPaymentDate) return "Not set"
    const lastDate = new Date(lastPaymentDate)
    const nextDate = new Date(lastDate)
    nextDate.setMonth(nextDate.getMonth() + 1)
    return nextDate.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    })
  }

  const handleBackToMedications = () => {
    setSelectedMedication(null)
    setPaymentDate("")
    setSentToPharmacyDate("")
    setShippedDate("")
    setTrackingNumber("")
  }

  const getCurrentBreadcrumb = () => {
    if (selectedMedication) {
      return (
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink 
                href="#" 
                onClick={() => {
                  setActiveSection("Patient Information")
                  setSelectedMedication(null)
                  setSelectedPreference(null)
                  setSelectedOrder(null)
                }}
              >
                Patient Information
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbLink 
                href="#" 
                onClick={handleBackToMedications}
              >
                Medications
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{selectedMedication.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      )
    }

    if (selectedPreference) {
      return (
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink 
                href="#" 
                onClick={() => {
                  setActiveSection("Patient Information")
                  setSelectedMedication(null)
                  setSelectedPreference(null)
                  setSelectedOrder(null)
                }}
              >
                Patient Information
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbLink 
                href="#" 
                onClick={() => setSelectedPreference(null)}
              >
                Preferred Medications
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{selectedPreference.medication_name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      )
    }

    if (selectedOrder) {
      return (
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink 
                href="#" 
                onClick={() => {
                  setActiveSection("Patient Information")
                  setSelectedMedication(null)
                  setSelectedPreference(null)
                  setSelectedOrder(null)
                }}
              >
                Patient Information
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbLink 
                href="#" 
                onClick={() => setSelectedOrder(null)}
              >
                Orders
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{selectedOrder.medication_name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      )
    }

    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem className="hidden md:block">
            <BreadcrumbLink href="#">Patient Information</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="hidden md:block" />
          <BreadcrumbItem>
            <BreadcrumbPage>{activeSection}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )
  }

  const renderContent = () => {
    if (selectedMedication) {
      // Medication detail view
      return (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Medication Overview */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Medication Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Medication Name</Label>
                  <p className="text-lg font-semibold">{selectedMedication.name}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    <Label className="text-sm font-medium">Dosage</Label>
                    <p>{selectedMedication.dosage}</p>
                  </div>
                  <Separator orientation="vertical" className="h-8" />
                  <div>
                    <Label className="text-sm font-medium">Supply</Label>
                    <p>{selectedMedication.supply}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <p className="capitalize">{selectedMedication.status}</p>
                </div>
              </CardContent>
            </Card>

            {/* Payment & Shipping Management */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Payment & Shipping
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Most Recent Medication Payment Date</span>
                      <span className="text-xs text-muted-foreground">
                        Next payment Due: {getNextPaymentDate(paymentDate)}
                      </span>
                    </div>
                  </div>
                  <DateInput
                    label=""
                    value={paymentDate}
                    placeholder="Select payment date"
                    onChange={(value) => setPaymentDate(value)}
                    id="payment-date"
                  />
                </div>

                <DateInput
                  label="Prescription sent to pharmacy"
                  value={sentToPharmacyDate}
                  placeholder="Select date sent"
                  onChange={(value) => setSentToPharmacyDate(value)}
                  id="sent-to-pharmacy-date"
                />

                <DateInput
                  label="Medication shipped to patient"
                  value={shippedDate}
                  placeholder="Select shipment date"
                  onChange={(value) => setShippedDate(value)}
                  id="shipped-date"
                />

                <div className="space-y-2">
                  <Label htmlFor="tracking-number">
                    Tracking Number
                  </Label>
                  <Input
                    id="tracking-number"
                    placeholder="Enter tracking number"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="w-full"
                  />
                </div>

                <Button onClick={handleSaveMedication} className="w-full">
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    }

    if (selectedPreference) {
      // Preferred medication detail view
      return (
        <div className="w-full h-full overflow-y-auto">
            {/* Medication Overview */}
            <Card className="border-0 shadow-none p-0">
              <CardHeader className="p-0">
              </CardHeader>
              <CardContent className="space-y-4 p-0">
                <div>
                  <Label className="text-sm font-medium">Medication Name</Label>
                  <p className="text-lg font-semibold">{selectedPreference.medication_name}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    <Label className="text-sm font-medium">Preferred Dosage</Label>
                    <p>{selectedPreference.preferred_dosage}</p>
                  </div>
                  <Separator orientation="vertical" className="h-8" />
                  <div>
                    <Label className="text-sm font-medium">Frequency</Label>
                    <p>{selectedPreference.frequency || 'Not specified'}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">
                    <Badge variant={
                      selectedPreference.status === 'approved' ? 'default' :
                      selectedPreference.status === 'pending' ? 'secondary' :
                      selectedPreference.status === 'denied' ? 'destructive' : 'outline'
                    }>
                      {selectedPreference.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Requested Date</Label>
                  <p>{new Date(selectedPreference.requested_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Reference Number</Label>
                  <p className="text-sm text-muted-foreground">REF-{selectedPreference.id.slice(0, 8).toUpperCase()}</p>
                </div>
                {selectedPreference.notes && (
                  <div>
                    <Label className="text-sm font-medium">Notes</Label>
                    <p className="text-sm text-muted-foreground">{selectedPreference.notes}</p>
                  </div>
                )}
                {associatedOrders.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Orders</Label>
                    <div className="mt-2 space-y-2">
                      {associatedOrders.map((order) => (
                        <div key={order.id} className="p-3 border rounded-md bg-muted/30">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium">REF-{order.id.slice(0, 8).toUpperCase()}</p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => {
                                    navigator.clipboard.writeText(`REF-${order.id.slice(0, 8).toUpperCase()}`)
                                    Sonner.copied(`REF-${order.id.slice(0, 8).toUpperCase()}`)
                                  }}
                                >
                                  <Copy className="h-4 w-4" />
                                  <span className="sr-only">Copy reference number</span>
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                            </div>
                            <p className="text-sm font-semibold">${order.total_amount?.toFixed(2) || '0.00'}</p>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant={
                              order.fulfillment_status === 'delivered' ? 'default' :
                              order.fulfillment_status === 'shipped' ? 'secondary' :
                              order.fulfillment_status === 'processing' ? 'outline' : 'outline'
                            } className="text-xs">
                              {order.fulfillment_status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
        </div>
      )
    }

    if (selectedOrder) {
      // Medication order detail view with admin editing
      return (
        <div className="w-full h-full flex flex-col">
          {/* Fixed Medication Name */}
          <div className="flex-shrink-0 pb-4 border-b border-border">
            <Label className="text-sm font-medium">Medication Name</Label>
            <p className="text-lg font-semibold">{selectedOrder.medication_name}</p>
          </div>
          
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto pt-4" style={{minHeight: 0}}>
            <div className="space-y-6 pb-8">
              {/* Basic Order Info */}
              <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div>
                  <Label className="text-sm font-medium">Dosage</Label>
                  <p>{selectedOrder.dosage}</p>
                </div>
                <Separator orientation="vertical" className="h-8" />
                <div>
                  <Label className="text-sm font-medium">Quantity</Label>
                  <p>{selectedOrder.quantity}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Total Amount</Label>
                <p className="text-lg font-semibold">${selectedOrder.total_amount?.toFixed(2) || '0.00'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Order Date</Label>
                <p>{new Date(selectedOrder.created_at).toLocaleDateString()}</p>
              </div>
              {selectedOrder.preference_id && (
                <div>
                  <Label className="text-sm font-medium">Preference</Label>
                  <p className="text-sm text-muted-foreground">REF-{selectedOrder.preference_id.slice(0, 8).toUpperCase()}</p>
                </div>
              )}
              <div>
                <Label className="text-sm font-medium">Order</Label>
                <p className="text-sm text-muted-foreground">REF-{selectedOrder.id.slice(0, 8).toUpperCase()}</p>
              </div>
            </div>

            {isAdmin && (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Admin Controls</h3>
                  <Button
                    variant={editingOrder ? "outline" : "default"}
                    onClick={() => setEditingOrder(!editingOrder)}
                    size="sm"
                  >
                    {editingOrder ? "Cancel" : "Edit"}
                  </Button>
                </div>

                {editingOrder ? (
                  /* Edit Mode */
                  <div className="space-y-4">
                    {/* Payment Status & Fulfillment Status - Two Column */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Payment Status</Label>
                        <Select value={orderPaymentStatus} onValueChange={setOrderPaymentStatus}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                            <SelectItem value="refunded">Refunded</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Fulfillment Status</Label>
                        <Select value={orderFulfillmentStatus} onValueChange={setOrderFulfillmentStatus}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Payment Method & Date - Two Column */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Payment Method</Label>
                        <Input
                          value={orderPaymentMethod}
                          onChange={(e) => setOrderPaymentMethod(e.target.value)}
                          placeholder="e.g., Credit Card, Insurance"
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Payment Date</Label>
                        <DateInput
                          label=""
                          value={orderPaymentDate}
                          placeholder="Select payment date"
                          onChange={setOrderPaymentDate}
                          id="order-payment-date"
                          className="w-full"
                        />
                      </div>
                    </div>

                    {/* Tracking Number - Full Width */}
                    <div className="space-y-2">
                      <Label>Tracking Number</Label>
                      <Input
                        value={orderTrackingNumber}
                        onChange={(e) => setOrderTrackingNumber(e.target.value)}
                        placeholder="Enter tracking number"
                        className="w-full"
                      />
                    </div>

                    {/* Shipped Date & Estimated Delivery - Two Column */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Shipped Date</Label>
                        <DateInput
                          label=""
                          value={orderShippedDate}
                          placeholder="Select shipped date"
                          onChange={setOrderShippedDate}
                          id="order-shipped-date"
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Estimated Delivery</Label>
                        <DateInput
                          label=""
                          value={orderEstimatedDelivery}
                          placeholder="Select estimated delivery"
                          onChange={setOrderEstimatedDelivery}
                          id="order-estimated-delivery"
                          className="w-full"
                        />
                      </div>
                    </div>

                    {/* Admin Notes - Full Width */}
                    <div className="space-y-2">
                      <Label>Admin Notes</Label>
                      <Textarea
                        value={orderAdminNotes}
                        onChange={(e) => setOrderAdminNotes(e.target.value)}
                        placeholder="Internal notes for this order..."
                        rows={3}
                      />
                    </div>

                    <div className="flex justify-end pt-4 pb-6">
                      <Button onClick={handleSaveOrder}>
                        Save Changes
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div>
                        <Label className="text-sm font-medium">Payment Status</Label>
                        <div className="mt-1">
                          <Badge variant={
                            selectedOrder.payment_status === 'paid' ? 'default' :
                            selectedOrder.payment_status === 'pending' ? 'secondary' :
                            selectedOrder.payment_status === 'failed' ? 'destructive' : 'outline'
                          }>
                            {selectedOrder.payment_status}
                          </Badge>
                        </div>
                      </div>
                      <Separator orientation="vertical" className="h-12" />
                      <div>
                        <Label className="text-sm font-medium">Fulfillment Status</Label>
                        <div className="mt-1">
                          <Badge variant={
                            selectedOrder.fulfillment_status === 'delivered' ? 'default' :
                            selectedOrder.fulfillment_status === 'shipped' ? 'secondary' :
                            selectedOrder.fulfillment_status === 'processing' ? 'outline' : 'outline'
                          }>
                            {selectedOrder.fulfillment_status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    {selectedOrder.payment_method && (
                      <div>
                        <Label className="text-sm font-medium">Payment Method</Label>
                        <p>{selectedOrder.payment_method}</p>
                      </div>
                    )}
                    
                    {selectedOrder.payment_date && (
                      <div>
                        <Label className="text-sm font-medium">Payment Date</Label>
                        <p>{new Date(selectedOrder.payment_date).toLocaleDateString()}</p>
                      </div>
                    )}
                    
                    {selectedOrder.tracking_number && (
                      <div>
                        <Label className="text-sm font-medium">Tracking Number</Label>
                        <p className="font-mono text-sm">{selectedOrder.tracking_number}</p>
                      </div>
                    )}
                    
                    {selectedOrder.shipped_date && (
                      <div>
                        <Label className="text-sm font-medium">Shipped Date</Label>
                        <p>{new Date(selectedOrder.shipped_date).toLocaleDateString()}</p>
                      </div>
                    )}
                    
                    {selectedOrder.estimated_delivery && (
                      <div>
                        <Label className="text-sm font-medium">Estimated Delivery</Label>
                        <p>{new Date(selectedOrder.estimated_delivery).toLocaleDateString()}</p>
                      </div>
                    )}
                    
                    {selectedOrder.admin_notes && (
                      <div>
                        <Label className="text-sm font-medium">Admin Notes</Label>
                        <p className="text-sm text-muted-foreground">{selectedOrder.admin_notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
            </div>
          </div>
        </div>
      )
    }

    if (activeSection === "Medications") {
      // Medications list view with vertical scrolling
      return (
        <div className="space-y-4">
          {medications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No medications found for this patient.
            </div>
          ) : (
            <div className="space-y-4">
              {medications.map((medication) => (
                <MedicationCard
                  key={medication.id}
                  medicationName={medication.name}
                  dosage={medication.dosage}
                  supply={medication.supply}
                  onClick={() => setSelectedMedication(medication)}
                  className="w-full max-w-none cursor-pointer"
                />
              ))}
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            Click on any medication card to view detailed payment and shipping information.
          </div>
        </div>
      )
    }

    if (activeSection === "Preferred Medications") {
      // Preferred medications list view
      return (
        <div className="space-y-4">
          {preferredMedications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No preferred medications found for this patient.
            </div>
          ) : (
            <div className="space-y-4">
              {preferredMedications.map((preference) => (
                <MedicationCard
                  key={preference.id}
                  medicationName={preference.medication_name}
                  dosage={preference.preferred_dosage}
                  supply={preference.frequency}
                  status={preference.status}
                  orderNumber={`REF-${preference.id.slice(0, 8)}`}
                  onClick={() => setSelectedPreference(preference)}
                  className="w-full max-w-none cursor-pointer"
                />
              ))}
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            Click on any preference card to view detailed information from the onboarding process.
          </div>
        </div>
      )
    }

    if (activeSection === "Orders") {
      // Medication orders list view
      return (
        <div className="space-y-4">
          {medicationOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No medication orders found for this patient.
            </div>
          ) : (
            <div className="space-y-4">
              {medicationOrders.map((order) => (
                <MedicationCard
                  key={order.id}
                  medicationName={order.medication_name}
                  dosage={order.dosage}
                  supply={`Qty: ${order.quantity}`}
                  status={order.fulfillment_status}
                  orderDate={new Date(order.created_at).toLocaleDateString()}
                  orderNumber={`REF-${order.id.slice(0, 8)}`}
                  onClick={() => setSelectedOrder(order)}
                  className="w-full max-w-none cursor-pointer"
                />
              ))}
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            Click on any order card to view detailed payment and fulfillment information.
          </div>
        </div>
      )
    }

    // Patient Information section (default)
    return (
      <div className="space-y-4">
        <div className="bg-muted/50 rounded-xl p-4">
          <h3 className="font-semibold mb-2">Basic Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Name:</span>
              <p>{formatName(patient.first_name, patient.last_name)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Date of Birth:</span>
              <p>{formatDate(patient.date_of_birth)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Email:</span>
              <p>{patient.email}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Phone:</span>
              <p>{patient.phone || "Not provided"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Patient ID:</span>
              <p>{patient.id.slice(0, 8)}...</p>
            </div>
            <div>
              <span className="text-muted-foreground">Intake Status:</span>
              <p>{getIntakeStatus(patient.has_completed_intake)}</p>
            </div>
          </div>
        </div>

        <div className="bg-muted/50 rounded-xl p-4">
          <h3 className="font-semibold mb-2">Treatment Information</h3>
          <div className="grid grid-cols-1 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Treatment Plan:</span>
              <p className="capitalize">{getTreatmentPlan()}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Primary Provider:</span>
              <p>{getPrimaryProvider()}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Member Since:</span>
              <p>{formatDate(patient.created_at)}</p>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="bg-muted/50 rounded-xl p-4">
            <h3 className="font-semibold mb-2">Admin Actions</h3>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline">Admin View</Badge>
              <Badge variant="secondary">Full Access</Badge>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={`overflow-hidden p-0 bg-card ${
          isFullscreen 
            ? "w-[calc(100vw-16px)] h-[calc(100vh-16px)] max-w-none max-h-none" 
            : "md:max-h-[500px] md:max-w-[700px] lg:max-w-[800px]"
        }`}
      >
        <DialogTitle className="sr-only">
          Patient Information - {isAdmin ? 'Admin' : 'Provider'} View
        </DialogTitle>
        <DialogDescription className="sr-only">
          View and manage patient information from {isAdmin ? 'admin' : 'provider'} perspective.
        </DialogDescription>
        <SidebarProvider className="items-start h-full">
          <Sidebar 
            collapsible="none" 
            className="hidden md:flex w-64 border-r border-sidebar-border dark:border-transparent"
          >
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {patientNavData.nav.map((item) => (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton
                          asChild
                          isActive={item.name === activeSection}
                        >
                          <a 
                            href="#" 
                            onClick={(e) => {
                              e.preventDefault()
                              setActiveSection(item.name)
                              setSelectedMedication(null)
                              setSelectedPreference(null)
                              setSelectedOrder(null)
                            }}
                          >
                            <item.icon />
                            <span>{item.name}</span>
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
          <main 
            className="flex flex-1 flex-col overflow-hidden bg-card h-full"
          >
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
              <div className="flex items-center gap-2 px-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                >
                  {isFullscreen ? (
                    <Minimize className="h-4 w-4" />
                  ) : (
                    <Maximize className="h-4 w-4" />
                  )}
                </Button>
                {getCurrentBreadcrumb()}
              </div>
            </header>
            <div className="flex flex-col gap-4 p-4 pt-0 flex-1 overflow-hidden">
              {renderContent()}
            </div>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  )
}