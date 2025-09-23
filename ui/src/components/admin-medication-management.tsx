import * as React from "react"
import { ArrowLeft, Calendar, Package, Truck } from "lucide-react"
import { Button } from "./button"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { Input } from "./input"
import { Label } from "./label"
import { MedicationCard } from "./medication-card"
import { Separator } from "./separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./breadcrumb"

export interface PatientMedication {
  id: string
  name: string
  dosage: string
  supply: string
  status: 'active' | 'pending' | 'shipped' | 'delivered'
  lastPaymentDate?: string
  shippedToPharmacyDate?: string
  trackingNumber?: string
}

export interface AdminMedicationManagementProps {
  patientName: string
  medications: PatientMedication[]
  onBack?: () => void
  onMedicationUpdate?: (medicationId: string, updates: Partial<PatientMedication>) => void
}

export function AdminMedicationManagement({
  patientName,
  medications,
  onBack,
  onMedicationUpdate
}: AdminMedicationManagementProps) {
  const [selectedMedication, setSelectedMedication] = React.useState<PatientMedication | null>(null)
  const [paymentDate, setPaymentDate] = React.useState("")
  const [shippedDate, setShippedDate] = React.useState("")
  const [trackingNumber, setTrackingNumber] = React.useState("")

  // Load selected medication data when changed
  React.useEffect(() => {
    if (selectedMedication) {
      setPaymentDate(selectedMedication.lastPaymentDate || "")
      setShippedDate(selectedMedication.shippedToPharmacyDate || "")
      setTrackingNumber(selectedMedication.trackingNumber || "")
    }
  }, [selectedMedication])

  const handleSave = () => {
    if (selectedMedication && onMedicationUpdate) {
      onMedicationUpdate(selectedMedication.id, {
        lastPaymentDate: paymentDate,
        shippedToPharmacyDate: shippedDate,
        trackingNumber: trackingNumber
      })
    }
  }

  const handleBackToList = () => {
    setSelectedMedication(null)
    setPaymentDate("")
    setShippedDate("")
    setTrackingNumber("")
  }

  if (selectedMedication) {
    // Detail view for selected medication
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink 
                  onClick={onBack} 
                  className="cursor-pointer"
                >
                  Patient Information
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink 
                  onClick={handleBackToList}
                  className="cursor-pointer"
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

          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBackToList}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-2xl font-bold">
              {selectedMedication.name} Management
            </h2>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Medication Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
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
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Payment & Shipping
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="payment-date" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Most Recent Medication Payment
                </Label>
                <Input
                  id="payment-date"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shipped-date" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Medication Shipped to Pharmacy
                </Label>
                <Input
                  id="shipped-date"
                  type="date"
                  value={shippedDate}
                  onChange={(e) => setShippedDate(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tracking-number" className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
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

              <Button onClick={handleSave} className="w-full">
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // List view - horizontal scrolling medications
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink 
                onClick={onBack} 
                className="cursor-pointer"
              >
                Patient Information
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Medications</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="h-8 w-8 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold">
            {patientName}'s Medications
          </h2>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Medications</CardTitle>
        </CardHeader>
        <CardContent>
          {medications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No medications found for this patient.
            </div>
          ) : (
            <div className="relative">
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {medications.map((medication) => (
                  <div key={medication.id} className="flex-shrink-0">
                    <MedicationCard
                      medicationName={medication.name}
                      dosage={medication.dosage}
                      supply={medication.supply}
                      onClick={() => setSelectedMedication(medication)}
                      className="w-64 cursor-pointer hover:shadow-lg transition-shadow"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground">
        Click on any medication card to view detailed payment and shipping information.
      </div>
    </div>
  )
}