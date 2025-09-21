import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ProviderDashboard as ProviderDashboardComponent, type Patient } from '@joinomu/ui'
import { useAuth } from '@/hooks/useAuth'
import { authService } from '@joinomu/shared'
import { supabase } from '@/utils/supabase/client'

export function ProviderDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeItem, setActiveItem] = useState('Dashboard')
  const [providerData, setProviderData] = useState<any>(null)
  const [assignedPatients, setAssignedPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProviderData = async () => {
      if (user?.id) {
        // Use the working role detection to check if user is a provider
        const { roles, primaryRole } = await authService.fetchUserRoles(user.id)
        
        if (!roles.includes('provider')) {
          // User is not a provider, redirect to home
          navigate('/')
          setLoading(false)
          return
        }

        // If they are a provider, get provider details and patients
        let currentProviderData: any = null

        // Get provider details using RPC function to bypass RLS
        try {
          const { data: providerData, error: providerError } = await supabase
            .rpc('get_provider_by_user_id', { user_uuid: user.id })

          if (!providerError && providerData && providerData.length > 0) {
            currentProviderData = providerData[0]
            console.log('Provider data fetched via RPC:', currentProviderData)
          } else {
            console.log('No provider data found via RPC:', providerError)
          }
        } catch (error) {
          console.log('Error fetching provider data:', error)
        }

        // Set provider data (real or fallback)
        if (currentProviderData) {
          setProviderData(currentProviderData)
        } else {
          currentProviderData = {
            id: 'provider-' + user.id,
            first_name: 'Provider',
            last_name: 'User',
            email: user.email
          }
          setProviderData(currentProviderData)
        }

        // Fetch assigned patients - try direct query since RPC has type issues
        if (currentProviderData && currentProviderData.id) {
          try {
            console.log('Fetching patients for provider ID:', currentProviderData.id)
            const { data: patientsData, error: patientsError } = await supabase
              .from('patient_providers')
              .select(`
                treatment_type,
                assigned_date,
                is_primary,
                patients (
                  id,
                  first_name,
                  last_name,
                  email
                )
              `)
              .eq('provider_id', currentProviderData.id)

            if (!patientsError && patientsData) {
              console.log('Patients data fetched directly:', patientsData)
              // Filter out null patients and transform the data
              const transformedPatients: Patient[] = patientsData
                .filter((item: any) => item.patients !== null) // Filter out null patients
                .map((item: any) => ({
                  id: item.patients.id,
                  name: `${item.patients.first_name} ${item.patients.last_name}`,
                  careTeam: [`Dr. ${currentProviderData.first_name || 'Provider'} ${currentProviderData.last_name || 'User'}`],
                  treatments: [item.treatment_type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())],
                  medications: [], // Would need to fetch from a medications table
                  status: ['Active'], // Would need to fetch from patient status
                  treatmentType: item.treatment_type,
                  assignedDate: item.assigned_date,
                  isPrimary: item.is_primary,
                  email: item.patients.email
                }))
              
              console.log('Transformed patients:', transformedPatients)
              setAssignedPatients(transformedPatients)
            } else {
              console.log('No patients found directly:', patientsError)
              setAssignedPatients([])
            }
          } catch (patientsError) {
            console.log('Error fetching patients directly:', patientsError)
            setAssignedPatients([]) // Set empty array if can't fetch
          }
        }
      }
      setLoading(false)
    }

    fetchProviderData()
  }, [user, navigate])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/')
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
          <button onClick={() => navigate('/')} className="px-4 py-2 bg-blue-600 text-white rounded">Return to Home</button>
        </div>
      </div>
    )
  }

  const userData = {
    name: `${providerData.first_name} ${providerData.last_name}`,
    email: user?.email || '',
    avatar: ''
  }

  return (
    <ProviderDashboardComponent
      user={userData}
      onLogout={handleSignOut}
      activeItem={activeItem}
      showPatientTable={activeItem === 'Patients'}
      onNavigate={handleNavigate}
      providerId={providerData?.id}
      assignedPatients={assignedPatients}
    />
  )
}