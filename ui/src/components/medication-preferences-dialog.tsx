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
import { Pill, Check } from "lucide-react"

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
  onSubmit?: (preferences: { medicationId: string; dosage: string }) => void
  loading?: boolean
}

export function MedicationPreferencesDialog({
  open,
  onOpenChange,
  medications = [],
  onSubmit,
  loading = false
}: MedicationPreferencesDialogProps) {
  const [selectedMedicationId, setSelectedMedicationId] = React.useState<string>("")
  const [selectedDosage, setSelectedDosage] = React.useState<string>("")

  const selectedMedication = medications.find(med => med.id === selectedMedicationId)
  const availableDosages = selectedMedication?.available_dosages || []

  const handleSubmit = () => {
    if (selectedMedicationId && selectedDosage && onSubmit) {
      onSubmit({
        medicationId: selectedMedicationId,
        dosage: selectedDosage
      })
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Select Medication Preference
          </DialogTitle>
          <DialogDescription>
            Choose your preferred medication and dosage. This will be reviewed by your provider before your visit.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="medication">Medication</Label>
              <Select 
                value={selectedMedicationId} 
                onValueChange={handleMedicationChange}
              >
                <SelectTrigger id="medication">
                  <SelectValue placeholder="Select a medication" />
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="dosage">Dosage</Label>
              <Select 
                value={selectedDosage} 
                onValueChange={setSelectedDosage}
                disabled={!selectedMedicationId}
              >
                <SelectTrigger id="dosage">
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

          {selectedMedication && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-900">
                  {selectedMedication.name}
                </CardTitle>
                {selectedMedication.description && (
                  <CardDescription className="text-blue-700">
                    {selectedMedication.description}
                  </CardDescription>
                )}
              </CardHeader>
              {selectedDosage && (
                <CardContent className="pt-0">
                  <p className="text-sm text-blue-800">
                    <strong>Selected dosage:</strong> {selectedDosage}
                  </p>
                </CardContent>
              )}
            </Card>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!selectedMedicationId || !selectedDosage || loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              "Saving..."
            ) : (
              <>
                <Check className="h-4 w-4" />
                Save Preference
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}