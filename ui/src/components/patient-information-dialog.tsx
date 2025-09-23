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
import type { Patient } from './patient-table'

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
}

export function PatientInformationDialog({
  patient,
  open,
  onOpenChange,
  isAdmin = false,
}: PatientInformationDialogProps) {
  const [isFullscreen, setIsFullscreen] = React.useState(false)

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
                          isActive={item.name === "Patient Information"}
                        >
                          <a href="#">
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