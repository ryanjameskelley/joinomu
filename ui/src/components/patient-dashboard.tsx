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
import { MedicationCard } from "./medication-card"
import { Button } from "./button"

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
  onNavigate,
  // Simple card data for post-onboarding
  realMedicationData,
  realAppointmentData,
  onEditMedication,
  onEditAppointment,
  onAddMedication
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
  // Simple card data for post-onboarding - support multiple medications
  realMedicationData?: {
    id: string
    medicationId?: string
    name: string
    dosage: string
    supply: string
    status: 'pending' | 'approved' | 'denied'
    estimatedDelivery?: string
  }[]
  realAppointmentData?: {
    id: string
    doctorName: string
    visitType: string
    dateTime: string
    status: 'scheduled' | 'confirmed' | 'pending'
    appointmentDate: string
    startTime: string
    providerId: string
    treatmentType: string
    appointmentType: string
  }[]
  onEditMedication?: (medicationId?: string) => void
  onEditAppointment?: (appointmentId?: string) => void
  onAddMedication?: () => void
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
                {/* Onboarded patient view with simple cards */}
                <div className="space-y-6 w-full">
                  {/* Debug info */}
                  {(() => {
                    console.log('🔍 UI Debug - realMedicationData:', realMedicationData)
                    console.log('🔍 UI Debug - realMedicationData.length:', realMedicationData?.length)
                    console.log('🔍 UI Debug - realAppointmentData:', realAppointmentData)
                    console.log('🔍 UI Debug - medications:', medications)
                    console.log('🔍 UI Debug - visits:', visits)
                    console.log('🔍 UI Debug - appointment:', appointment)
                    console.log('🔍 UI Debug - Condition check (realMedicationData?.length > 0):', realMedicationData?.length > 0)
                    console.log('🔍 UI Debug - Condition check (medications && medications.length > 0):', medications && medications.length > 0)
                    return null
                  })()}
                  
                  {/* Medication Cards Section */}
                  {(realMedicationData?.length > 0 || (medications && medications.length > 0)) && (
                    <div className="space-y-4 w-full">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Medications</h2>
                        {onAddMedication && (
                          <Button
                            variant="link"
                            onClick={onAddMedication}
                            className="text-base font-medium p-0 h-auto"
                          >
                            Add Medication
                          </Button>
                        )}
                      </div>
                      {/* Display multiple real medication cards */}
                      {realMedicationData?.map((medication) => (
                        <MedicationCard
                          key={medication.id}
                          medicationName={medication.name}
                          dosage={medication.dosage}
                          supply={medication.supply}
                          status={medication.status}
                          estimatedDelivery={medication.estimatedDelivery}
                          onTitleClick={() => onEditMedication?.(medication.id)}
                          className="w-full"
                        />
                      ))}
                      {/* Show legacy medications if available */}
                      {medications && medications.map((med, index) => (
                        <MedicationCard
                          key={`med-${index}`}
                          medicationName={med.name}
                          dosage={med.dosage}
                          supply="30 day supply"
                          status={med.status}
                          onTitleClick={() => onEditMedication?.()}
                          className="w-full"
                        />
                      ))}
                    </div>
                  )}
                  
                  {/* Add Medication Section when no medications exist */}
                  {!realMedicationData?.length && (!medications || medications.length === 0) && onAddMedication && (
                    <div className="space-y-4 w-full">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Medications</h2>
                        <Button
                          variant="link"
                          onClick={onAddMedication}
                          className="text-base font-medium p-0 h-auto"
                        >
                          Add Medication
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Visit/Appointment Cards Section */}
                  {(realAppointmentData?.length || visits?.length || appointment) && (
                    <div className="space-y-4 w-full">
                      <h2 className="text-lg font-semibold">Your Scheduled Visits</h2>
                      {/* Display all real appointment data */}
                      {realAppointmentData?.map((appointment) => (
                        <MedicationCard
                          key={appointment.id}
                          medicationName={appointment.doctorName}
                          dosage={appointment.visitType}
                          supply={appointment.dateTime}
                          status={appointment.status}
                          onTitleClick={() => onEditAppointment?.(appointment.id)}
                          className="w-full"
                        />
                      ))}
                      {/* Show multiple visits if available */}
                      {visits && visits.map((visit, index) => (
                        <MedicationCard
                          key={`visit-${index}`}
                          medicationName={visit.doctorName}
                          dosage={visit.type}
                          supply={`${visit.date} at ${visit.time}`}
                          status={visit.status}
                          onTitleClick={onEditAppointment}
                          className="w-full"
                        />
                      ))}
                      {/* Fallback single appointment */}
                      {appointment && !visits && (
                        <MedicationCard
                          medicationName={appointment.doctorName}
                          dosage={appointment.type}
                          supply={`${appointment.date} at ${appointment.time}`}
                          status={appointment.status}
                          onTitleClick={onEditAppointment}
                          className="w-full"
                        />
                      )}
                    </div>
                  )}
                </div>
                
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