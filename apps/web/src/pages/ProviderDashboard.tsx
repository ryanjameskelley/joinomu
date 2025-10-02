import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ProviderDashboard as ProviderDashboardComponent, 
  type Patient,
  ProviderPatientInformationDialog,
  type ProviderPatientData,
  type ProviderVisit
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
  const [dialogInitialTab, setDialogInitialTab] = useState<string | undefined>(undefined)
  const [dialogInitialVisitId, setDialogInitialVisitId] = useState<string | undefined>(undefined)
  const [dialogInitialMedicationId, setDialogInitialMedicationId] = useState<string | undefined>(undefined)

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

        // Get combined provider and profile data
        const { data: providerData, error: providerError } = await authService.getUserProfile()

        if (providerData && !providerError) {
          setProviderData(providerData)
        } else {
          console.warn('Provider data not found:', providerError)
          // Fallback if no data found
          const fallbackData = {
            id: 'provider-' + user.id,
            profile_id: user.id,
            first_name: 'Provider',
            last_name: 'User',
            email: user.email,
            specialty: 'General Practice'
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
                  careTeam: [`Dr. ${providerData?.first_name || 'Provider'} ${providerData?.last_name || 'User'}`],
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
              console.log('🔍 PROVIDER DASHBOARD: Setting assigned patients for approvals check:', transformedPatients.map(p => ({ 
                id: p.id, 
                name: p.name, 
                profile_id: p.profile_id,
                has_completed_intake: p.has_completed_intake
              })))
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
    
    // Clear any initial tab/ID settings when opening from patient table
    // This ensures clicks from the patient table always start at "Patient Information"
    setDialogInitialTab(undefined)
    setDialogInitialVisitId(undefined)
    setDialogInitialMedicationId(undefined)
    
    // Fetch patient medication preferences and appointments
    try {
      console.log('🔍 Fetching patient data for:', patient.id)
      console.log('🔍 Current dialog state:', dialogOpen)
      setIsLoadingPatient(true)
      
      // Fetch medication preferences using profile_id (auth user ID)
      console.log('🔍 Using patient.profile_id for medication preferences:', patient.profile_id)
      const medicationResult = await authService.getPatientMedicationPreferences(patient.profile_id)
      console.log('🔍 Medication preferences result:', medicationResult)
      const { data: medicationPreferences } = medicationResult
      
      // Fetch patient appointments (visits) using the profile_id from patient data
      console.log('🔍 Fetching patient appointments for visits...')
      console.log('🔍 Patient object:', patient)
      console.log('🔍 Available patient.profile_id:', patient.profile_id)
      
      let visits: any[] = []
      try {
        // Use the profile_id that's already available from the patient data
        const patientProfileId = patient.profile_id
        console.log('🔍 Using patient.profile_id for appointments:', patientProfileId)
        
        const appointmentsResult = await authService.getPatientAppointments(patientProfileId, true)
        console.log('🔍 Patient appointments result:', appointmentsResult)
        
        if (appointmentsResult.data) {
          // Convert appointments to PatientVisit format and sort by most recent first
          visits = appointmentsResult.data
            .map((appt: any) => ({
              id: appt.appointment_id || appt.id,  // Use appointment_id from RPC result
              appointment_date: appt.appointment_date,
              start_time: appt.start_time,
              appointment_type: appt.appointment_type || 'consultation',
              treatment_type: appt.treatment_type,
              status: appt.status,
              provider_notes: appt.provider_notes,
              patient_notes: appt.patient_notes
            }))
            .sort((a, b) => {
              // Sort by date descending, then by time descending (most recent first)
              const dateCompare = new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime()
              if (dateCompare === 0) {
                // Same date, compare times
                return b.start_time.localeCompare(a.start_time)
              }
              return dateCompare
            })
          console.log(`✅ Converted and sorted ${visits.length} appointments (most recent first)`)
        }
      } catch (appointmentError) {
        console.warn('⚠️ Error fetching patient appointments:', appointmentError)
        // Continue without appointments - they'll show as "no visits"
      }
      
      // Convert Patient to ProviderPatientData format including medication preferences and visits
      const providerPatientData: ProviderPatientData = {
        id: patient.id,
        profile_id: patient.profile_id,
        name: patient.name,
        email: patient.email,
        dateOfBirth: patient.date_of_birth,
        gender: patient.gender,
        patientId: patient.id,
        phone: patient.phone,
        treatmentType: patient.treatmentType,
        assignedDate: patient.assignedDate,
        isPrimary: patient.isPrimary,
        medicationPreferences: medicationPreferences || [],
        visits: visits
      }
      
      console.log('✅ Provider patient data with preferences:', providerPatientData)
      console.log('🔄 Setting selected patient and opening dialog...')
      setSelectedPatient(providerPatientData)
      setDialogOpen(true)
      console.log('🔄 Dialog should be open now')
    } catch (error) {
      console.error('❌ Error fetching patient data:', error)
      // Fallback to basic patient data without preferences or visits
      const providerPatientData: ProviderPatientData = {
        id: patient.id,
        name: patient.name,
        email: patient.email,
        treatmentType: patient.treatmentType,
        assignedDate: patient.assignedDate,
        isPrimary: patient.isPrimary,
        patientId: patient.id,
        medicationPreferences: [],
        visits: []
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
    faxed?: boolean
    supplyDays?: number
  }) => {
    let savingToastId: string | number | undefined
    
    try {
      // Show saving toast
      savingToastId = MedicationToast.saving('medication preference')
      
      // Update the medication preference (pass provider ID for approval/order creation)
      const result = await authService.updateMedicationPreference(medicationId, updates, providerData?.id)
      
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
          // Find the patient in the assigned patients list to get their profile_id
          const patientInList = assignedPatients.find(p => p.id === selectedPatient.id)
          if (patientInList?.profile_id) {
            const { data: medicationPreferences } = await authService.getPatientMedicationPreferences(patientInList.profile_id)
            setSelectedPatient(prev => prev ? {...prev, medicationPreferences: medicationPreferences || []} : null)
          }
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

  const handleApprovalAction = async (preferenceId: string, action: 'approve' | 'deny') => {
    let savingToastId: string | number | undefined
    
    try {
      // Show saving toast
      savingToastId = MedicationToast.saving('medication approval')
      
      // Update the medication preference status
      const updates = {
        status: action === 'approve' ? 'approved' : 'denied',
        providerNotes: action === 'approve' ? 'Approved by provider' : 'Denied by provider'
      }
      
      const result = await authService.updateMedicationPreference(preferenceId, updates, providerData?.id)
      
      if (savingToastId) {
        dismissToast(savingToastId)
      }
      
      if (result.success) {
        // Show success toast
        MedicationToast.saved(`medication ${action}d`)
        
        if (action === 'approve') {
          MedicationToast.saved('medication order created')
        }
      } else {
        MedicationToast.error('medication approval', result.error?.message || 'Unknown error')
      }
    } catch (error) {
      if (savingToastId) {
        dismissToast(savingToastId)
      }
      MedicationToast.error('medication approval', error instanceof Error ? error.message : 'Unknown error')
    }
  }

  const handleVisitClick = async (visit: ProviderVisit) => {
    console.log('Visit clicked:', visit)
    // Find the patient by patient_id from the visit
    const patient = assignedPatients.find(p => p.id === visit.patient_id)
    if (!patient) {
      console.error('Patient not found for visit:', visit)
      return
    }
    
    // Open the patient dialog with Visits tab and auto-select the specific visit
    await handlePatientClick(patient)
    setDialogInitialTab('Visits')
    setDialogInitialVisitId(visit.id)
  }

  const handleMedicationClick = async (preference: any) => {
    console.log('Medication preference clicked:', preference)
    // Find the patient by patient_id from the preference
    const patient = assignedPatients.find(p => p.name === preference.patient_name)
    if (!patient) {
      console.error('Patient not found for medication preference:', preference)
      return
    }
    
    // Open the patient dialog with Medications tab and auto-select the specific medication
    await handlePatientClick(patient)
    setDialogInitialTab('Medications')
    setDialogInitialMedicationId(preference.id)
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
        providerId={providerData?.profile_id}
        assignedPatients={assignedPatients}
        onPatientClick={handlePatientClick}
        onApprovalAction={handleApprovalAction}
        onVisitClick={handleVisitClick}
        onMedicationClick={handleMedicationClick}
      />
      <ProviderPatientInformationDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) {
            // Clear state when dialog closes
            setDialogInitialTab(undefined)
            setDialogInitialVisitId(undefined)
            setDialogInitialMedicationId(undefined)
          }
        }}
        patient={selectedPatient}
        providerId={providerData?.profile_id}
        initialTab={dialogInitialTab}
        initialVisitId={dialogInitialVisitId}
        initialMedicationId={dialogInitialMedicationId}
        onMedicationUpdate={handleMedicationUpdate}
      />
    </>
  )
}