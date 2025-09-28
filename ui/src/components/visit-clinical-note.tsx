import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { Button } from "./button"
import { Input } from "./input"
import { Label } from "./label"
import { Textarea } from "./textarea"
import { Badge } from "./badge"
import { MedicationAdjustmentForm, type MedicationAdjustmentData } from "./medication-adjustment-form"
import { Calendar, Clock, User, FileText, Plus, X } from "lucide-react"
import { cn } from "../lib/utils"

export interface PatientVisit {
  id: string
  appointment_date: string
  start_time: string
  appointment_type: string
  treatment_type: string
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled'
  provider_notes?: string
  patient_notes?: string
}

export interface ClinicalNoteData {
  id?: string
  appointmentId: string
  patientId: string
  providerId: string
  allergies: string[]
  previousMedications: string[]
  currentMedications: string[]
  clinicalNote: string
  internalNote: string
  visitSummary: string
  createdAt?: string
  updatedAt?: string
}

export interface VisitClinicalNoteProps {
  visit: PatientVisit
  patientName: string
  medication?: MedicationAdjustmentData
  clinicalNote?: ClinicalNoteData
  onMedicationChange?: (medication: MedicationAdjustmentData) => void
  onClinicalNoteChange?: (clinicalNote: ClinicalNoteData) => void
  onSave?: () => void
  isSaving?: boolean
  className?: string
}

export function VisitClinicalNote({
  visit,
  patientName,
  medication,
  clinicalNote,
  onMedicationChange,
  onClinicalNoteChange,
  onSave,
  isSaving = false,
  className
}: VisitClinicalNoteProps) {
  
  // Initialize clinical note data if not provided
  const [noteData, setNoteData] = React.useState<ClinicalNoteData>(
    clinicalNote || {
      appointmentId: visit.id,
      patientId: '',
      providerId: '',
      allergies: [],
      previousMedications: [],
      currentMedications: [],
      clinicalNote: '',
      internalNote: '',
      visitSummary: ''
    }
  )

  // Track medication state locally to ensure it's editable
  const [localMedication, setLocalMedication] = React.useState<MedicationAdjustmentData | null>(medication || null)

  // Update local medication when prop changes
  React.useEffect(() => {
    if (medication) {
      setLocalMedication(medication)
    }
  }, [medication])

  // Auto-generate visit summary when medication changes
  React.useEffect(() => {
    if (localMedication && localMedication.status === 'approved') {
      const autoSummary = generateVisitSummary(
        localMedication.medication_name,
        localMedication.preferred_dosage,
        localMedication.frequency || 'as needed'
      )
      
      const updatedNote = { ...noteData, visitSummary: autoSummary }
      setNoteData(updatedNote)
      onClinicalNoteChange?.(updatedNote)
    }
  }, [localMedication?.status, localMedication?.medication_name, localMedication?.preferred_dosage, localMedication?.frequency])

  const generateVisitSummary = (medicationName: string, dosage: string, supply: string) => {
    return `Patient and I discussed their weight loss goals and ${medicationName} ${dosage} was prescribed for ${supply}. The patient should plan on a follow up visit in 30 days to continue their treatment.`
  }

  const formatDate = (dateString: string) => {
    try {
      const [year, month, day] = dateString.split('-').map(Number)
      const date = new Date(year, month - 1, day)
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const formatTime = (timeString: string) => {
    try {
      const [hours, minutes] = timeString.split(':')
      const date = new Date()
      date.setHours(parseInt(hours), parseInt(minutes))
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    } catch {
      return timeString
    }
  }

  const addListItem = (field: 'allergies' | 'previousMedications' | 'currentMedications', value: string) => {
    if (value.trim()) {
      const updated = {
        ...noteData,
        [field]: [...noteData[field], value.trim()]
      }
      setNoteData(updated)
      onClinicalNoteChange?.(updated)
    }
  }

  const removeListItem = (field: 'allergies' | 'previousMedications' | 'currentMedications', index: number) => {
    const updated = {
      ...noteData,
      [field]: noteData[field].filter((_, i) => i !== index)
    }
    setNoteData(updated)
    onClinicalNoteChange?.(updated)
  }

  const updateField = (field: keyof ClinicalNoteData, value: string) => {
    const updated = { ...noteData, [field]: value }
    setNoteData(updated)
    onClinicalNoteChange?.(updated)
  }

  const statusColors = {
    scheduled: 'bg-blue-100 text-blue-800',
    confirmed: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
    no_show: 'bg-orange-100 text-orange-800',
    rescheduled: 'bg-purple-100 text-purple-800'
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Visit Context Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Clinical Note
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Patient:</span>
              <span>{patientName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant="secondary" 
                className={statusColors[visit.status]}
              >
                {visit.status.replace('_', ' ')}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Date:</span>
              <span>{formatDate(visit.appointment_date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Time:</span>
              <span>{formatTime(visit.start_time)}</span>
            </div>
            <div className="col-span-2">
              <span className="font-medium">Type:</span>
              <span className="ml-2 capitalize">{visit.appointment_type}</span>
              {visit.treatment_type && (
                <span className="ml-2 text-muted-foreground">
                  • {visit.treatment_type.replace('_', ' ')}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Medication Adjustments */}
      {localMedication && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Medication Adjustments</h3>
          <MedicationAdjustmentForm
            medication={localMedication}
            onChange={(updatedMedication) => {
              console.log('Medication form changed:', updatedMedication)
              setLocalMedication(updatedMedication)
              onMedicationChange?.(updatedMedication)
            }}
            showSaveButton={false}
            showRequestedDate={false}
          />
        </div>
      )}

      {/* Clinical Information */}
      <Card>
        <CardHeader>
          <CardTitle>Clinical Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Allergies */}
          <div>
            <Label className="text-sm font-medium">Allergies</Label>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {noteData.allergies.map((allergy, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-red-50 text-red-700 hover:bg-red-100"
                  >
                    {allergy}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1 hover:bg-red-200"
                      onClick={() => removeListItem('allergies', index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add allergy..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addListItem('allergies', e.currentTarget.value)
                      e.currentTarget.value = ''
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement
                    addListItem('allergies', input.value)
                    input.value = ''
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Previous Medications */}
          <div>
            <Label className="text-sm font-medium">Previous Medications</Label>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {noteData.previousMedications.map((med, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-gray-50 text-gray-700"
                  >
                    {med}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1"
                      onClick={() => removeListItem('previousMedications', index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add previous medication..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addListItem('previousMedications', e.currentTarget.value)
                      e.currentTarget.value = ''
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement
                    addListItem('previousMedications', input.value)
                    input.value = ''
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Current Medications */}
          <div>
            <Label className="text-sm font-medium">Current Medications</Label>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {noteData.currentMedications.map((med, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-blue-50 text-blue-700"
                  >
                    {med}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1"
                      onClick={() => removeListItem('currentMedications', index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add current medication..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addListItem('currentMedications', e.currentTarget.value)
                      e.currentTarget.value = ''
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement
                    addListItem('currentMedications', input.value)
                    input.value = ''
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Clinical Note */}
          <div>
            <Label className="text-sm font-medium">Clinical Note</Label>
            <Textarea
              value={noteData.clinicalNote}
              onChange={(e) => updateField('clinicalNote', e.target.value)}
              placeholder="Enter clinical observations, diagnosis, treatment plan..."
              rows={4}
              className="mt-1"
            />
          </div>

          {/* Internal Note */}
          <div>
            <Label className="text-sm font-medium">Internal Note</Label>
            <Textarea
              value={noteData.internalNote}
              onChange={(e) => updateField('internalNote', e.target.value)}
              placeholder="Enter internal notes (not visible to patient)..."
              rows={3}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Auto-Generated Visit Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Visit Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label className="text-sm font-medium">Summary</Label>
            <Textarea
              value={noteData.visitSummary}
              onChange={(e) => updateField('visitSummary', e.target.value)}
              placeholder="Auto-generated summary will appear here when medication is approved..."
              rows={3}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              This summary is auto-generated when medications are approved and can be edited.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      {onSave && (
        <div className="flex justify-end">
          <Button 
            onClick={onSave}
            disabled={isSaving}
            size="lg"
          >
            {isSaving ? 'Saving...' : 'Save Clinical Note'}
          </Button>
        </div>
      )}
    </div>
  )
}