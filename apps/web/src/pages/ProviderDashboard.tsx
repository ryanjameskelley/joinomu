import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ProviderDashboard as ProviderDashboardComponent, 
  type Patient,
  ProviderPatientInformationDialog,
  type ProviderPatientData
} from '@joinomu/ui'
import { useAuth } from '@/hooks/useAuth'
import { authService } from '@joinomu/shared'
import { supabase } from '@/utils/supabase/client'
import { MedicationToast, dismissToast } from '@joinomu/ui'

export function ProviderDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeItem, setActiveItem] = useState('Dashboard')
  const [providerData, setProviderData] = useState<any>(null)
  const [assignedPatients, setAssignedPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<ProviderPatientData | null>(null)
  const [isLoadingPatient, setIsLoadingPatient] = useState(false)

  useEffect(() => {
    const fetchProviderData = async () => {
      if (user?.id) {
        // Use the working role detection to check if user is a provider
        const userRole = await authService.getUserRole(user.id)
        
        if (userRole !== 'provider') {
          // User is not a provider, redirect to home
          navigate('/')
          setLoading(false)
          return
        }

        // Get provider profile and provider details
        const { data: profileData } = await authService.getUserProfile(user.id)
        const { data: providerData } = await authService.getRoleData(user.id, 'provider')

        if (profileData && providerData) {
          const currentProviderData = {
            id: providerData.id,
            profile_id: user.id,
            first_name: profileData.first_name,
            last_name: profileData.last_name,
            email: profileData.email,
            specialty: providerData.specialty,
            license_number: providerData.license_number,
            phone: providerData.phone,
            active: providerData.active
          }
          setProviderData(currentProviderData)
        } else {
          // Fallback if no data found
          const fallbackData = {
            id: 'provider-' + user.id,
            profile_id: user.id,
            first_name: 'Provider',
            last_name: 'User',
            email: user.email
          }
          setProviderData(fallbackData)
        }

        // Fetch assigned patients using the auth service function with medications
        if (user?.id) {
          try {
            console.log('Fetching assigned patients for provider profile ID:', user.id)
            const { data: patientsData, error: patientsError } = await authService.getAssignedPatients(user.id)

            if (!patientsError && patientsData) {
              console.log('Patients data fetched from auth service:', patientsData)
              console.log('First patient medications raw data:', patientsData[0]?.medications)
              
              // Transform the data to match the UI Patient interface
              const transformedPatients: Patient[] = patientsData.map((patient: any) => {
                console.log(`Transforming patient ${patient.first_name}: medications =`, patient.medications)
                return {
                  id: patient.patient_id || patient.id,
                  profile_id: patient.profile_id,
                  first_name: patient.first_name,
                  last_name: patient.last_name,
                  name: `${patient.first_name} ${patient.last_name}`,
                  email: patient.email,
                  phone: patient.phone,
                  date_of_birth: patient.date_of_birth,
                  has_completed_intake: patient.has_completed_intake,
                  careTeam: [`Dr. ${profileData?.first_name || 'Provider'} ${profileData?.last_name || 'User'}`],
                  treatments: [patient.treatment_type?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'General Care'],
                  medications: patient.medications || [],
                  status: ['Active'],
                  treatmentType: patient.treatment_type,
                  assigned_date: patient.assigned_date,
                  assignedDate: patient.assigned_date,
                  isPrimary: patient.is_primary,
                  created_at: patient.created_at
                }
              })
              
              console.log('Transformed patients with medications:', transformedPatients)
              console.log('First transformed patient medications:', transformedPatients[0]?.medications)
              setAssignedPatients(transformedPatients)
            } else {
              console.log('No patients found from auth service:', patientsError)
              setAssignedPatients([])
            }
          } catch (patientsError) {
            console.log('Error fetching patients from auth service:', patientsError)
            setAssignedPatients([])
          }
        }
      }
      setLoading(false)
    }

    fetchProviderData()
  }, [user, navigate])

  const handleSignOut = async () => {
    try {
      console.log('🔄 Provider dashboard: Starting sign out...')
      await authService.signOut()
      console.log('✅ Provider dashboard: Sign out successful, navigating to home')
      navigate('/')
    } catch (error) {
      console.error('❌ Provider dashboard: Error signing out:', error)
      // Force navigation even if sign out fails
      navigate('/')
    }
  }

  const handleNavigate = (item: string) => {
    setActiveItem(item)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p>Loading provider dashboard...</p>
        </div>
      </div>
    )
  }

  if (!providerData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">You don't have provider privileges.</p>
          <button onClick={() => navigate('/')} className="px-4 py-2 bg-primary text-primary-foreground rounded">Return to Home</button>
        </div>
      </div>
    )
  }

  const handlePatientClick = async (patient: Patient) => {
    // Prevent multiple simultaneous calls
    if (isLoadingPatient) {
      console.log('🔄 Already loading patient, ignoring click')
      return
    }
    
    // Fetch patient medication preferences
    try {
      console.log('🔍 Fetching medication preferences for patient:', patient.id)
      console.log('🔍 Current dialog state:', dialogOpen)
      setIsLoadingPatient(true)
      const result = await authService.getPatientMedicationPreferences(patient.id)
      console.log('🔍 Medication preferences result:', result)
      const { data: medicationPreferences } = result
      
      // Convert Patient to ProviderPatientData format including medication preferences
      const providerPatientData: ProviderPatientData = {
        id: patient.id,
        name: patient.name,
        email: patient.email,
        dateOfBirth: patient.date_of_birth,
        gender: patient.gender,
        patientId: patient.id,
        phone: patient.phone,
        treatmentType: patient.treatmentType,
        assignedDate: patient.assignedDate,
        isPrimary: patient.isPrimary,
        medicationPreferences: medicationPreferences || []
      }
      
      console.log('✅ Provider patient data with preferences:', providerPatientData)
      console.log('🔄 Setting selected patient and opening dialog...')
      setSelectedPatient(providerPatientData)
      setDialogOpen(true)
      console.log('🔄 Dialog should be open now')
    } catch (error) {
      console.error('❌ Error fetching patient medication preferences:', error)
      // Fallback to basic patient data without preferences
      const providerPatientData: ProviderPatientData = {
        id: patient.id,
        name: patient.name,
        email: patient.email,
        treatmentType: patient.treatmentType,
        assignedDate: patient.assignedDate,
        isPrimary: patient.isPrimary,
        patientId: patient.id,
        medicationPreferences: []
      }
      setSelectedPatient(providerPatientData)
      setDialogOpen(true)
    } finally {
      setIsLoadingPatient(false)
    }
  }

  const handleMedicationUpdate = async (medicationId: string, updates: {
    status?: string
    dosage?: string
    frequency?: string
    providerNotes?: string
  }) => {
    let savingToastId: string | number | undefined
    
    try {
      // Show saving toast
      savingToastId = MedicationToast.saving('medication preference')
      
      // Update the medication preference
      const result = await authService.updateMedicationPreference(medicationId, updates)
      
      if (savingToastId) {
        dismissToast(savingToastId)
      }
      
      if (result.success) {
        // Show success toast
        MedicationToast.saved('medication preference')
        
        // If status was changed to approved, show additional message
        if (updates.status === 'approved') {
          MedicationToast.saved('medication order created')
        }
        
        // Refresh the patient data to show updated medication preferences
        if (selectedPatient) {
          const { data: medicationPreferences } = await authService.getPatientMedicationPreferences(selectedPatient.id)
          setSelectedPatient(prev => prev ? {...prev, medicationPreferences: medicationPreferences || []} : null)
        }
      } else {
        MedicationToast.error('medication preference', result.error?.message || 'Unknown error')
      }
    } catch (error) {
      if (savingToastId) {
        dismissToast(savingToastId)
      }
      MedicationToast.error('medication preference', error instanceof Error ? error.message : 'Unknown error')
    }
  }

  const userData = {
    name: `${providerData.first_name} ${providerData.last_name}`,
    email: user?.email || '',
    avatar: ''
  }

  return (
    <>
      <ProviderDashboardComponent
        user={userData}
        onLogout={handleSignOut}
        activeItem={activeItem}
        showPatientTable={activeItem === 'Patients'}
        onNavigate={handleNavigate}
        providerId={providerData?.id}
        assignedPatients={assignedPatients}
        onPatientClick={handlePatientClick}
      />
      <ProviderPatientInformationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        patient={selectedPatient}
        onMedicationUpdate={handleMedicationUpdate}
      />
    </>
  )
}