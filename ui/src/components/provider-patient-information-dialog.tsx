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
}

interface ProviderPatientInformationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patient: ProviderPatientData | null
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
  patient
}: ProviderPatientInformationDialogProps) {
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState("Patient Information")
  
  if (!patient) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`overflow-hidden p-0 ${
        isFullscreen 
          ? "w-[calc(100vw-16px)] h-[calc(100vh-16px)] max-w-none max-h-none" 
          : "md:max-h-[500px] md:max-w-[700px] lg:max-w-[800px]"
      }`}>
        <DialogTitle className="sr-only">Patient Information - Provider View</DialogTitle>
        <DialogDescription className="sr-only">
          View and manage patient information here from provider perspective.
        </DialogDescription>
        <SidebarProvider className="items-start">
          <Sidebar collapsible="none" className="hidden md:flex w-64 border-r border-sidebar-border dark:border-transparent bg-[--dialog-bg] dark:bg-[#242424]">
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
          <main className={`flex flex-1 flex-col overflow-hidden dark:bg-[#242424] ${
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
                      <BreadcrumbPage>{activeTab}</BreadcrumbPage>
                    </BreadcrumbItem>
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
                  <div className="bg-muted/50 rounded-xl p-4">
                    <h3 className="font-semibold mb-2">Current Medications</h3>
                    <p className="text-sm text-muted-foreground">No medications currently prescribed for this patient.</p>
                  </div>
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