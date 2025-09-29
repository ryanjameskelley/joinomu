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
  onPatientClick
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
}) {
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
                {/* Dashboard content */}
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