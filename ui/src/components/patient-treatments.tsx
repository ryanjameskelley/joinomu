"use client"

import * as React from "react"
import { BarChartBig, BadgeCheck } from "lucide-react"
import { cn } from "../lib/utils"
import { Alert, AlertDescription, AlertTitle } from "./alert"
import { Button } from "./button"
import { Badge } from "./badge"
import { TrackingChart } from "./tracking-chart"
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

export interface PatientTreatmentsProps {
  user?: {
    name: string
    email: string
    avatar?: string
  }
  onLogout?: () => void
  nextShot: {
    medication: string
    dosage: string
    day: string
    time: string
  }
  history: MonthlyHistory[]
  treatmentType: string
  className?: string
}

function TrackAlert({ 
  medication, 
  dosage, 
  day, 
  time 
}: { 
  medication: string
  dosage: string
  day: string
  time: string
}) {
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
            Take {day} {time}
          </AlertDescription>
        </div>
      </div>
      <Button variant="outline" size="sm" className="ml-4 shrink-0">
        Take Shot
      </Button>
    </Alert>
  )
}

function MedicationTrackingAlert({ 
  medication, 
  dosage, 
  date, 
  time 
}: TreatmentHistoryItem) {
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
      <Button variant="ghost" size="sm" className="ml-4 shrink-0">
        Information
      </Button>
    </Alert>
  )
}

export function PatientTreatments({
  user,
  onLogout,
  nextShot,
  history,
  treatmentType,
  className
}: PatientTreatmentsProps) {
  return (
    <div className="light min-h-screen w-full bg-white text-gray-900" style={{ 
      '--background': 'white',
      '--foreground': 'black',
      '--muted': '#f8f9fa',
      '--muted-foreground': '#6c757d',
      '--border': '#dee2e6',
      '--sidebar': '#f8f9fa',
      '--sidebar-foreground': 'black',
      '--sidebar-primary': '#343a40',
      '--sidebar-primary-foreground': 'white',
      '--sidebar-accent': '#e9ecef',
      '--sidebar-accent-foreground': 'black',
      '--sidebar-border': '#dee2e6',
      '--sidebar-ring': '#6c757d'
    } as React.CSSProperties}>
      <SidebarProvider>
        <AppSidebar user={user} onLogout={onLogout} />
        <div className="flex flex-col pt-4 px-4 pb-4 flex-1">
          <SidebarInset className="flex flex-col rounded-xl shadow flex-1">
            <header className="flex h-16 shrink-0 items-center gap-2 sticky top-0 bg-white rounded-t-xl z-50">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1 hover:bg-gray-100 hover:text-gray-700 text-gray-700" />
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
          <div className="flex-1 overflow-y-auto">
            <div className={cn("flex flex-col p-4", className)}>
              {/* Weight Chart Section */}
              <div className="mb-6">
                <TrackingChart 
                  title="Weight"
                  description="Daily weight tracking" 
                  selectedMetric="weight"
                  affirmation="Your body is transforming with each healthy choice - trust the process and celebrate progress."
                />
              </div>

              {/* Next Shot Section */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold mb-4">Next Shot</h1>
                <TrackAlert 
                  medication={nextShot.medication}
                  dosage={nextShot.dosage}
                  day={nextShot.day}
                  time={nextShot.time}
                />
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
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  )
}