import * as React from "react"
import { cn } from "../lib/utils"
import { Button } from "./button"
import { Input } from "./input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table"
import { Badge } from "./badge"
import { Search, UserPlus } from "lucide-react"

export interface Patient {
  id: string
  profile_id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  date_of_birth?: string
  has_completed_intake?: boolean
  treatment_type?: string
  assigned_date?: string
  is_primary?: boolean
  assigned_providers?: string[]
  treatment_types?: string[]
  medications?: string[]
  created_at: string
}

export interface PatientTableProps {
  patients: Patient[]
  loading?: boolean
  searchPlaceholder?: string
  showSearch?: boolean
  showAddButton?: boolean
  addButtonLabel?: string
  onAddPatient?: () => void
  onPatientClick?: (patient: Patient) => void
  emptyStateText?: string
  className?: string
}

export function PatientTable({
  patients,
  loading = false,
  searchPlaceholder = "Search patients...",
  showSearch = true,
  showAddButton = false,
  addButtonLabel = "Add Patient",
  onAddPatient,
  onPatientClick,
  emptyStateText = "No patients found.",
  className,
}: PatientTableProps) {
  const [searchTerm, setSearchTerm] = React.useState("")

  const filteredPatients = React.useMemo(() => {
    if (!searchTerm) return patients

    const term = searchTerm.toLowerCase()
    return patients.filter(
      (patient) =>
        patient.first_name?.toLowerCase().includes(term) ||
        patient.last_name?.toLowerCase().includes(term) ||
        patient.email?.toLowerCase().includes(term) ||
        patient.phone?.toLowerCase().includes(term)
    )
  }, [patients, searchTerm])

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString()
  }

  const formatName = (first_name: string, last_name: string) => {
    return `${first_name} ${last_name}`.trim() || "Unknown"
  }

  const getIntakeStatus = (has_completed_intake?: boolean) => {
    if (has_completed_intake === true) {
      return <Badge variant="default">Complete</Badge>
    } else if (has_completed_intake === false) {
      return <Badge variant="secondary">Pending</Badge>
    }
    return <Badge variant="outline">Unknown</Badge>
  }

  const getTreatmentBadges = (patient: Patient) => {
    // For individual assignments (provider view)
    if (patient.treatment_type) {
      return (
        <Badge variant="outline" className="capitalize">
          {patient.treatment_type.replace('_', ' ')}
        </Badge>
      )
    }
    
    // For multiple treatments (admin view)
    if (patient.treatment_types && patient.treatment_types.length > 0) {
      return (
        <div className="flex flex-wrap gap-1">
          {patient.treatment_types.slice(0, 2).map((type, index) => (
            <Badge key={index} variant="outline" className="capitalize text-xs">
              {type.replace('_', ' ')}
            </Badge>
          ))}
          {patient.treatment_types.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{patient.treatment_types.length - 2}
            </Badge>
          )}
        </div>
      )
    }
    
    return <span className="text-muted-foreground text-sm">None</span>
  }

  const getProvidersList = (assigned_providers?: string[]) => {
    if (!assigned_providers || assigned_providers.length === 0) {
      return <span className="text-muted-foreground text-sm">Unassigned</span>
    }
    
    if (assigned_providers.length === 1) {
      return <span className="text-sm">{assigned_providers[0]}</span>
    }
    
    return (
      <div className="flex flex-col gap-1">
        <span className="text-sm">{assigned_providers[0]}</span>
        {assigned_providers.length > 1 && (
          <span className="text-muted-foreground text-xs">
            +{assigned_providers.length - 1} more
          </span>
        )}
      </div>
    )
  }

  const getMedicationsList = (medications?: string[]) => {
    if (!medications || medications.length === 0) {
      return <span className="text-muted-foreground text-sm">None</span>
    }
    
    if (medications.length === 1) {
      return (
        <Badge variant="secondary" className="text-xs">
          {medications[0]}
        </Badge>
      )
    }
    
    return (
      <div className="flex flex-wrap gap-1">
        {medications.slice(0, 2).map((medication, index) => (
          <Badge key={index} variant="secondary" className="text-xs">
            {medication}
          </Badge>
        ))}
        {medications.length > 2 && (
          <Badge variant="outline" className="text-xs">
            +{medications.length - 2}
          </Badge>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {showSearch && (
              <div className="w-64 h-10 bg-muted animate-pulse rounded-md" />
            )}
          </div>
          {showAddButton && (
            <div className="w-32 h-10 bg-muted animate-pulse rounded-md" />
          )}
        </div>
        <div className="border rounded-md">
          <div className="h-12 bg-muted animate-pulse" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 border-t bg-background animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with search and add button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {showSearch && (
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          )}
        </div>
        {showAddButton && onAddPatient && (
          <Button onClick={onAddPatient} className="flex items-center space-x-2">
            <UserPlus className="h-4 w-4" />
            <span>{addButtonLabel}</span>
          </Button>
        )}
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredPatients.length} of {patients.length} patients
      </div>

      {/* Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Date of Birth</TableHead>
              <TableHead>Intake Status</TableHead>
              <TableHead>Treatments</TableHead>
              <TableHead>Medications</TableHead>
              <TableHead>Providers</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPatients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="text-muted-foreground">
                    {searchTerm ? "No patients match your search." : emptyStateText}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredPatients.map((patient) => (
                <TableRow key={patient.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onPatientClick?.(patient)}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-primary hover:underline">
                        {formatName(patient.first_name, patient.last_name)}
                      </span>
                      <span className="text-sm text-muted-foreground">{patient.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {patient.phone || <span className="text-muted-foreground">No phone</span>}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{formatDate(patient.date_of_birth)}</span>
                  </TableCell>
                  <TableCell>
                    {getIntakeStatus(patient.has_completed_intake)}
                  </TableCell>
                  <TableCell>
                    {getTreatmentBadges(patient)}
                  </TableCell>
                  <TableCell>
                    {getMedicationsList(patient.medications)}
                  </TableCell>
                  <TableCell>
                    {getProvidersList(patient.assigned_providers)}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(patient.created_at)}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}