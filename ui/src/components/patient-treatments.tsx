"use client"

import * as React from "react"
import { BarChartBig, BadgeCheck, Activity } from "lucide-react"
import { cn } from "../lib/utils"
import { Alert, AlertDescription, AlertTitle } from "./alert"
import { Button } from "./button"
import { Badge } from "./badge"
import { TrackingChart, type MedicationOption } from "./tracking-chart"
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

export interface TreatmentHistoryItem {
  medication: string
  dosage: string
  date: string
  time: string
}

export interface MonthlyHistory {
  month: string
  items: TreatmentHistoryItem[]
}

export interface HealthMetricsData {
  date: string
  value: number
  unit: string
}

export interface MedicationTrackingEntry {
  id: string
  medication_preference_id: string
  taken_date: string
  taken_time: string
  notes?: string
  medication_preference?: {
    medications?: {
      name: string
    }
  }
}

export interface PatientTreatmentsProps {
  user?: {
    name: string
    email: string
    avatar?: string
  }
  onLogout?: () => void
  onNavigate?: (item: string) => void
  nextShot: {
    medication: string
    dosage: string
    day: string
    time: string
    nextDueDate?: string
    buttonText?: string
    onStartTracking?: () => void
  } | null
  additionalMedications?: {
    medication: string
    dosage: string
    day: string
    time: string
    nextDueDate?: string
    buttonText?: string
    onStartTracking?: () => void
  }[]
  history: (MonthlyHistory & {
    items: (TreatmentHistoryItem & {
      onEdit?: () => void
    })[]
  })[]
  treatmentType: string
  className?: string
  medications?: MedicationOption[]
  selectedMedications?: string[]
  onMedicationSelectionChange?: (selected: string[]) => void
  onAddMetrics?: () => void
  healthMetricsData?: HealthMetricsData[]
  patientId?: string
  onRefreshMetrics?: (metricType?: string) => void
  onMetricChange?: (metricType: string) => void
  medicationTrackingEntries?: MedicationTrackingEntry[]
}

function TrackAlert({ 
  medication, 
  dosage, 
  day, 
  time,
  nextDueDate,
  buttonText,
  onStartTracking,
  medicationIndex
}: { 
  medication: string
  dosage: string
  day: string
  time: string
  nextDueDate?: string
  buttonText?: string
  onStartTracking?: () => void
  medicationIndex?: number
}) {
  // Positive affirmations for medications that haven't been started yet
  const getHealthAffirmation = (medicationIndex?: number): string => {
    const affirmations = [
      "Your health transformation begins with this first step",
      "Every dose brings you closer to your wellness goals", 
      "You're investing in a healthier, stronger you",
      "Small daily actions create extraordinary results",
      "Your commitment today shapes your tomorrow",
      "This is your moment to prioritize your wellbeing",
      "Consistency is your superpower for lasting change",
      "You have everything it takes to succeed",
      "Your body will thank you for this healthy choice",
      "Progress starts with a single, powerful decision",
      "You're writing a new chapter in your health story",
      "Trust yourself and embrace this positive change",
      "Each step forward is a victory worth celebrating",
      "Your dedication to health inspires greatness",
      "This medication is a tool for your transformation",
      "You're choosing to thrive, not just survive"
    ]
    
    // Use medication index if provided, otherwise fall back to medication name
    let index;
    if (typeof medicationIndex === 'number') {
      index = medicationIndex % affirmations.length;
    } else {
      // Use a more robust hash of medication name for consistency
      let hash = 0;
      for (let i = 0; i < medication.length; i++) {
        const char = medication.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      index = Math.abs(hash) % affirmations.length;
    }
    
    return affirmations[index]
  }

  const isFirstTime = buttonText === "Start Tracking"

  return (
    <Alert className="[&>div:last-child]:text-foreground flex items-center justify-between">
      <div className="flex items-start gap-3">
        <BarChartBig className="h-4 w-4 mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <AlertTitle className="mb-0">{medication}</AlertTitle>
            <Badge variant="secondary" className="text-xs">{dosage}</Badge>
          </div>
          <AlertDescription className="text-xs text-muted-foreground">
            {isFirstTime ? (
              <span className="italic">{getHealthAffirmation(medicationIndex)}</span>
            ) : nextDueDate ? (
              <span>Next: {new Date(nextDueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            ) : (
              <span>Take {day} {time}</span>
            )}
          </AlertDescription>
        </div>
      </div>
      <Button variant="outline" size="sm" className="ml-4 shrink-0" onClick={onStartTracking}>
        {buttonText || "Start Tracking"}
      </Button>
    </Alert>
  )
}

function MedicationTrackingAlert({ 
  medication, 
  dosage, 
  date, 
  time,
  onEdit
}: TreatmentHistoryItem & {
  onEdit?: () => void
}) {
  return (
    <Alert className="[&>div:last-child]:text-foreground flex items-center justify-between mb-3">
      <div className="flex items-start gap-3">
        <BadgeCheck className="h-4 w-4 mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <AlertTitle className="mb-0">{medication}</AlertTitle>
            <Badge variant="secondary" className="text-xs">{dosage}</Badge>
          </div>
          <AlertDescription className="text-xs text-muted-foreground">
            {date} {time}
          </AlertDescription>
        </div>
      </div>
      <Button variant="ghost" size="sm" className="ml-4 shrink-0" onClick={onEdit}>
        Information
      </Button>
    </Alert>
  )
}

export function PatientTreatments({
  user,
  onLogout,
  onNavigate,
  nextShot,
  additionalMedications = [],
  history,
  treatmentType,
  className,
  medications = [],
  selectedMedications = [],
  onMedicationSelectionChange = () => {},
  onAddMetrics,
  healthMetricsData = [],
  patientId,
  onRefreshMetrics,
  onMetricChange,
  medicationTrackingEntries = []
}: PatientTreatmentsProps) {
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
                    <BreadcrumbPage>{treatmentType} Treatment</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            {/* Weight Chart Section */}
              <div className="mb-6">
                <TrackingChart 
                  title="Health Metrics"
                  description="Daily health tracking" 
                  selectedMetric="weight"
                  affirmation="Your body is transforming with each healthy choice - trust the process and celebrate progress."
                  subtext="You're losing weight after taking your medication. However, your sugar intake tends to start increasing as your next dose approaches"
                  medications={medications}
                  selectedMedications={selectedMedications}
                  onMedicationSelectionChange={onMedicationSelectionChange}
                  onAddMetrics={onAddMetrics}
                  hasMetrics={healthMetricsData && healthMetricsData.length > 0}
                  metricsData={healthMetricsData}
                  patientId={patientId}
                  onRefresh={onRefreshMetrics}
                  onMetricChange={onMetricChange}
                  medicationTrackingEntries={medicationTrackingEntries}
                />
              </div>

              {/* Medications Section */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold mb-4">Medications</h1>
                {nextShot ? (
                  <div className="space-y-3">
                    <TrackAlert 
                      medication={nextShot.medication}
                      dosage={nextShot.dosage}
                      day={nextShot.day}
                      time={nextShot.time}
                      nextDueDate={nextShot.nextDueDate}
                      buttonText={nextShot.buttonText}
                      onStartTracking={nextShot.onStartTracking}
                      medicationIndex={0}
                    />
                    {additionalMedications.map((med, index) => (
                      <TrackAlert 
                        key={index}
                        medication={med.medication}
                        dosage={med.dosage}
                        day={med.day}
                        time={med.time}
                        nextDueDate={med.nextDueDate}
                        buttonText={med.buttonText}
                        onStartTracking={med.onStartTracking}
                        medicationIndex={index + 1}
                      />
                    ))}
                  </div>
                ) : additionalMedications.length > 0 ? (
                  <div className="space-y-3">
                    {additionalMedications.map((med, index) => (
                      <TrackAlert 
                        key={index}
                        medication={med.medication}
                        dosage={med.dosage}
                        day={med.day}
                        time={med.time}
                        nextDueDate={med.nextDueDate}
                        buttonText={med.buttonText}
                        onStartTracking={med.onStartTracking}
                        medicationIndex={index}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No approved medications available for tracking.</p>
                    <p className="text-sm">Contact your provider to get started with treatment.</p>
                  </div>
                )}
              </div>


              {/* History Section */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">History</h2>
                <div className="space-y-6">
                  {history.map((monthData, index) => (
                    <div key={index} className="mb-6">
                      <h3 className="text-xs font-bold text-muted-foreground mb-3">
                        {monthData.month}
                      </h3>
                      <div className="space-y-3">
                        {monthData.items.map((item, itemIndex) => (
                          <MedicationTrackingAlert
                            key={itemIndex}
                            medication={item.medication}
                            dosage={item.dosage}
                            date={item.date}
                            time={item.time}
                            onEdit={item.onEdit}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
          </div>
        </SidebarInset>
    </SidebarProvider>
  )
}