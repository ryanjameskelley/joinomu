"use client"

import * as React from "react"
import { Button } from "./button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select"
import { Label } from "./label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"
import { Pill } from "lucide-react"

export interface MedicationOption {
  id: string
  name: string
  description?: string
  category: 'weight_loss' | 'mens_health' | 'general'
  available_dosages: string[]
}

export interface MedicationPreferencesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  medications: MedicationOption[]
  onSubmit?: (preferences: { medicationId: string; dosage: string; isEdit?: boolean; preferenceId?: string }) => void
  onAddAnother?: (preferences: { medicationId: string; dosage: string }) => void
  loading?: boolean
  editMode?: boolean
  isOnboarding?: boolean
  currentMedication?: {
    id?: string
    medicationId?: string
    medicationName?: string
    dosage?: string
  }
}

export function MedicationPreferencesDialog({
  open,
  onOpenChange,
  medications = [],
  onSubmit,
  onAddAnother,
  loading = false,
  editMode = false,
  isOnboarding = false,
  currentMedication
}: MedicationPreferencesDialogProps) {
  const [selectedMedicationId, setSelectedMedicationId] = React.useState<string>("")
  const [selectedDosage, setSelectedDosage] = React.useState<string>("")

  const selectedMedication = medications.find(med => med.id === selectedMedicationId)
  const availableDosages = selectedMedication?.available_dosages || []

  const handleSubmit = () => {
    if (selectedMedicationId && selectedDosage && onSubmit) {
      onSubmit({
        medicationId: selectedMedicationId,
        dosage: selectedDosage,
        isEdit: editMode,
        preferenceId: currentMedication?.id
      })
    }
  }

  const handleAddAnother = () => {
    if (selectedMedicationId && selectedDosage && onAddAnother) {
      onAddAnother({
        medicationId: selectedMedicationId,
        dosage: selectedDosage
      })
      // Reset form for next entry but keep dialog open
      setSelectedMedicationId("")
      setSelectedDosage("")
    }
  }

  const handleMedicationChange = (medicationId: string) => {
    setSelectedMedicationId(medicationId)
    setSelectedDosage("") // Reset dosage when medication changes
  }

  React.useEffect(() => {
    if (!open) {
      setSelectedMedicationId("")
      setSelectedDosage("")
    }
  }, [open])

  // Pre-populate form when editing existing medication
  React.useEffect(() => {
    if (editMode && currentMedication && open) {
      console.log('🔍 Dialog: Attempting to find medication for edit mode')
      console.log('🔍 Dialog: currentMedication:', currentMedication)
      console.log('🔍 Dialog: available medications:', medications)
      console.log('🔍 Dialog: looking for medicationId:', currentMedication.medicationId)
      console.log('🔍 Dialog: looking for medicationName:', currentMedication.medicationName)
      console.log('🔍 Dialog: available medication names:', medications.map(m => m.name))
      
      // Find medication by name if medicationId not available
      const medication = currentMedication.medicationId 
        ? medications.find(med => med.id === currentMedication.medicationId)
        : medications.find(med => {
            // Try exact match first
            if (med.name === currentMedication.medicationName) return true
            // Try partial match (e.g., "Tirzepatide" matches "Tirzepatide (Mounjaro)")
            if (med.name.toLowerCase().includes(currentMedication.medicationName?.toLowerCase() || '')) return true
            // Try reverse partial match (e.g., "Tirzepatide (Mounjaro)" contains "Tirzepatide")
            if (currentMedication.medicationName?.toLowerCase().includes(med.name.toLowerCase())) return true
            return false
          })
      
      console.log('🔍 Dialog: Found medication match:', medication)
      
      if (medication) {
        console.log('✅ Dialog: Setting medication ID:', medication.id)
        setSelectedMedicationId(medication.id)
        setSelectedDosage(currentMedication.dosage || "")
      } else {
        console.log('❌ Dialog: No medication match found')
      }
    }
  }, [editMode, currentMedication, medications, open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editMode ? 'Edit Medication Preference' : 'Select Medication Preference'}
          </DialogTitle>
          <DialogDescription>
            {editMode 
              ? 'Update your medication preference. Changes will reset the status to pending for provider review.'
              : 'Choose your preferred medication and dosage. This will be reviewed by your provider before your visit.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="medication">Medication</Label>
              {editMode ? (
                <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm">
                  <span className="flex items-center truncate">
                    {selectedMedication?.name || 'Unknown Medication'}
                  </span>
                </div>
              ) : (
                <Select 
                  value={selectedMedicationId} 
                  onValueChange={handleMedicationChange}
                >
                  <SelectTrigger id="medication" className="w-full">
                    <SelectValue placeholder="Select a medication">
                      {selectedMedication && (
                        <span className="truncate">{selectedMedication.name}</span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {medications.map((medication) => (
                      <SelectItem key={medication.id} value={medication.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{medication.name}</span>
                          {medication.description && (
                            <span className="text-sm text-muted-foreground">
                              {medication.description}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dosage">Dosage</Label>
              <Select 
                value={selectedDosage} 
                onValueChange={setSelectedDosage}
                disabled={!selectedMedicationId}
              >
                <SelectTrigger id="dosage" className="w-full">
                  <SelectValue placeholder={selectedMedicationId ? "Select dosage" : "Select medication first"} />
                </SelectTrigger>
                <SelectContent>
                  {availableDosages.map((dosage) => (
                    <SelectItem key={dosage} value={dosage}>
                      {dosage}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          {!editMode && !isOnboarding && onAddAnother && (
            <Button 
              variant="outline"
              onClick={handleAddAnother}
              disabled={!selectedMedicationId || !selectedDosage || loading}
            >
              {loading ? "Adding..." : "Add Another +"}
            </Button>
          )}
          <Button 
            onClick={handleSubmit}
            disabled={!selectedMedicationId || !selectedDosage || loading}
          >
            {loading ? "Saving..." : editMode ? "Update Preference" : "Save Preference"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}