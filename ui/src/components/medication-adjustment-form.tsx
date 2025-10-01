import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { Button } from "./button"
import { Input } from "./input"
import { Label } from "./label"
import { Textarea } from "./textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"
import { Badge } from "./badge"
import { Checkbox } from "./checkbox"
import { Loader2 } from "lucide-react"

export interface MedicationAdjustmentData {
  id: string
  medication_name: string
  preferred_dosage: string
  frequency?: string
  status: 'pending' | 'approved' | 'denied' | 'discontinued'
  requested_date?: string
  providerNotes?: string
  faxed?: string | null
  supply_days?: number
}

export interface MedicationAdjustmentFormProps {
  medication: MedicationAdjustmentData
  onChange: (medication: MedicationAdjustmentData) => void
  onSave?: () => void
  onFax?: (shouldFax: boolean) => Promise<void>
  isSaving?: boolean
  showSaveButton?: boolean
  showRequestedDate?: boolean
  showFaxCheckbox?: boolean
  className?: string
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  approved: 'bg-green-100 text-green-800 hover:bg-green-200',
  denied: 'bg-red-100 text-red-800 hover:bg-red-200',
  discontinued: 'bg-gray-100 text-gray-800 hover:bg-gray-200'
}

const statusLabels = {
  pending: 'Pending',
  approved: 'Approved',
  denied: 'Denied',
  discontinued: 'Discontinued'
}

export function MedicationAdjustmentForm({
  medication,
  onChange,
  onSave,
  onFax,
  isSaving = false,
  showSaveButton = true,
  showRequestedDate = true,
  showFaxCheckbox = false,
  className
}: MedicationAdjustmentFormProps) {
  
  const handleFieldChange = (field: keyof MedicationAdjustmentData, value: string) => {
    onChange({
      ...medication,
      [field]: value
    })
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{medication.medication_name}</CardTitle>
          <Badge 
            variant="secondary" 
            className={statusColors[medication.status]}
          >
            {statusLabels[medication.status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium">Status</Label>
            <Select 
              value={medication.status} 
              onValueChange={(value) => handleFieldChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="denied">Denied</SelectItem>
                <SelectItem value="discontinued">Discontinued</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm font-medium">Dosage</Label>
            <Input
              value={medication.preferred_dosage}
              onChange={(e) => handleFieldChange('preferred_dosage', e.target.value)}
              placeholder="Enter dosage"
            />
          </div>
          <div>
            <Label className="text-sm font-medium">Frequency</Label>
            <Input
              value={medication.frequency || ''}
              onChange={(e) => handleFieldChange('frequency', e.target.value)}
              placeholder="Enter frequency"
            />
          </div>
          <div>
            <Label className="text-sm font-medium">Supply (Days)</Label>
            <Input
              type="number"
              value={medication.supply_days || ''}
              onChange={(e) => handleFieldChange('supply_days', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="Enter supply duration (e.g., 30, 60, 90)"
              min="1"
              max="365"
            />
          </div>
          {showRequestedDate && medication.requested_date && (
            <div>
              <Label className="text-sm font-medium">Requested Date</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {new Date(medication.requested_date).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
        
        <div>
          <Label className="text-sm font-medium">Provider Notes</Label>
          <Textarea
            value={medication.providerNotes || ''}
            onChange={(e) => handleFieldChange('providerNotes', e.target.value)}
            placeholder="Add provider notes..."
            rows={3}
          />
        </div>

        {/* Faxed checkbox */}
        {showFaxCheckbox && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="faxed-clinical"
              checked={!!medication.faxed}
              onCheckedChange={async (checked) => {
                if (onFax) {
                  await onFax(checked)
                }
              }}
              disabled={isSaving}
            />
            <Label htmlFor="faxed-clinical" className="text-sm font-medium">
              Faxed to Pharmacy
              {medication.faxed && medication.faxed !== 'pending' && (
                <span className="text-xs text-muted-foreground ml-2">
                  (Faxed on {(() => {
                    const date = new Date(medication.faxed);
                    return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleDateString();
                  })()})
                </span>
              )}
            </Label>
          </div>
        )}

        {showSaveButton && onSave && (
          <div className="flex justify-end pt-2">
            <Button 
              onClick={onSave}
              disabled={isSaving}
              className="w-32"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}