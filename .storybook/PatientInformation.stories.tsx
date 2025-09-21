import type { Meta, StoryObj } from '@storybook/react'
import * as React from 'react'
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
} from 'lucide-react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../ui/src/components/breadcrumb'
import { Button } from '../ui/src/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '../ui/src/components/dialog'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '../ui/src/components/sidebar'

const patientNavData = {
  nav: [
    { name: "Patient Information", icon: User },
    { name: "Medications", icon: Pill },
    { name: "Tracking", icon: Activity },
  ],
}

function PatientInformationDialog() {
  const [open, setOpen] = React.useState(true)
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">View Patient Information (Admin)</Button>
      </DialogTrigger>
      <DialogContent className={`overflow-hidden p-0 ${
        isFullscreen 
          ? "w-[calc(100vw-16px)] h-[calc(100vh-16px)] max-w-none max-h-none" 
          : "md:max-h-[500px] md:max-w-[700px] lg:max-w-[800px]"
      }`}>
        <DialogTitle className="sr-only">Patient Information - Admin View</DialogTitle>
        <DialogDescription className="sr-only">
          View and manage patient information here from admin perspective.
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
                      <p>Sarah Johnson</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Date of Birth:</span>
                      <p>March 15, 1985</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Gender:</span>
                      <p>Female</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Patient ID:</span>
                      <p>PAT-2024-001</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-muted/50 rounded-xl p-4">
                  <h3 className="font-semibold mb-2">Plan</h3>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Treatment Plan:</span>
                    <p>Weight Management Program</p>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-xl p-4">
                  <h3 className="font-semibold mb-2">Provider</h3>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Primary Care Provider:</span>
                    <p>Dr. Michael Chen</p>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-xl p-4">
                  <h3 className="font-semibold mb-2">Administrative</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Account Status:</span>
                      <p>Active</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Billing Status:</span>
                      <p>Current</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  )
}

const meta: Meta<typeof PatientInformationDialog> = {
  title: 'Atomic/Organisms/Patient Information/Admin',
  component: PatientInformationDialog,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Patient information dialog with sidebar navigation for admins to view and manage patient data with administrative controls.',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Information: Story = {
  render: () => (
    <div className="flex h-svh items-center justify-center">
      <PatientInformationDialog />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Admin view of patient information dialog with administrative controls, account status, and billing information.',
      },
    },
  },
}