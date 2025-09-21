import type { Meta, StoryObj } from '@storybook/react'
import * as React from 'react'
import { type ColumnDef } from "@tanstack/react-table"
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/src/components/table'
import { Button } from '../ui/src/components/button'
import { Input } from '../ui/src/components/input'
import { Badge } from '../ui/src/components/badge'
import { Checkbox } from '../ui/src/components/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/src/components/select'

// Patient data type
export type Patient = {
  id: string
  name: string
  careTeam: string[]
  treatments: string[]
  medications: string[]
  status: string[]
}

// Initial patient data
const initialPatientData: Patient[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    careTeam: ["Dr. Michael Chen", "Nurse Wilson"],
    treatments: ["Weight Management", "Diabetes Care"],
    medications: ["Semaglutide", "Metformin"],
    status: ["Active", "In Progress"]
  },
  {
    id: "2", 
    name: "Michael Roberts",
    careTeam: ["Dr. Emily Davis", "Therapist Brown"],
    treatments: ["Cardiac Care", "Recovery Plan"],
    medications: ["Lisinopril", "Atorvastatin"],
    status: ["Stable", "Monthly Review"]
  },
  {
    id: "3",
    name: "Jennifer Martinez",
    careTeam: ["Dr. James Wilson", "Case Manager"],
    treatments: ["Mental Health", "Medication Management"],
    medications: ["Sertraline", "Alprazolam"],
    status: ["Improving", "Weekly Check"]
  },
  {
    id: "4",
    name: "David Anderson",
    careTeam: ["Dr. Lisa Taylor", "Nutritionist"],
    treatments: ["Obesity Treatment", "Lifestyle Changes"],
    medications: ["Ozempic", "Victoza"],
    status: ["New Patient", "Education Needed"]
  },
  {
    id: "5",
    name: "Maria Garcia",
    careTeam: ["Dr. Robert White", "Physical Therapist"],
    treatments: ["Post-Surgery Recovery", "Mobility Training"],
    medications: ["Tramadol", "Ibuprofen"],
    status: ["Critical", "Daily Monitoring"]
  },
  {
    id: "6",
    name: "James Thompson",
    careTeam: ["Dr. Amanda Rodriguez", "Social Worker"],
    treatments: ["Preventive Care", "Health Education"],
    medications: ["Aspirin", "Vitamin D"],
    status: ["Healthy", "Annual Visit"]
  },
  {
    id: "7",
    name: "Lisa Miller",
    careTeam: ["Dr. Kevin Lewis", "Pharmacist"],
    treatments: ["Medication Review", "Chronic Care"],
    medications: ["Insulin", "Glucose Monitor"],
    status: ["Stable", "Medication Changes"]
  },
  {
    id: "8",
    name: "Robert Brown",
    careTeam: ["Dr. Patricia Garcia", "Care Coordinator"],
    treatments: ["Complex Care", "Multiple Conditions"],
    medications: ["Multiple Daily", "Warfarin"],
    status: ["High Risk", "Frequent Visits"]
  },
  {
    id: "9",
    name: "Angela Davis",
    careTeam: ["Dr. Mark Johnson", "Dietitian"],
    treatments: ["Hypertension Management", "Dietary Counseling"],
    medications: ["Amlodipine", "Hydrochlorothiazide"],
    status: ["Controlled", "Quarterly Review"]
  },
  {
    id: "10",
    name: "Christopher Wilson",
    careTeam: ["Dr. Sarah Lee", "Physical Therapist"],
    treatments: ["Arthritis Care", "Joint Mobility"],
    medications: ["Celebrex", "Glucosamine"],
    status: ["Improving", "Bi-weekly Sessions"]
  },
  {
    id: "11",
    name: "Diana Martinez",
    careTeam: ["Dr. Thomas Brown", "Mental Health Counselor"],
    treatments: ["Anxiety Treatment", "Therapy Sessions"],
    medications: ["Buspirone", "Citalopram"],
    status: ["Stable", "Weekly Therapy"]
  },
  {
    id: "12",
    name: "Edward Thompson",
    careTeam: ["Dr. Jennifer White", "Cardiologist"],
    treatments: ["Heart Disease Management", "Cardiac Rehab"],
    medications: ["Metoprolol", "Clopidogrel"],
    status: ["Monitored", "Monthly ECG"]
  },
  {
    id: "13",
    name: "Fiona Garcia",
    careTeam: ["Dr. David Miller", "Endocrinologist"],
    treatments: ["Thyroid Disorder", "Hormone Therapy"],
    medications: ["Levothyroxine", "Calcium"],
    status: ["Regulated", "Semi-annual Labs"]
  },
  {
    id: "14",
    name: "George Anderson",
    careTeam: ["Dr. Lisa Chen", "Pulmonologist"],
    treatments: ["COPD Management", "Respiratory Therapy"],
    medications: ["Albuterol", "Prednisone"],
    status: ["Stable", "Monthly Check"]
  },
  {
    id: "15",
    name: "Hannah Wilson",
    careTeam: ["Dr. Robert Taylor", "Oncologist"],
    treatments: ["Cancer Treatment", "Chemotherapy"],
    medications: ["Tamoxifen", "Anti-nausea"],
    status: ["Treatment", "Weekly Monitoring"]
  },
  {
    id: "16",
    name: "Ivan Rodriguez",
    careTeam: ["Dr. Maria Lopez", "Neurologist"],
    treatments: ["Epilepsy Management", "Seizure Control"],
    medications: ["Phenytoin", "Lamotrigine"],
    status: ["Controlled", "Regular EEG"]
  },
  {
    id: "17",
    name: "Julia Kim",
    careTeam: ["Dr. James Park", "Dermatologist"],
    treatments: ["Skin Cancer Prevention", "Dermatology Care"],
    medications: ["Tretinoin", "Sunscreen"],
    status: ["Preventive", "Annual Screening"]
  },
  {
    id: "18",
    name: "Kevin O'Brien",
    careTeam: ["Dr. Susan Davis", "Orthopedist"],
    treatments: ["Joint Replacement Recovery", "Physical Therapy"],
    medications: ["Oxycodone", "Ibuprofen"],
    status: ["Recovering", "Daily PT"]
  },
  {
    id: "19",
    name: "Laura Mitchell",
    careTeam: ["Dr. Michael Chang", "Gastroenterologist"],
    treatments: ["IBS Management", "Dietary Modifications"],
    medications: ["Dicyclomine", "Fiber Supplements"],
    status: ["Managing", "Monthly Follow-up"]
  },
  {
    id: "20",
    name: "Mark Stevens",
    careTeam: ["Dr. Nicole Johnson", "Psychiatrist"],
    treatments: ["Depression Treatment", "Medication Management"],
    medications: ["Fluoxetine", "Bupropion"],
    status: ["Improving", "Bi-weekly Visits"]
  },
  {
    id: "21",
    name: "Nancy Williams",
    careTeam: ["Dr. Andrew Wilson", "Rheumatologist"],
    treatments: ["Rheumatoid Arthritis", "Immunosuppressive Therapy"],
    medications: ["Methotrexate", "Folic Acid"],
    status: ["Stable", "Monthly Labs"]
  },
  {
    id: "22",
    name: "Oscar Martinez",
    careTeam: ["Dr. Rachel Green", "Urologist"],
    treatments: ["Kidney Stone Prevention", "Hydration Therapy"],
    medications: ["Potassium Citrate", "Allopurinol"],
    status: ["Preventive", "Quarterly Imaging"]
  }
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

function PatientTable() {
  const [patientData, setPatientData] = React.useState<Patient[]>(initialPatientData)
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [selectedRows, setSelectedRows] = React.useState<string[]>([])

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
  ], [])

  const table = useReactTable({
    data: patientData,
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

  return (
    <div className="w-full">
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
                {[8, 10, 20, 30, 40, 50].map((pageSize) => (
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

const meta: Meta<typeof PatientTable> = {
  title: 'Atomic/Organisms/Tables/Patient Table',
  component: PatientTable,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Patient table with search, pagination, and detailed patient information view in a side sheet.',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div className="p-8 max-w-7xl mx-auto">
      <PatientTable />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Complete patient table with search functionality, tag-based data display, and patient detail sheet.',
      },
    },
  },
}