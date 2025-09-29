import * as React from 'react'
import {
  User,
  Pill,
  Activity,
  Maximize,
  Minimize,
  Edit,
  Check,
  X,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from './dialog'
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
import { Input } from './input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import type { Patient } from './patient-table'

interface MedicationPreference {
  id: string
  medication_id: string
  medication_name?: string
  preferred_dosage: string
  frequency?: string
  notes?: string
  status: 'pending' | 'approved' | 'denied'
  requested_date: string
}

const patientNavData = {
  nav: [
    { name: "Patient Information", icon: User },
    { name: "Medications", icon: Pill },
    { name: "Tracking", icon: Activity },
  ],
}

export interface PatientInformationDialogProps {
  patient: Patient | null
  open: boolean
  onOpenChange: (open: boolean) => void
  isAdmin?: boolean
  medicationPreferences?: MedicationPreference[]
  onUpdateMedicationStatus?: (prefId: string, status: 'approved' | 'denied') => Promise<void>
  onUpdateMedication?: (prefId: string, updates: Partial<MedicationPreference>) => Promise<void>
}

export function PatientInformationDialog({
  patient,
  open,
  onOpenChange,
  isAdmin = false,
  medicationPreferences = [],
  onUpdateMedicationStatus,
  onUpdateMedication,
}: PatientInformationDialogProps) {
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [activeSection, setActiveSection] = React.useState("Patient Information")
  const [editingMedication, setEditingMedication] = React.useState<string | null>(null)
  const [editForm, setEditForm] = React.useState<Partial<MedicationPreference>>({})

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

  const handleEditMedication = (medication: MedicationPreference) => {
    setEditingMedication(medication.id)
    setEditForm({
      preferred_dosage: medication.preferred_dosage,
      frequency: medication.frequency || '',
      notes: medication.notes || '',
      status: medication.status
    })
  }

  const handleSaveMedication = async (medicationId: string) => {
    if (onUpdateMedication && editForm) {
      try {
        await onUpdateMedication(medicationId, editForm)
        setEditingMedication(null)
        setEditForm({})
      } catch (error) {
        console.error('Error updating medication:', error)
      }
    }
  }

  const handleCancelEdit = () => {
    setEditingMedication(null)
    setEditForm({})
  }

  const handleStatusUpdate = async (medicationId: string, status: 'approved' | 'denied') => {
    if (onUpdateMedicationStatus) {
      try {
        await onUpdateMedicationStatus(medicationId, status)
      } catch (error) {
        console.error('Error updating medication status:', error)
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'denied': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const renderMedicationsSection = () => {
    if (medicationPreferences.length === 0) {
      return (
        <div className="bg-muted/50 rounded-xl p-4">
          <h3 className="font-semibold mb-2">Medication Preferences</h3>
          <p className="text-sm text-muted-foreground">No medication preferences found.</p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <div className="bg-muted/50 rounded-xl p-4">
          <h3 className="font-semibold mb-4">Medication Preferences</h3>
          <div className="space-y-4">
            {medicationPreferences.map((medication) => (
              <div key={medication.id} className="border rounded-lg p-4 bg-background">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium">{medication.medication_name || 'Unknown Medication'}</h4>
                    <Badge variant="outline" className={getStatusColor(medication.status)}>
                      {medication.status.charAt(0).toUpperCase() + medication.status.slice(1)}
                    </Badge>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-2">
                      {editingMedication === medication.id ? (
                        <>
                          <Button size="sm" onClick={() => handleSaveMedication(medication.id)} className="h-8 w-8 p-0">
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancelEdit} className="h-8 w-8 p-0">
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleEditMedication(medication)} className="h-8 w-8 p-0">
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                  <div>
                    <span className="text-muted-foreground">Dosage:</span>
                    {editingMedication === medication.id ? (
                      <Input
                        value={editForm.preferred_dosage || ''}
                        onChange={(e) => setEditForm({...editForm, preferred_dosage: e.target.value})}
                        className="mt-1 h-8"
                      />
                    ) : (
                      <p>{medication.preferred_dosage}</p>
                    )}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Frequency:</span>
                    {editingMedication === medication.id ? (
                      <Input
                        value={editForm.frequency || ''}
                        onChange={(e) => setEditForm({...editForm, frequency: e.target.value})}
                        className="mt-1 h-8"
                        placeholder="e.g., weekly, daily"
                      />
                    ) : (
                      <p>{medication.frequency || 'Not specified'}</p>
                    )}
                  </div>
                </div>
                
                {(medication.notes || editingMedication === medication.id) && (
                  <div className="mt-3">
                    <span className="text-muted-foreground text-sm">Notes:</span>
                    {editingMedication === medication.id ? (
                      <Input
                        value={editForm.notes || ''}
                        onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                        className="mt-1 h-8"
                        placeholder="Additional notes..."
                      />
                    ) : (
                      <p className="text-sm mt-1">{medication.notes || 'No notes'}</p>
                    )}
                  </div>
                )}

                {isAdmin && medication.status === 'pending' && editingMedication !== medication.id && (
                  <div className="flex gap-2 mt-3">
                    <Button 
                      size="sm" 
                      onClick={() => handleStatusUpdate(medication.id, 'approved')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleStatusUpdate(medication.id, 'denied')}
                      className="border-red-200 text-red-600 hover:bg-red-50"
                    >
                      Deny
                    </Button>
                  </div>
                )}

                {isAdmin && editingMedication === medication.id && (
                  <div className="mt-3">
                    <span className="text-muted-foreground text-sm">Status:</span>
                    <Select
                      value={editForm.status || medication.status}
                      onValueChange={(value) => setEditForm({...editForm, status: value as 'pending' | 'approved' | 'denied'})}
                    >
                      <SelectTrigger className="mt-1 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="denied">Denied</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <p className="text-xs text-muted-foreground mt-2">
                  Requested: {new Date(medication.requested_date).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
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
                          isActive={item.name === activeSection}
                          onClick={() => setActiveSection(item.name)}
                        >
                          <item.icon />
                          <span>{item.name}</span>
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
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href="#">Patient Information</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Patient Information</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 pt-0">
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
                  <h3 className="font-semibold mb-2">Treatment Plan</h3>
                  <div className="text-sm space-y-2">
                    <div>
                      <span className="text-muted-foreground">Current Plan:</span>
                      <p className="capitalize">{getTreatmentPlan()}</p>
                    </div>
                    {patient.is_primary && (
                      <div>
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Primary Care Patient
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-muted/50 rounded-xl p-4">
                  <h3 className="font-semibold mb-2">Care Team</h3>
                  <div className="text-sm space-y-2">
                    <div>
                      <span className="text-muted-foreground">Primary Care Provider:</span>
                      <p>{getPrimaryProvider()}</p>
                    </div>
                    {patient.assigned_providers && patient.assigned_providers.length > 1 && (
                      <div>
                        <span className="text-muted-foreground">Additional Providers:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {patient.assigned_providers.slice(1).map((provider, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {provider}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {isAdmin && (
                  <div className="bg-muted/50 rounded-xl p-4">
                    <h3 className="font-semibold mb-2">Administrative</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Account Status:</span>
                        <p>Active</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Member Since:</span>
                        <p>{formatDate(patient.created_at)}</p>
                      </div>
                      {patient.assigned_date && (
                        <div>
                          <span className="text-muted-foreground">Assignment Date:</span>
                          <p>{formatDate(patient.assigned_date)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  )
}