"use client"

import * as React from "react"
import { AppSidebar } from "./app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "./breadcrumb"
import { Separator } from "./separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "./sidebar"
import { PatientChecklist, type ChecklistItem } from "./patient-checklist"
import { OnboardedPatientDashboard, type MedicationInfo, type VisitInfo, type AppointmentInfo } from "./onboarded-patient-dashboard"

export function PatientDashboard({
  user,
  onLogout,
  checklistItems,
  onChecklistItemClick,
  isOnboarded = false,
  medications,
  visits,
  appointment,
  selectedCategory,
  onCategoryChange,
  onRescheduleVisit,
  onRescheduleAppointment,
  onMedicationAction,
  showAverageResults,
  paymentRequired,
  paymentDueDate,
  activeItem = "Dashboard",
  onNavigate
}: {
  user?: {
    name: string
    email: string
    avatar?: string
  }
  onLogout?: () => void
  checklistItems?: ChecklistItem[]
  onChecklistItemClick?: (item: ChecklistItem) => void
  isOnboarded?: boolean
  medications?: MedicationInfo[]
  visits?: VisitInfo[]
  appointment?: AppointmentInfo
  selectedCategory?: 'weightloss' | 'mens-health' | 'all'
  onCategoryChange?: (category: 'weightloss' | 'mens-health' | 'all') => void
  onRescheduleVisit?: (visit: VisitInfo) => void
  onRescheduleAppointment?: () => void
  onMedicationAction?: () => void
  showAverageResults?: boolean
  paymentRequired?: boolean
  paymentDueDate?: string
  activeItem?: string
  onNavigate?: (item: string) => void
}) {
  return (
    <SidebarProvider>
        <AppSidebar user={user} onLogout={onLogout} onNavigate={onNavigate} />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage>Dashboard</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            {!isOnboarded && checklistItems ? (
              <div className="flex justify-center">
                <PatientChecklist 
                  items={checklistItems}
                  onItemClick={onChecklistItemClick}
                />
              </div>
            ) : (
              <>
                {/* Onboarded patient view */}
                {(medications?.length || visits?.length || appointment) && (
                  <OnboardedPatientDashboard
                    variant="both"
                    medications={medications}
                    visits={visits}
                    appointment={appointment}
                    selectedCategory={selectedCategory}
                    onCategoryChange={onCategoryChange}
                    onRescheduleVisit={onRescheduleVisit}
                    onRescheduleAppointment={onRescheduleAppointment}
                    onMedicationAction={onMedicationAction}
                    showAverageResults={showAverageResults}
                    paymentRequired={paymentRequired}
                    paymentDueDate={paymentDueDate}
                  />
                )}
                
                {/* Additional dashboard content */}
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                  <div className="bg-muted/50 aspect-video rounded-xl" />
                  <div className="bg-muted/50 aspect-video rounded-xl" />
                  <div className="bg-muted/50 aspect-video rounded-xl" />
                </div>
                <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min" />
              </>
            )}
          </div>
        </SidebarInset>
    </SidebarProvider>
  )
}