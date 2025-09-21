import * as React from "react"
import { cn } from "../lib/utils"
import { Button } from "../components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/card"
import { Input } from "../components/input"
import { Label } from "../components/label"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/select"

interface EligibilityFormData {
  email: string
  treatmentType: 'glp1' | 'diabetes' | 'weight-management' | 'other'
  firstName: string
  lastName: string
  age: number
  height: {
    feet: number
    inches: number
  }
  weight: number
  medicalHistory?: string[]
  currentMedications?: string[]
  insuranceProvider?: string
  state: string
  zipCode: string
}

interface EligibilityFormProps {
  className?: string
  onSubmit?: (data: EligibilityFormData) => void
  loading?: boolean
  error?: string
  initialData?: Partial<EligibilityFormData>
}

const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
]

export function EligibilityForm({
  className,
  onSubmit,
  loading = false,
  error,
  initialData,
  ...props
}: EligibilityFormProps) {
  const [formData, setFormData] = React.useState<EligibilityFormData>({
    email: initialData?.email || '',
    treatmentType: initialData?.treatmentType || 'glp1',
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    age: initialData?.age || 0,
    height: initialData?.height || { feet: 5, inches: 6 },
    weight: initialData?.weight || 0,
    medicalHistory: initialData?.medicalHistory || [],
    currentMedications: initialData?.currentMedications || [],
    insuranceProvider: initialData?.insuranceProvider || '',
    state: initialData?.state || '',
    zipCode: initialData?.zipCode || '',
  })

  const [localError, setLocalError] = React.useState('')

  const updateFormData = (field: keyof EligibilityFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const updateHeight = (type: 'feet' | 'inches', value: number) => {
    setFormData(prev => ({
      ...prev,
      height: { ...prev.height, [type]: value }
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')

    // Basic validation
    if (!formData.email || !formData.firstName || !formData.lastName) {
      setLocalError('Please fill in all required fields')
      return
    }

    if (formData.age < 18) {
      setLocalError('You must be 18 or older to use this service')
      return
    }

    if (formData.weight <= 0 || formData.height.feet <= 0) {
      setLocalError('Please enter valid height and weight')
      return
    }

    onSubmit?.(formData)
  }

  const displayError = error || localError

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Check Your Eligibility</CardTitle>
          <CardDescription>
            Tell us about yourself to see if you qualify for treatment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              
              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="grid gap-3">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => updateFormData('firstName', e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => updateFormData('lastName', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-3">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  required
                />
              </div>

              {/* Treatment Type */}
              <div className="grid gap-3">
                <Label htmlFor="treatmentType">Treatment Type *</Label>
                <Select 
                  value={formData.treatmentType} 
                  onValueChange={(value) => updateFormData('treatmentType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select treatment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="glp1">GLP-1 (Weight Loss)</SelectItem>
                    <SelectItem value="diabetes">Diabetes Management</SelectItem>
                    <SelectItem value="weight-management">Weight Management</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Personal Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="grid gap-3">
                  <Label htmlFor="age">Age *</Label>
                  <Input
                    id="age"
                    type="number"
                    min="18"
                    max="120"
                    value={formData.age || ''}
                    onChange={(e) => updateFormData('age', parseInt(e.target.value) || 0)}
                    required
                  />
                </div>
                <div className="grid gap-3">
                  <Label>Height *</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Feet"
                      min="3"
                      max="8"
                      value={formData.height.feet || ''}
                      onChange={(e) => updateHeight('feet', parseInt(e.target.value) || 0)}
                      required
                    />
                    <Input
                      type="number"
                      placeholder="Inches"
                      min="0"
                      max="11"
                      value={formData.height.inches || ''}
                      onChange={(e) => updateHeight('inches', parseInt(e.target.value) || 0)}
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="weight">Weight (lbs) *</Label>
                  <Input
                    id="weight"
                    type="number"
                    min="50"
                    max="800"
                    value={formData.weight || ''}
                    onChange={(e) => updateFormData('weight', parseInt(e.target.value) || 0)}
                    required
                  />
                </div>
              </div>

              {/* Medical Information */}
              <div className="grid gap-3">
                <Label htmlFor="currentMedications">Current Medications (optional)</Label>
                <Input
                  id="currentMedications"
                  type="text"
                  placeholder="List any current medications"
                  value={formData.currentMedications?.join(', ') || ''}
                  onChange={(e) => updateFormData('currentMedications', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="insuranceProvider">Insurance Provider (optional)</Label>
                <Input
                  id="insuranceProvider"
                  type="text"
                  placeholder="e.g., Blue Cross, Aetna, etc."
                  value={formData.insuranceProvider}
                  onChange={(e) => updateFormData('insuranceProvider', e.target.value)}
                />
              </div>

              {/* Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="grid gap-3">
                  <Label htmlFor="state">State *</Label>
                  <Select 
                    value={formData.state} 
                    onValueChange={(value) => updateFormData('state', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your state" />
                    </SelectTrigger>
                    <SelectContent>
                      {US_STATES.map((state) => (
                        <SelectItem key={state.value} value={state.value}>
                          {state.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="zipCode">ZIP Code *</Label>
                  <Input
                    id="zipCode"
                    type="text"
                    pattern="[0-9]{5}(-[0-9]{4})?"
                    placeholder="12345"
                    value={formData.zipCode}
                    onChange={(e) => updateFormData('zipCode', e.target.value)}
                    required
                  />
                </div>
              </div>

              {displayError && (
                <div className="text-destructive text-sm text-center">{displayError}</div>
              )}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Checking Eligibility...' : 'Check Eligibility'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export type { EligibilityFormData }