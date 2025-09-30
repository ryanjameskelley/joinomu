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

// Import the Patient Table component
import { 
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './table'
import { Button } from './button'
import { Input } from './input'
import { Badge } from './badge'
import { Checkbox } from './checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'
import { MedicationCard } from './medication-card'
import { authService } from '@joinomu/shared'

// Import Supabase client
import { supabase } from '@joinomu/shared'

// Patient data type with relationship info
export type Patient = {
  id: string
  name: string
  careTeam: string[]
  treatments: string[]
  medications: string[]
  status: string[]
  treatmentType?: string // From patient_assignments relationship
  assignedDate?: string
  isPrimary?: boolean
}

export type MedicationPreference = {
  id: string
  patient_id: string
  patient_name: string
  medication_name: string
  preferred_dosage: string
  frequency: string
  status: 'pending' | 'approved' | 'denied'
  requested_date: string
  notes?: string
}

export type ProviderVisit = {
  id: string
  patient_id: string
  patient_name: string
  provider_name: string
  appointment_date: string
  start_time: string
  treatment_type: string
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
}

// Sample patient data (this will be replaced with real Supabase data)
const patientData: Patient[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    careTeam: ["Dr. Michael Chen", "Nurse Wilson"],
    treatments: ["Weight Management", "Diabetes Care"],
    medications: ["Semaglutide", "Metformin"],
    status: ["Active", "In Progress"],
    treatmentType: "weight_loss",
    assignedDate: "2024-01-15",
    isPrimary: true
  },
  {
    id: "2", 
    name: "Michael Roberts",
    careTeam: ["Dr. Emily Davis", "Therapist Brown"],
    treatments: ["Cardiac Care", "Recovery Plan"],
    medications: ["Lisinopril", "Atorvastatin"],
    status: ["Stable", "Monthly Review"],
    treatmentType: "mens_health",
    assignedDate: "2024-02-01",
    isPrimary: false
  },
  {
    id: "3",
    name: "Jennifer Martinez",
    careTeam: ["Dr. James Wilson", "Case Manager"],
    treatments: ["Mental Health", "Medication Management"],
    medications: ["Sertraline", "Alprazolam"],
    status: ["Improving", "Weekly Check"],
    treatmentType: "weight_loss",
    assignedDate: "2024-01-30",
    isPrimary: true
  },
  {
    id: "4",
    name: "David Anderson",
    careTeam: ["Dr. Lisa Taylor", "Nutritionist"],
    treatments: ["Obesity Treatment", "Lifestyle Changes"],
    medications: ["Ozempic", "Victoza"],
    status: ["New Patient", "Education Needed"],
    treatmentType: "weight_loss",
    assignedDate: "2024-03-01",
    isPrimary: false
  },
]

function TagList({ items, variant = "secondary" }: { items: string[], variant?: string }) {
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item, index) => (
        <Badge key={index} variant={variant as any} className="text-xs">
          {item}
        </Badge>
      ))}
    </div>
  )
}

function ProviderApprovals({ 
  providerId,
  assignedPatients,
  onApprovalAction,
  onMedicationClick,
  onCountChange
}: { 
  providerId?: string
  assignedPatients?: Patient[]
  onApprovalAction?: (preferenceId: string, action: 'approve' | 'deny') => void
  onMedicationClick?: (preference: MedicationPreference) => void
  onCountChange?: (count: number) => void
}) {
  const [preferences, setPreferences] = React.useState<MedicationPreference[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (providerId && assignedPatients) {
      fetchPendingApprovals()
    }
  }, [providerId, assignedPatients])

  React.useEffect(() => {
    onCountChange?.(preferences.length)
  }, [preferences.length, onCountChange])

  const fetchPendingApprovals = async () => {
    try {
      if (!assignedPatients || assignedPatients.length === 0) {
        console.log('🔍 No assigned patients for approvals fetch')
        setPreferences([])
        setLoading(false)
        return
      }

      console.log('🔍 Fetching approvals for assigned patients:', assignedPatients.map(p => ({ id: p.id, name: p.name, profile_id: p.profile_id })))

      // Fetch medication preferences for all assigned patients
      const allPreferences: MedicationPreference[] = []
      
      for (const patient of assignedPatients) {
        try {
          console.log(`🔍 Fetching preferences for patient: ${patient.name} (profile_id: ${patient.profile_id})`)
          // Use the patient's profile_id to fetch their medication preferences
          const result = await authService.getPatientMedicationPreferences(patient.profile_id)
          console.log(`🔍 Raw preferences result for ${patient.name}:`, result)
          
          if (result.data && result.data.length > 0) {
            console.log(`🔍 All preferences for ${patient.name}:`, result.data.map(p => ({ id: p.id, medication: p.medication_name, status: p.status })))
            
            // Filter for pending preferences only and transform to our interface
            const pendingPreferences = result.data
              .filter(pref => {
                console.log(`🔍 Checking preference ${pref.medication_name}: status = ${pref.status}`)
                return pref.status === 'pending'
              })
              .map(pref => ({
                id: pref.id,
                patient_id: patient.id,
                patient_name: patient.name,
                medication_name: pref.medication_name,
                preferred_dosage: pref.preferred_dosage,
                frequency: pref.frequency || 'As needed',
                status: pref.status as 'pending' | 'approved' | 'denied',
                requested_date: pref.requested_date,
                notes: pref.notes
              }))
            
            console.log(`🔍 Pending preferences for ${patient.name}:`, pendingPreferences)
            allPreferences.push(...pendingPreferences)
          } else {
            console.log(`🔍 No preferences found for ${patient.name}`)
          }
        } catch (patientError) {
          console.warn(`❌ Error fetching preferences for patient ${patient.name}:`, patientError)
        }
      }
      
      console.log('✅ Final pending approvals for assigned patients:', allPreferences)
      setPreferences(allPreferences)
    } catch (error) {
      console.error('❌ Error fetching pending approvals:', error)
      setPreferences([])
    } finally {
      setLoading(false)
    }
  }

  const handleApprovalAction = async (preferenceId: string, action: 'approve' | 'deny') => {
    try {
      await onApprovalAction?.(preferenceId, action)
      // Remove from local state as it's no longer pending
      setPreferences(prev => prev.filter(p => p.id !== preferenceId))
    } catch (error) {
      console.error('Error handling approval action:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p>Loading approvals...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {preferences.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No pending approvals at this time.
        </div>
      ) : (
        <div className="space-y-4">
          {preferences.map((preference) => (
            <MedicationCard
              key={preference.id}
              medicationName={preference.medication_name}
              dosage={preference.preferred_dosage}
              supply={preference.frequency}
              status={preference.status}
              orderNumber={`${preference.patient_name}`}
              onTitleClick={() => onMedicationClick?.(preference)}
              className="w-full max-w-none cursor-pointer"
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ProviderVisits({ 
  providerId,
  assignedPatients,
  onVisitClick,
  onCountChange
}: { 
  providerId?: string
  assignedPatients?: Patient[]
  onVisitClick?: (visit: ProviderVisit) => void
  onCountChange?: (count: number) => void
}) {
  const [visits, setVisits] = React.useState<ProviderVisit[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (providerId && assignedPatients) {
      fetchProviderVisits()
    }
  }, [providerId, assignedPatients])

  React.useEffect(() => {
    onCountChange?.(visits.length)
  }, [visits.length, onCountChange])

  const fetchProviderVisits = async () => {
    try {
      if (!assignedPatients || assignedPatients.length === 0) {
        setVisits([])
        setLoading(false)
        return
      }

      // Fetch appointments for all assigned patients
      const allVisits: ProviderVisit[] = []
      
      for (const patient of assignedPatients) {
        try {
          // Use the patient's profile_id to fetch their appointments
          const result = await authService.getPatientAppointments(patient.profile_id, true)
          if (result.data && result.data.length > 0) {
            // Transform appointments to ProviderVisit format
            const patientVisits = result.data.map(appt => ({
              id: appt.appointment_id || appt.id,
              patient_id: patient.id,
              patient_name: patient.name,
              provider_name: 'Dr. Provider', // TODO: Get actual provider name
              appointment_date: appt.appointment_date,
              start_time: appt.start_time,
              treatment_type: appt.treatment_type || patient.treatmentType || 'consultation',
              status: appt.status as 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
            }))
            
            allVisits.push(...patientVisits)
          }
        } catch (patientError) {
          console.warn(`Error fetching appointments for patient ${patient.name}:`, patientError)
        }
      }
      
      // Sort visits by appointment date and time (most recent first)
      allVisits.sort((a, b) => {
        const dateCompare = new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime()
        if (dateCompare === 0) {
          return b.start_time.localeCompare(a.start_time)
        }
        return dateCompare
      })
      
      console.log('Fetched visits for assigned patients:', allVisits)
      setVisits(allVisits)
    } catch (error) {
      console.error('Error fetching provider visits:', error)
      setVisits([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p>Loading visits...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {visits.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No scheduled visits found.
        </div>
      ) : (
        <div className="space-y-4">
          {visits.map((visit) => (
            <MedicationCard
              key={visit.id}
              medicationName={visit.patient_name}
              dosage={visit.treatment_type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              supply={`${(() => {
                const [year, month, day] = visit.appointment_date.split('-').map(Number)
                const date = new Date(year, month - 1, day)
                return date.toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })
              })()} at ${visit.start_time}`}
              status={visit.status}
              onTitleClick={() => onVisitClick?.(visit)}
              className="w-full max-w-none cursor-pointer"
            />
          ))}
        </div>
      )}
    </div>
  )
}

function PatientTable({ 
  patients: initialPatients, 
  providerId,
  onPatientClick
}: { 
  patients?: Patient[]
  providerId?: string
  onPatientClick?: (patient: Patient) => void
}) {
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [selectedRows, setSelectedRows] = React.useState<string[]>([])
  const [treatmentFilter, setTreatmentFilter] = React.useState("all")
  const [patients, setPatients] = React.useState<Patient[]>(initialPatients || [])
  const [loading, setLoading] = React.useState(!initialPatients)

  // Use provided patients or fetch if none provided
  React.useEffect(() => {
    if (initialPatients && initialPatients.length > 0) {
      setPatients(initialPatients)
      setLoading(false)
    } else if (providerId) {
      fetchProviderPatients()
    }
  }, [providerId, initialPatients])

  const fetchProviderPatients = async () => {
    try {
      // Get patients assigned to this provider through patient_assignments junction table
      const { data: patientData, error } = await supabase
        .from('patient_assignments')
        .select(`
          treatment_type,
          is_primary,
          assigned_date,
          patients (
            id,
            first_name,
            last_name,
            email,
            has_completed_intake
          )
        `)
        .eq('provider_id', providerId)
        .eq('active', true)

      if (!error && patientData) {
        const transformedPatients: Patient[] = patientData.map((pp: any) => {
          const patient = pp.patients
          const status = patient.has_completed_intake ? ['Active'] : ['Onboarding']

          return {
            id: patient.id,
            name: `${patient.first_name} ${patient.last_name}`,
            careTeam: ['You'], // Provider seeing their own patients
            treatments: [pp.treatment_type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())],
            medications: [], // Would need to fetch from medications table
            status,
            treatmentType: pp.treatment_type,
            assignedDate: pp.assigned_date,
            isPrimary: pp.is_primary
          }
        })
        
        setPatients(transformedPatients)
      }
    } catch (error) {
      console.error('Error fetching provider patients:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter patients by treatment type
  const filteredPatients = React.useMemo(() => {
    if (treatmentFilter === "all") return patients
    return patients.filter(patient => patient.treatmentType === treatmentFilter)
  }, [patients, treatmentFilter])

  // Handle individual row selection
  const handleRowSelect = (patientId: string, checked: boolean) => {
    if (checked) {
      setSelectedRows(prev => [...prev, patientId])
    } else {
      setSelectedRows(prev => prev.filter(id => id !== patientId))
    }
  }

  // Define table columns
  const columns = React.useMemo<ColumnDef<Patient>[]>(() => [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={selectedRows.length === table.getFilteredRowModel().rows.length && table.getFilteredRowModel().rows.length > 0}
          onCheckedChange={(checked) => {
            if (checked) {
              setSelectedRows(table.getFilteredRowModel().rows.map(row => row.original.id))
            } else {
              setSelectedRows([])
            }
          }}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedRows.includes(row.original.id)}
          onCheckedChange={(checked) => handleRowSelect(row.original.id, !!checked)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <button 
          className="font-medium text-left hover:text-primary hover:underline cursor-pointer"
          onClick={() => onPatientClick?.(row.original)}
        >
          {row.getValue("name")}
        </button>
      ),
    },
    {
      accessorKey: "careTeam",
      header: "Care Team",
      cell: ({ row }) => (
        <TagList
          items={row.getValue("careTeam")}
          variant="outline"
        />
      ),
    },
    {
      accessorKey: "treatments",
      header: "Treatments",
      cell: ({ row }) => (
        <TagList
          items={row.getValue("treatments")}
          variant="secondary"
        />
      ),
    },
    {
      accessorKey: "medications",
      header: "Medications",
      cell: ({ row }) => (
        <TagList
          items={row.getValue("medications")}
          variant="default"
        />
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <TagList
          items={row.getValue("status")}
          variant="outline"
        />
      ),
    },
    {
      accessorKey: "treatmentType",
      header: "Treatment Type",
      cell: ({ row }) => {
        const treatmentType = row.getValue("treatmentType") as string
        const isPrimary = row.original.isPrimary
        return (
          <div className="flex items-center gap-2">
            <Badge 
              variant={isPrimary ? "default" : "secondary"} 
              className="text-xs"
            >
              {treatmentType?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'}
            </Badge>
            {isPrimary && (
              <Badge variant="outline" className="text-xs">
                Primary
              </Badge>
            )}
          </div>
        )
      },
    },
  ], [selectedRows])

  const table = useReactTable({
    data: filteredPatients,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    initialState: {
      pagination: {
        pageSize: 8,
      },
    },
  })

  if (loading) {
    return (
      <div className="w-full p-6">
        <div className="flex items-center justify-center h-64">
          <p>Loading patients...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full p-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search patients..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(String(event.target.value))}
            className="max-w-sm"
          />
          
          {/* Treatment Type Filter */}
          <Select value={treatmentFilter} onValueChange={setTreatmentFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by treatment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Treatments</SelectItem>
              <SelectItem value="weight_loss">Weight Loss</SelectItem>
              <SelectItem value="mens_health">Men's Health</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button>
          Add Patient
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {table.getHeaderGroups().map((headerGroup) =>
                headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="font-medium">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={`${selectedRows.includes(row.original.id) ? "bg-muted" : ""}`}
                  style={{ height: '21px' }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-1">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="text-sm text-muted-foreground">
          {selectedRows.length} of {table.getFilteredRowModel().rows.length} row(s) selected
        </div>
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value))
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent side="top">
                {[4, 8, 10, 20].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ProviderDashboard({
  user,
  onLogout,
  activeItem = "Dashboard",
  showPatientTable = false,
  onNavigate,
  providerId,
  assignedPatients,
  onPatientClick,
  onApprovalAction,
  onVisitClick,
  onMedicationClick
}: {
  user?: {
    name: string
    email: string
    avatar?: string
  }
  onLogout?: () => void
  activeItem?: string
  showPatientTable?: boolean
  onNavigate?: (item: string) => void
  providerId?: string
  assignedPatients?: Patient[]
  onPatientClick?: (patient: Patient) => void
  onApprovalAction?: (preferenceId: string, action: 'approve' | 'deny') => void
  onVisitClick?: (visit: ProviderVisit) => void
  onMedicationClick?: (preference: MedicationPreference) => void
}) {
  const [visitsCount, setVisitsCount] = React.useState(0)
  const [approvalsCount, setApprovalsCount] = React.useState(0)

  return (
    <SidebarProvider>
        <AppSidebar user={user} onLogout={onLogout} onNavigate={onNavigate} userRole="provider" />
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
                    <BreadcrumbPage>Provider {activeItem}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0 bg-card">
            {showPatientTable ? (
              <PatientTable 
                patients={assignedPatients} 
                providerId={providerId}
                onPatientClick={onPatientClick}
              />
            ) : (
              <>
                {/* Always render both components to get counts, but hide them */}
                <div style={{ display: 'none' }}>
                  <ProviderVisits 
                    providerId={providerId}
                    assignedPatients={assignedPatients}
                    onVisitClick={onVisitClick}
                    onCountChange={setVisitsCount}
                  />
                  <ProviderApprovals 
                    providerId={providerId}
                    assignedPatients={assignedPatients}
                    onApprovalAction={onApprovalAction}
                    onMedicationClick={onMedicationClick}
                    onCountChange={setApprovalsCount}
                  />
                </div>
                
                <Tabs defaultValue="visits" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="visits">Visits ({visitsCount})</TabsTrigger>
                    <TabsTrigger value="approvals">Approvals ({approvalsCount})</TabsTrigger>
                  </TabsList>
                  <TabsContent value="visits" className="mt-4">
                    <ProviderVisits 
                      providerId={providerId}
                      assignedPatients={assignedPatients}
                      onVisitClick={onVisitClick}
                      onCountChange={() => {}} // Don't update count again
                    />
                  </TabsContent>
                  <TabsContent value="approvals" className="mt-4">
                    <ProviderApprovals 
                      providerId={providerId}
                      assignedPatients={assignedPatients}
                      onApprovalAction={onApprovalAction}
                      onMedicationClick={onMedicationClick}
                      onCountChange={() => {}} // Don't update count again
                    />
                  </TabsContent>
                </Tabs>
              </>
            )}
          </div>
        </SidebarInset>
    </SidebarProvider>
  )
}