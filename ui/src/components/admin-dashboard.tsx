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
  treatmentType?: string
  assignedDate?: string
  isPrimary?: boolean
  email?: string
  hasCompletedIntake?: boolean
}

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
  isAdmin = false 
}: { 
  patients?: Patient[]
  isAdmin?: boolean 
}) {
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [selectedRows, setSelectedRows] = React.useState<string[]>([])
  const [patients, setPatients] = React.useState<Patient[]>(initialPatients || [])
  const [loading, setLoading] = React.useState(!initialPatients)

  // Fetch all patients for admin view
  React.useEffect(() => {
    if (isAdmin && !initialPatients) {
      fetchAllPatients()
    }
  }, [isAdmin, initialPatients])

  const fetchAllPatients = async () => {
    try {
      // Get all patients with their provider relationships for admin view
      const { data: patientData, error } = await supabase
        .from('patients')
        .select(`
          id,
          first_name,
          last_name,
          email,
          has_completed_intake,
          patient_providers (
            treatment_type,
            is_primary,
            assigned_date,
            providers (
              first_name,
              last_name
            )
          )
        `)

      if (!error && patientData) {
        const transformedPatients: Patient[] = patientData.map((patient: any) => {
          // Extract provider info from relationships
          const providers = patient.patient_providers?.map((pp: any) => 
            `Dr. ${pp.providers.first_name} ${pp.providers.last_name}`
          ) || []
          
          const treatments = patient.patient_providers?.map((pp: any) => 
            pp.treatment_type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
          ) || []

          const status = patient.has_completed_intake ? ['Active'] : ['Onboarding']

          return {
            id: patient.id,
            name: `${patient.first_name} ${patient.last_name}`,
            email: patient.email,
            careTeam: [...new Set(providers)], // Remove duplicates
            treatments: [...new Set(treatments)], // Remove duplicates
            medications: [], // Would need to fetch from medications table
            status,
            hasCompletedIntake: patient.has_completed_intake
          }
        })
        
        setPatients(transformedPatients)
      }
    } catch (error) {
      console.error('Error fetching patients:', error)
    } finally {
      setLoading(false)
    }
  }

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
        <div className="font-medium">{row.getValue("name")}</div>
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
  ], [selectedRows])

  const table = useReactTable({
    data: patients,
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
        <Input
          placeholder="Search patients..."
          value={globalFilter ?? ""}
          onChange={(event) => setGlobalFilter(String(event.target.value))}
          className="max-w-sm"
        />
        
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

export function AdminDashboard({
  user,
  onLogout,
  activeItem = "Dashboard",
  showPatientTable = false,
  onNavigate,
  patients
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
  patients?: Patient[]
}) {
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
        <AppSidebar user={user} onLogout={onLogout} onNavigate={onNavigate} userRole="admin" />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1 hover:bg-gray-100 hover:text-gray-700 text-gray-700" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage>Admin {activeItem}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            {showPatientTable ? (
              <PatientTable patients={patients} isAdmin={true} />
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
    </div>
  )
}