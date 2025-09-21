import { useState, useEffect } from 'react'
import { Button } from '../components/button'
import { Input } from '../components/input'
import { Label } from '../components/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/card'
import { Alert, AlertDescription } from '../components/alert'

interface Patient {
  id: string
  first_name: string
  last_name: string
  email: string
}

interface Provider {
  id: string
  first_name: string
  last_name: string
  email: string
  specialty: string
}

interface PatientAssignmentInterfaceProps {
  patients: Patient[]
  providers: Provider[]
  onAssignPatient: (patientId: string, providerId: string, treatmentType: string, isPrimary: boolean) => Promise<{success: boolean, error?: string}>
  loading?: boolean
}

const treatmentTypes = [
  { value: 'weight_loss', label: 'Weight Loss' },
  { value: 'mens_health', label: "Men's Health" },
  { value: 'womens_health', label: "Women's Health" },
  { value: 'general_care', label: 'General Care' },
  { value: 'specialty_care', label: 'Specialty Care' }
]

export function PatientAssignmentInterface({
  patients,
  providers,
  onAssignPatient,
  loading = false
}: PatientAssignmentInterfaceProps) {
  const [selectedPatient, setSelectedPatient] = useState('')
  const [selectedProvider, setSelectedProvider] = useState('')
  const [treatmentType, setTreatmentType] = useState('general_care')
  const [isPrimary, setIsPrimary] = useState(false)
  const [searchPatient, setSearchPatient] = useState('')
  const [searchProvider, setSearchProvider] = useState('')
  const [assignmentResult, setAssignmentResult] = useState<{success: boolean, message: string} | null>(null)

  const filteredPatients = patients.filter(patient =>
    `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(searchPatient.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchPatient.toLowerCase())
  )

  const filteredProviders = providers.filter(provider =>
    `${provider.first_name} ${provider.last_name}`.toLowerCase().includes(searchProvider.toLowerCase()) ||
    provider.email.toLowerCase().includes(searchProvider.toLowerCase()) ||
    provider.specialty.toLowerCase().includes(searchProvider.toLowerCase())
  )

  const handleAssignment = async () => {
    if (!selectedPatient || !selectedProvider) {
      setAssignmentResult({
        success: false,
        message: 'Please select both a patient and provider'
      })
      return
    }

    try {
      const result = await onAssignPatient(selectedPatient, selectedProvider, treatmentType, isPrimary)
      
      if (result.success) {
        setAssignmentResult({
          success: true,
          message: 'Patient successfully assigned to provider!'
        })
        // Reset form
        setSelectedPatient('')
        setSelectedProvider('')
        setTreatmentType('general_care')
        setIsPrimary(false)
      } else {
        setAssignmentResult({
          success: false,
          message: result.error || 'Failed to assign patient'
        })
      }
    } catch (error) {
      setAssignmentResult({
        success: false,
        message: 'An unexpected error occurred'
      })
    }
  }

  // Clear result message after 5 seconds
  useEffect(() => {
    if (assignmentResult) {
      const timer = setTimeout(() => {
        setAssignmentResult(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [assignmentResult])

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Assign Patient to Provider</CardTitle>
        <CardDescription>
          Create new patient-provider relationships for treatment management
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Patient Selection */}
          <div className="space-y-3">
            <Label>Select Patient</Label>
            <Input
              placeholder="Search patients by name or email..."
              value={searchPatient}
              onChange={(e) => setSearchPatient(e.target.value)}
            />
            <Select value={selectedPatient} onValueChange={setSelectedPatient}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a patient" />
              </SelectTrigger>
              <SelectContent>
                {filteredPatients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.first_name} {patient.last_name} ({patient.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Provider Selection */}
          <div className="space-y-3">
            <Label>Select Provider</Label>
            <Input
              placeholder="Search providers by name, email, or specialty..."
              value={searchProvider}
              onChange={(e) => setSearchProvider(e.target.value)}
            />
            <Select value={selectedProvider} onValueChange={setSelectedProvider}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a provider" />
              </SelectTrigger>
              <SelectContent>
                {filteredProviders.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    Dr. {provider.first_name} {provider.last_name} - {provider.specialty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Treatment Type */}
          <div className="space-y-3">
            <Label>Treatment Type</Label>
            <Select value={treatmentType} onValueChange={setTreatmentType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {treatmentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Primary Care Designation */}
          <div className="space-y-3">
            <Label>Care Designation</Label>
            <Select value={isPrimary ? 'primary' : 'secondary'} onValueChange={(value) => setIsPrimary(value === 'primary')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="primary">Primary Provider</SelectItem>
                <SelectItem value="secondary">Secondary Provider</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {assignmentResult && (
          <Alert variant={assignmentResult.success ? "default" : "destructive"}>
            <AlertDescription>{assignmentResult.message}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end">
          <Button 
            onClick={handleAssignment} 
            disabled={loading || !selectedPatient || !selectedProvider}
            className="w-full md:w-auto"
          >
            {loading ? 'Assigning...' : 'Assign Patient to Provider'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}