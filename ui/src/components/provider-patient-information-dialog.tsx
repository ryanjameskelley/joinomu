"use client"

import * as React from "react"
import {
  User,
  Heart,
  Calendar,
  Pill,
  FileText,
  Settings,
  Phone,
  Mail,
  MapPin,
  Shield,
  Clock,
  Activity,
  Maximize,
  Minimize,
  Save,
} from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./breadcrumb"
import { Button } from "./button"
import { MedicationCard } from "./medication-card"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { Label } from "./label"
import { Input } from "./input"
import { Textarea } from "./textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./dialog"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "./sidebar"

export interface PatientMedicationPreference {
  id: string
  medication_name: string
  preferred_dosage: string
  frequency?: string
  status: 'pending' | 'approved' | 'denied' | 'discontinued'
  requested_date: string
  notes?: string
}

export interface ProviderPatientData {
  id: string
  name: string
  email: string
  dateOfBirth?: string
  gender?: string
  patientId?: string
  phone?: string
  address?: string
  treatmentType?: string
  assignedDate?: string
  isPrimary?: boolean
  medicationPreferences?: PatientMedicationPreference[]
}

interface ProviderPatientInformationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patient: ProviderPatientData | null
  onMedicationUpdate?: (medicationId: string, updates: {
    status?: string
    dosage?: string
    frequency?: string
    providerNotes?: string
  }) => Promise<void>
}

const patientNavData = {
  nav: [
    { name: "Patient Information", icon: User },
    { name: "Medications", icon: Pill },
    { name: "Tracking", icon: Activity },
  ],
}

export function ProviderPatientInformationDialog({
  open,
  onOpenChange,
  patient,
  onMedicationUpdate
}: ProviderPatientInformationDialogProps) {
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState("Patient Information")
  const [selectedMedication, setSelectedMedication] = React.useState<PatientMedicationPreference | null>(null)
  const [editedMedication, setEditedMedication] = React.useState<PatientMedicationPreference | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)
  
  if (!patient) return null

  const getStartDate = (medication: PatientMedicationPreference) => {
    if (medication.status === 'approved') {
      return 'Started'
    }
    if (medication.status === 'pending' || medication.status === 'denied') {
      return 'Not started'
    }
    return 'Not started'
  }

  const handleBackToMedications = () => {
    setSelectedMedication(null)
    setEditedMedication(null)
    setActiveTab("Medications")
  }

  const handleMedicationSelect = (medication: PatientMedicationPreference) => {
    setSelectedMedication(medication)
    setEditedMedication({...medication})
  }

  const handleSaveMedication = async () => {
    if (!editedMedication || !onMedicationUpdate) return
    
    setIsSaving(true)
    try {
      await onMedicationUpdate(editedMedication.id, {
        status: editedMedication.status,
        dosage: editedMedication.preferred_dosage,
        frequency: editedMedication.frequency,
        providerNotes: editedMedication.providerNotes
      })
      
      // Update the selected medication with the new data
      setSelectedMedication(editedMedication)
    } catch (error) {
      console.error('Error saving medication:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const hasChanges = editedMedication && selectedMedication && 
    (editedMedication.status !== selectedMedication.status ||
     editedMedication.preferred_dosage !== selectedMedication.preferred_dosage ||
     editedMedication.frequency !== selectedMedication.frequency ||
     editedMedication.providerNotes !== selectedMedication.providerNotes)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`overflow-hidden p-0 bg-card ${
        isFullscreen 
          ? "w-[calc(100vw-16px)] h-[calc(100vh-16px)] max-w-none max-h-none" 
          : "md:max-h-[500px] md:max-w-[700px] lg:max-w-[800px]"
      }`}>
        <DialogTitle className="sr-only">Patient Information - Provider View</DialogTitle>
        <DialogDescription className="sr-only">
          View and manage patient information here from provider perspective.
        </DialogDescription>
        <SidebarProvider className="items-start">
          <Sidebar collapsible="none" className="hidden md:flex w-64 border-r border-sidebar-border dark:border-transparent">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {patientNavData.nav.map((item) => (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton
                          asChild
                          isActive={activeTab === item.name}
                          onClick={() => setActiveTab(item.name)}
                        >
                          <button>
                            <item.icon />
                            <span>{item.name}</span>
                          </button>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
          <main className={`flex flex-1 flex-col overflow-hidden bg-card ${
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
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink 
                        href="#" 
                        onClick={() => {
                          setActiveTab("Patient Information")
                          setSelectedMedication(null)
                        }}
                      >
                        Patient Information
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    {selectedMedication ? (
                      <>
                        <BreadcrumbItem>
                          <BreadcrumbLink href="#" onClick={handleBackToMedications}>
                            Medications
                          </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                          <BreadcrumbPage>{selectedMedication.medication_name}</BreadcrumbPage>
                        </BreadcrumbItem>
                      </>
                    ) : (
                      <BreadcrumbItem>
                        <BreadcrumbPage>{activeTab}</BreadcrumbPage>
                      </BreadcrumbItem>
                    )}
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 pt-0">
              {activeTab === "Patient Information" && (
                <div className="space-y-4">
                  <div className="bg-muted/50 rounded-xl p-4">
                    <h3 className="font-semibold mb-2">Basic Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Name:</span>
                        <p>{patient.name}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Email:</span>
                        <p>{patient.email}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Date of Birth:</span>
                        <p>{patient.dateOfBirth || 'Not provided'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Patient ID:</span>
                        <p>{patient.patientId || patient.id}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Phone:</span>
                        <p>{patient.phone || 'Not provided'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Gender:</span>
                        <p>{patient.gender || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-xl p-4">
                    <h3 className="font-semibold mb-2">Treatment Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Treatment Type:</span>
                        <p>{patient.treatmentType || 'General Care'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Assigned Date:</span>
                        <p>{patient.assignedDate || 'Not specified'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Primary Provider:</span>
                        <p>{patient.isPrimary ? 'Yes' : 'No'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Status:</span>
                        <p>Active</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "Medications" && (
                <div className="space-y-4">
                  {selectedMedication && editedMedication ? (
                    // Editable medication detail view within Medications tab
                    <div className="space-y-4">
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                          <CardTitle>Medication Details</CardTitle>
                          {hasChanges && (
                            <Button 
                              onClick={handleSaveMedication}
                              disabled={isSaving}
                              size="sm"
                              className="gap-2"
                            >
                              <Save className="h-4 w-4" />
                              {isSaving ? 'Saving...' : 'Save Changes'}
                            </Button>
                          )}
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium">Medication Name</Label>
                              <p className="text-lg font-semibold">{selectedMedication.medication_name}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Status</Label>
                              <Select 
                                value={editedMedication.status} 
                                onValueChange={(value) => setEditedMedication(prev => 
                                  prev ? {...prev, status: value as PatientMedicationPreference['status']} : null
                                )}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="approved">Approved</SelectItem>
                                  <SelectItem value="denied">Denied</SelectItem>
                                  <SelectItem value="discontinued">Discontinued</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Dosage</Label>
                              <Input
                                value={editedMedication.preferred_dosage}
                                onChange={(e) => setEditedMedication(prev => 
                                  prev ? {...prev, preferred_dosage: e.target.value} : null
                                )}
                                placeholder="Enter dosage"
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Frequency</Label>
                              <Input
                                value={editedMedication.frequency || ''}
                                onChange={(e) => setEditedMedication(prev => 
                                  prev ? {...prev, frequency: e.target.value} : null
                                )}
                                placeholder="Enter frequency"
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Requested Date</Label>
                              <p>{new Date(selectedMedication.requested_date).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Start Date</Label>
                              <p>{getStartDate(selectedMedication)}</p>
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Provider Notes</Label>
                            <Textarea
                              value={editedMedication.providerNotes || ''}
                              onChange={(e) => setEditedMedication(prev => 
                                prev ? {...prev, providerNotes: e.target.value} : null
                              )}
                              placeholder="Add provider notes..."
                              rows={3}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    // Medication list view
                    <div className="bg-muted/50 rounded-xl p-4">
                      <h3 className="font-semibold mb-4">Patient Medication Preferences</h3>
                      {!patient.medicationPreferences || patient.medicationPreferences.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No medication preferences found for this patient.</p>
                      ) : (
                        <div className="space-y-4">
                          {patient.medicationPreferences.map((medication) => (
                            <MedicationCard
                              key={medication.id}
                              medicationName={medication.medication_name}
                              dosage={medication.preferred_dosage}
                              supply={medication.frequency || 'As needed'}
                              status={medication.status}
                              onClick={() => handleMedicationSelect(medication)}
                              className="w-full max-w-none cursor-pointer"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "Tracking" && (
                <div className="space-y-4">
                  <div className="bg-muted/50 rounded-xl p-4">
                    <h3 className="font-semibold mb-2">Health Tracking</h3>
                    <p className="text-sm text-muted-foreground">No tracking data available for this patient.</p>
                  </div>
                </div>
              )}
            </div>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  )
}