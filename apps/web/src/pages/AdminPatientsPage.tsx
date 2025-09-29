import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  PatientTable, 
  type Patient, 
  Button,
  AppSidebar,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  Separator,
  EnhancedPatientInformationDialog,
  type PatientMedication
} from '@joinomu/ui'
import { useAuth } from '@/hooks/useAuth'
import { authService } from '@joinomu/shared'

export function AdminPatientsPage() {
  const { user, userRole } = useAuth()
  const navigate = useNavigate()
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [patientMedications, setPatientMedications] = useState<PatientMedication[]>([])
  const [patientPreferences, setPatientPreferences] = useState<any[]>([])
  const [patientOrders, setPatientOrders] = useState<any[]>([])
  const [patientAppointments, setPatientAppointments] = useState<any[]>([])
  const [providers, setProviders] = useState<any[]>([])

  useEffect(() => {
    // Redirect if not admin
    if (userRole && userRole !== 'admin') {
      navigate('/')
      return
    }

    if (userRole === 'admin') {
      fetchPatients()
    }
  }, [userRole, navigate])

  const fetchPatients = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await authService.getAllPatients()
      
      if (error) {
        setError('Failed to load patients: ' + error.message)
        console.error('Error fetching patients:', error)
      } else {
        // Transform the data to match the UI Patient interface
        const transformedPatients = (data || []).map((patient: any) => ({
          id: patient.patient_id || patient.id,
          profile_id: patient.profile_id,
          first_name: patient.first_name,
          last_name: patient.last_name,
          email: patient.email,
          phone: patient.phone,
          date_of_birth: patient.date_of_birth,
          has_completed_intake: patient.has_completed_intake,
          assigned_providers: patient.assigned_providers,
          treatment_types: patient.treatment_types,
          medications: patient.medications,
          created_at: patient.created_at
        }))
        console.log('Transformed patients data:', transformedPatients)
        setPatients(transformedPatients)
      }
    } catch (err) {
      setError('An unexpected error occurred while loading patients')
      console.error('Exception fetching patients:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch detailed medication data from database
  const fetchPatientMedications = async (patientId: string): Promise<PatientMedication[]> => {
    try {
      const { data, error } = await authService.getPatientMedicationsDetailed(patientId)
      
      if (error) {
        console.error('Error fetching detailed medications:', error)
        return []
      }

      return data.map((med: any) => ({
        id: med.order_id,
        name: med.medication_name,
        dosage: med.dosage,
        supply: med.supply,
        status: med.status,
        lastPaymentDate: med.last_payment_date,
        sentToPharmacyDate: med.sent_to_pharmacy_date,
        shippedToPharmacyDate: med.shipped_date,
        trackingNumber: med.tracking_number
      }))
    } catch (error) {
      console.error('Exception fetching detailed medications:', error)
      return []
    }
  }

  // Fetch patient medication preferences from database
  const fetchPatientPreferences = async (profileId: string) => {
    try {
      const { data, error } = await authService.getPatientMedicationPreferences(profileId)
      
      if (error) {
        console.error('Error fetching medication preferences:', error)
        return []
      }

      return data
    } catch (error) {
      console.error('Exception fetching medication preferences:', error)
      return []
    }
  }

  // Fetch patient medication orders from database
  const fetchPatientOrders = async (patientId: string) => {
    try {
      const { data, error } = await authService.getPatientMedicationOrders(patientId)
      
      if (error) {
        console.error('Error fetching medication orders:', error)
        return []
      }

      return data
    } catch (error) {
      console.error('Exception fetching medication orders:', error)
      return []
    }
  }

  // Fetch patient appointments from database
  const fetchPatientAppointments = async (profileId: string) => {
    try {
      const { data, error } = await authService.getPatientAppointments(profileId, true)
      
      if (error) {
        console.error('Error fetching patient appointments:', error)
        return []
      }

      return data
    } catch (error) {
      console.error('Exception fetching patient appointments:', error)
      return []
    }
  }

  // Fetch all providers for reschedule functionality
  const fetchProviders = async () => {
    try {
      const { data, error } = await authService.getAllProviders()
      
      if (error) {
        console.error('Error fetching providers:', error)
        return []
      }

      return data?.map(provider => ({
        id: provider.id,
        name: `${provider.first_name} ${provider.last_name}`,
        specialty: provider.specialty,
        profile_id: provider.profile_id
      })) || []
    } catch (error) {
      console.error('Exception fetching providers:', error)
      return []
    }
  }

  // Convert patient medications array to PatientMedication objects (fallback)
  const convertToPatientMedications = (medications?: string[]): PatientMedication[] => {
    if (!medications || medications.length === 0) return []
    
    return medications.map((medication, index) => ({
      id: `med_${index + 1}`,
      name: medication,
      dosage: '1mg', // Default dosage - would come from database in real app
      supply: '30 day supply', // Default supply - would come from database
      status: 'active' as const,
      lastPaymentDate: undefined,
      sentToPharmacyDate: undefined,
      shippedToPharmacyDate: undefined,
      trackingNumber: undefined
    }))
  }

  const handlePatientClick = async (patient: Patient) => {
    console.log('Patient clicked:', patient)
    setSelectedPatient(patient)
    setDialogOpen(true)
    
    // Try to fetch detailed medication data first, fallback to basic conversion
    try {
      const detailedMedications = await fetchPatientMedications(patient.id)
      if (detailedMedications.length > 0) {
        setPatientMedications(detailedMedications)
      } else {
        // Fallback to basic conversion if no detailed data found
        const medications = convertToPatientMedications(patient.medications)
        setPatientMedications(medications)
      }
    } catch (error) {
      console.error('Error loading medications, using fallback:', error)
      const medications = convertToPatientMedications(patient.medications)
      setPatientMedications(medications)
    }

    // Fetch medication preferences and orders
    try {
      const preferences = await fetchPatientPreferences(patient.profile_id)
      setPatientPreferences(preferences)
      console.log('Loaded patient preferences:', preferences)
    } catch (error) {
      console.error('Error loading medication preferences:', error)
      setPatientPreferences([])
    }

    try {
      const orders = await fetchPatientOrders(patient.id)
      setPatientOrders(orders)
      console.log('Loaded patient orders:', orders)
    } catch (error) {
      console.error('Error loading medication orders:', error)
      setPatientOrders([])
    }

    // Fetch patient appointments
    try {
      const appointments = await fetchPatientAppointments(patient.profile_id)
      setPatientAppointments(appointments)
      console.log('Loaded patient appointments:', appointments)
    } catch (error) {
      console.error('Error loading patient appointments:', error)
      setPatientAppointments([])
    }

    // Fetch providers for reschedule functionality
    try {
      const providersList = await fetchProviders()
      setProviders(providersList)
      console.log('Loaded providers for reschedule:', providersList)
    } catch (error) {
      console.error('Error loading providers:', error)
      setProviders([])
    }
  }

  const handleMedicationUpdate = async (medicationId: string, updates: Partial<PatientMedication>) => {
    // Store original values for potential revert
    const originalMedication = patientMedications.find(med => med.id === medicationId)
    
    // Update local state immediately for responsive UI
    setPatientMedications(prev => 
      prev.map(med => 
        med.id === medicationId ? { ...med, ...updates } : med
      )
    )
    
    // Save to database
    try {
      console.log('🔄 Starting database update for medication:', medicationId)
      const result = await authService.updateMedicationOrder(medicationId, {
        lastPaymentDate: updates.lastPaymentDate,
        sentToPharmacyDate: updates.sentToPharmacyDate,
        shippedToPharmacyDate: updates.shippedToPharmacyDate,
        trackingNumber: updates.trackingNumber
      })
      
      console.log('🔍 Database update result:', result)
      
      if (result.success) {
        console.log('✅ Medication updated successfully:', { medicationId, updates })
      } else {
        console.error('❌ Failed to update medication:', result.error)
        // Revert local state on failure
        if (originalMedication) {
          setPatientMedications(prev => 
            prev.map(med => 
              med.id === medicationId ? originalMedication : med
            )
          )
        }
        throw new Error(result.error?.message || 'Failed to update medication')
      }
    } catch (error) {
      console.error('❌ Exception updating medication:', error)
      // Revert local state on exception
      if (originalMedication) {
        setPatientMedications(prev => 
          prev.map(med => 
            med.id === medicationId ? originalMedication : med
          )
        )
      }
      throw error
    }
  }

  const handleAddPatient = () => {
    console.log('Add new patient')
    // TODO: Navigate to add patient page
    // navigate('/admin/patients/new')
  }

  const handleSignOut = async () => {
    await authService.signOut()
    navigate('/')
  }

  const handleRescheduleAppointment = async (appointmentData: {
    appointmentId: string
    appointmentDate: string
    startTime: string
  }) => {
    try {
      const result = await authService.rescheduleAppointment(
        appointmentData.appointmentId,
        appointmentData.appointmentDate,
        appointmentData.startTime,
        'admin',
        user?.id
      )
      
      if (result.success) {
        // Refresh appointments data
        if (selectedPatient) {
          const appointments = await fetchPatientAppointments(selectedPatient.profile_id)
          setPatientAppointments(appointments)
        }
      }
      
      return result
    } catch (error) {
      console.error('Error rescheduling appointment:', error)
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to reschedule appointment'
      }
    }
  }

  const handleGetAvailableSlots = async (
    providerId: string,
    startDate: string,
    endDate: string,
    treatmentType?: string
  ) => {
    try {
      const result = await authService.getAvailableSlots(providerId, startDate, endDate, treatmentType)
      return result
    } catch (error) {
      console.error('Error getting available slots:', error)
      return { data: [], error }
    }
  }

  if (userRole && userRole !== 'admin') {
    return null // Will redirect
  }

  const userData = {
    name: user?.email?.split('@')[0] || 'Admin',
    email: user?.email || 'admin@example.com',
    avatar: ''
  }

  return (
    <SidebarProvider>
      <AppSidebar 
        user={userData}
        onLogout={handleSignOut}
        userRole="admin"
        onNavigate={(item) => {
          if (item === 'Dashboard') navigate('/admin/dashboard')
          else if (item === 'Messaging') navigate('/admin/messaging')
        }}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Patient Management</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 bg-card">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Patient Management</h1>
              <p className="text-muted-foreground">
                {loading ? "Loading patients..." : `Manage all patients in the system. Total: ${patients.length} patients`}
              </p>
            </div>
            
            {error && (
              <div className="border border-destructive/20 bg-destructive/10 rounded-lg p-4">
                <p className="text-destructive">{error}</p>
                <Button onClick={fetchPatients} className="mt-4">
                  Try Again
                </Button>
              </div>
            )}
            
            <PatientTable
              patients={patients}
              loading={loading}
              showSearch={true}
              showAddButton={true}
              onAddPatient={handleAddPatient}
              onPatientClick={handlePatientClick}
              searchPlaceholder="Search patients by name, email, or phone..."
              addButtonLabel="Add New Patient"
              emptyStateText="No patients found. Add your first patient to get started."
            />
          </div>
        </div>
      </SidebarInset>
      
      {/* Enhanced Patient Information Dialog with Medications */}
      <EnhancedPatientInformationDialog
        patient={selectedPatient}
        medications={patientMedications}
        preferredMedications={patientPreferences}
        medicationOrders={patientOrders}
        appointments={patientAppointments}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        isAdmin={true}
        onMedicationUpdate={handleMedicationUpdate}
        onRescheduleAppointment={handleRescheduleAppointment}
        onGetAvailableSlots={handleGetAvailableSlots}
        providers={providers}
        medicationPreferences={patientPreferences}
        initialSection="Information"
      />
    </SidebarProvider>
  )
}