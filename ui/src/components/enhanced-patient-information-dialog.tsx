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
import { MedicationToast, dismissToast } from './toast'
import type { Patient } from './patient-table'

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
    { name: "Patient Information", icon: User },
    { name: "Medications", icon: Pill },
    { name: "Tracking", icon: Activity },
  ],
}

export interface EnhancedPatientInformationDialogProps {
  patient: Patient | null
  medications?: PatientMedication[]
  open: boolean
  onOpenChange: (open: boolean) => void
  isAdmin?: boolean
  onMedicationUpdate?: (medicationId: string, updates: Partial<PatientMedication>) => void
  initialSection?: string
}

export function EnhancedPatientInformationDialog({
  patient,
  medications = [],
  open,
  onOpenChange,
  isAdmin = false,
  onMedicationUpdate,
  initialSection = "Patient Information"
}: EnhancedPatientInformationDialogProps) {
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [activeSection, setActiveSection] = React.useState(initialSection)
  const [selectedMedication, setSelectedMedication] = React.useState<PatientMedication | null>(null)
  const [paymentDate, setPaymentDate] = React.useState("")
  const [sentToPharmacyDate, setSentToPharmacyDate] = React.useState("")
  const [shippedDate, setShippedDate] = React.useState("")
  const [trackingNumber, setTrackingNumber] = React.useState("")

  // Load selected medication data when changed
  React.useEffect(() => {
    if (selectedMedication) {
      setPaymentDate(selectedMedication.lastPaymentDate || "")
      setSentToPharmacyDate(selectedMedication.sentToPharmacyDate || "")
      setShippedDate(selectedMedication.shippedToPharmacyDate || "")
      setTrackingNumber(selectedMedication.trackingNumber || "")
    }
  }, [selectedMedication])

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
        savingToastId = MedicationToast.saving(selectedMedication.name)
        
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
        MedicationToast.saved(selectedMedication.name)
        
      } catch (error) {
        // Dismiss the saving toast
        if (savingToastId) {
          dismissToast(savingToastId)
        }
        
        // Show error toast
        MedicationToast.error(selectedMedication.name, error instanceof Error ? error.message : 'Unknown error')
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
                onClick={() => setActiveSection("Patient Information")}
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

    if (activeSection === "Medications") {
      // Medications list view with vertical scrolling
      return (
        <div className="space-y-4">
          {medications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No medications found for this patient.
            </div>
          ) : (
            <div className="space-y-4 max-h-80 overflow-y-auto overflow-x-visible p-2 -m-2">
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
      <DialogContent className={`overflow-hidden p-0 ${
        isFullscreen 
          ? "w-[calc(100vw-16px)] h-[calc(100vh-16px)] max-w-none max-h-none" 
          : "md:max-h-[500px] md:max-w-[700px] lg:max-w-[800px]"
      }`}>
        <DialogTitle className="sr-only">
          Patient Information - {isAdmin ? 'Admin' : 'Provider'} View
        </DialogTitle>
        <DialogDescription className="sr-only">
          View and manage patient information from {isAdmin ? 'admin' : 'provider'} perspective.
        </DialogDescription>
        <SidebarProvider className="items-start">
          <Sidebar collapsible="none" className="hidden md:flex">
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
          <main className={`flex flex-1 flex-col overflow-hidden ${
            isFullscreen ? "h-full" : "h-[480px]"
          }`}>
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
            <div className="flex flex-1 flex-col gap-4 overflow-visible p-4 pt-0">
              {renderContent()}
            </div>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  )
}