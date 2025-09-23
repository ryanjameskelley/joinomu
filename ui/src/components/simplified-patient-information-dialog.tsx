import * as React from 'react'
import {
  User,
  Pill,
  Activity,
  Maximize,
  Minimize,
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
import { Badge } from './badge'
import { Separator } from './separator'
import type { Patient } from './patient-table'

const patientNavData = [
  { name: "Patient Information", icon: User },
  { name: "Medications", icon: Pill },
  { name: "Tracking", icon: Activity },
]

export interface SimplifiedPatientInformationDialogProps {
  patient: Patient | null
  open: boolean
  onOpenChange: (open: boolean) => void
  isAdmin?: boolean
}

export function SimplifiedPatientInformationDialog({
  patient,
  open,
  onOpenChange,
  isAdmin = false,
}: SimplifiedPatientInformationDialogProps) {
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState("Patient Information")

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

  const formatName = (first_name?: string, last_name?: string) => {
    return `${first_name || ''} ${last_name || ''}`.trim() || "Unknown Patient"
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
    if (patient?.treatment_type) {
      return patient.treatment_type.replace('_', ' ')
    }
    if (patient?.treatment_types && patient.treatment_types.length > 0) {
      return patient.treatment_types.join(', ').replace(/_/g, ' ')
    }
    return "No active treatment plan"
  }

  const getPrimaryProvider = () => {
    if (patient?.assigned_providers && patient.assigned_providers.length > 0) {
      return patient.assigned_providers[0]
    }
    return "No provider assigned"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`overflow-hidden p-0 ${
        isFullscreen 
          ? "w-[calc(100vw-16px)] h-[calc(100vh-16px)] max-w-none max-h-none" 
          : "md:max-h-[600px] md:max-w-[900px] lg:max-w-[1000px]"
      }`}>
        <DialogTitle className="sr-only">
          Patient Information - {isAdmin ? 'Admin' : 'Provider'} View
        </DialogTitle>
        <DialogDescription className="sr-only">
          View and manage patient information from {isAdmin ? 'admin' : 'provider'} perspective.
        </DialogDescription>
        
        <div className="flex h-full">
          {/* Simplified Navigation Sidebar */}
          <div className="hidden md:flex w-64 border-r border-sidebar-border dark:border-transparent bg-[--dialog-bg] dark:bg-[#242424]">
            <div className="flex flex-col w-full">
              <div className="p-4 border-b border-sidebar-border dark:border-transparent">
                <h4 className="font-semibold text-sm text-sidebar-foreground/70 uppercase tracking-wide">
                  Patient Details
                </h4>
              </div>
              <nav className="flex-1 p-2">
                <div className="space-y-1">
                  {patientNavData.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => setActiveTab(item.name)}
                      className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                        activeTab === item.name
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </button>
                  ))}
                </div>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex flex-1 flex-col dark:bg-[#242424]">
            {/* Header */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border dark:border-transparent px-4">
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
              <Separator orientation="vertical" className="h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="#">Patients</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{activeTab}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </header>

            {/* Content Area */}
            <div className={`flex flex-1 flex-col gap-4 overflow-y-auto p-6 ${
              isFullscreen ? "h-full" : "h-[520px]"
            }`}>
              {activeTab === "Patient Information" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">
                      {formatName(patient?.first_name, patient?.last_name)}
                    </h2>
                    <p className="text-muted-foreground">Patient Information Overview</p>
                  </div>

                  <div className="grid gap-6">
                    <div className="bg-muted/50 rounded-xl p-6">
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Basic Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Full Name:</span>
                          <p className="font-medium">{formatName(patient?.first_name, patient?.last_name)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Date of Birth:</span>
                          <p className="font-medium">{formatDate(patient?.date_of_birth)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Email:</span>
                          <p className="font-medium">{patient?.email || "Not provided"}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Phone:</span>
                          <p className="font-medium">{patient?.phone || "Not provided"}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Patient ID:</span>
                          <p className="font-medium font-mono">
                            {patient?.id && typeof patient.id === 'string' && patient.id.length > 8 
                              ? patient.id.slice(0, 8) + '...' 
                              : patient?.id || 'Unknown'}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Intake Status:</span>
                          <Badge variant={patient?.has_completed_intake ? "default" : "secondary"} className="ml-2">
                            {getIntakeStatus(patient?.has_completed_intake)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-muted/50 rounded-xl p-6">
                      <h3 className="font-semibold mb-4">Treatment Plan</h3>
                      <div className="text-sm space-y-3">
                        <div>
                          <span className="text-muted-foreground">Current Plan:</span>
                          <p className="font-medium capitalize">{getTreatmentPlan()}</p>
                        </div>
                        {patient?.is_primary && (
                          <div>
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              Primary Care Patient
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-muted/50 rounded-xl p-6">
                      <h3 className="font-semibold mb-4">Care Team</h3>
                      <div className="text-sm space-y-3">
                        <div>
                          <span className="text-muted-foreground">Primary Care Provider:</span>
                          <p className="font-medium">{getPrimaryProvider()}</p>
                        </div>
                        {patient?.assigned_providers && patient.assigned_providers.length > 1 && (
                          <div>
                            <span className="text-muted-foreground">Additional Providers:</span>
                            <div className="flex flex-wrap gap-2 mt-2">
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
                      <div className="bg-muted/50 rounded-xl p-6">
                        <h3 className="font-semibold mb-4">Administrative</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Account Status:</span>
                            <p className="font-medium">Active</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Member Since:</span>
                            <p className="font-medium">{formatDate(patient?.created_at)}</p>
                          </div>
                          {patient?.assigned_date && (
                            <div>
                              <span className="text-muted-foreground">Assignment Date:</span>
                              <p className="font-medium">{formatDate(patient.assigned_date)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "Medications" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Medications</h2>
                    <p className="text-muted-foreground">Current and past medications for {formatName(patient?.first_name, patient?.last_name)}</p>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-6">
                    <p className="text-muted-foreground text-center py-8">
                      Medication management coming soon...
                    </p>
                  </div>
                </div>
              )}

              {activeTab === "Tracking" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Health Tracking</h2>
                    <p className="text-muted-foreground">Progress tracking and health metrics for {formatName(patient?.first_name, patient?.last_name)}</p>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-6">
                    <p className="text-muted-foreground text-center py-8">
                      Health tracking dashboard coming soon...
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}