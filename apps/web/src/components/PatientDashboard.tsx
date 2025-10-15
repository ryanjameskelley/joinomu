import { PatientDashboard as SidebarPatientDashboard, type ChecklistItem, type MedicationInfo, type AppointmentInfo, MedicationPreferencesDialog, type MedicationOption, VisitsBookingDialog, type MedicationPreference, type Provider, MedicationCard, showToast, AccountDialog } from '@joinomu/ui'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { authService } from '@joinomu/shared'

export function PatientDashboard() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  // Sample onboarding state - in real app this would come from database
  const [isOnboarded, setIsOnboarded] = useState(false)
  const [medicationDialogOpen, setMedicationDialogOpen] = useState(false)
  const [medicationLoading, setMedicationLoading] = useState(false)
  const [availableMedications, setAvailableMedications] = useState<MedicationOption[]>([])
  
  // Real data state for post-onboarding - support multiple medications
  const [realMedicationData, setRealMedicationData] = useState<{
    id: string
    medicationId: string
    name: string
    dosage: string
    supply: string
    status: 'pending' | 'approved' | 'denied'
    nextPrescriptionDue?: string
    fulfillmentStatus?: string
  }[]>([])
  const [realAppointmentData, setRealAppointmentData] = useState<{
    id: string
    doctorName: string
    visitType: string
    dateTime: string
    status: 'scheduled' | 'confirmed' | 'pending'
    appointmentDate: string
    startTime: string
    providerId: string
    treatmentType: string
    appointmentType: string
  }[]>([])
  
  // Appointment booking dialog state
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false)
  const [medicationPreferences, setMedicationPreferences] = useState<MedicationPreference[]>([])
  
  // Enhanced medication editing state
  const [editingMedication, setEditingMedication] = useState<{
    id: string
    medicationName: string
    dosage: string
  } | null>(null)
  const [providers, setProviders] = useState<Provider[]>([])
  const [appointmentLoading, setAppointmentLoading] = useState(false)
  
  // Reschedule appointment state
  const [isRescheduleMode, setIsRescheduleMode] = useState(false)
  const [appointmentToReschedule, setAppointmentToReschedule] = useState<{
    id: string
    providerId: string
    providerName: string
    appointmentDate: string
    startTime: string
    treatmentType: string
    appointmentType: string
  } | null>(null)
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([
    {
      id: 'plan',
      title: 'Select a plan',
      description: 'Choose the healthcare plan that fits your needs',
      completed: true, // Auto-completed for testing
    },
    {
      id: 'medication',
      title: 'Select medication preferences',
      description: "Select from the medications you're eligible for",
      completed: true, // Auto-completed for testing
    },
    {
      id: 'appointment',
      title: 'Schedule appointment',
      description: 'Book your first visit with a healthcare provider',
      completed: false,
    },
  ])

  // Sample medication and appointment data - in real app this would come from database
  const sampleMedication: MedicationInfo = {
    name: 'Semaglutide (Ozempic)',
    dosage: '0.5mg',
    frequency: 'Once weekly injection',
    status: 'pending',
    description: 'GLP-1 receptor agonist for type 2 diabetes and weight management',
    averageResults: {
      weightLoss: '12-15% body weight',
      bloodSugar: '1.5-2.0% HbA1c reduction',
      satisfaction: '85% patient satisfaction'
    }
  }

  const sampleAppointment: AppointmentInfo = {
    doctorName: 'Dr. Sarah Johnson',
    doctorTitle: 'Endocrinologist, MD',
    date: 'Tuesday, March 21, 2024',
    time: '2:30 PM EST',
    type: 'Initial Consultation',
    status: 'scheduled'
  }

  // Fetch real data when patient becomes onboarded OR when user loads (to check for existing data)
  useEffect(() => {
    console.log('🔍 useEffect trigger - isOnboarded:', isOnboarded, 'user?.id:', user?.id)
    if (user?.id) {
      console.log('✅ Calling fetchPostOnboardingData to check for existing medication data')
      fetchPostOnboardingData()
    } else {
      console.log('⚠️ Not calling fetchPostOnboardingData - no user?.id')
    }
  }, [user?.id])

  // Also fetch when onboarding completes
  useEffect(() => {
    if (isOnboarded && user?.id) {
      console.log('✅ Onboarding completed - refreshing medication data')
      fetchPostOnboardingData()
    }
  }, [isOnboarded, user?.id])

  const fetchPostOnboardingData = async () => {
    if (!user?.id) return

    try {
      console.log('🔄 Fetching post-onboarding data for user:', user.id)
      
      // Fetch medication preferences
      console.log('🔍 Fetching medication preferences...')
      const medicationResult = await authService.getPatientMedicationPreferences(user.id)
      console.log('🔍 Medication result:', medicationResult)
      
      if (medicationResult.data && medicationResult.data.length > 0) {
        console.log('✅ Setting REAL medication data from Supabase:', medicationResult.data)
        
        // Fetch estimated delivery dates from medication orders for each preference
        const medicationCards = await Promise.all(medicationResult.data.map(async (med: any, index: number) => {
          console.log(`🔍 Processing medication ${index}:`, med)
          console.log(`🔍 Raw medication_id field:`, med.medication_id)
          console.log(`🔍 All medication fields:`, Object.keys(med))
          console.log(`🔍 Medications object:`, med.medications)
          
          // Get the estimated delivery date and fulfillment status from the most recent medication order for this preference
          let estimatedDelivery = null
          let fulfillmentStatus = null
          try {
            const ordersResult = await authService.getOrdersByPreferenceId(med.id)
            if (ordersResult.data && ordersResult.data.length > 0) {
              // Get the most recent order
              const mostRecentOrder = ordersResult.data
                .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
              
              if (mostRecentOrder) {
                estimatedDelivery = mostRecentOrder.estimated_delivery
                fulfillmentStatus = mostRecentOrder.fulfillment_status
                console.log(`🔍 Found order data for ${med.medications?.name}:`, {
                  estimatedDelivery,
                  fulfillmentStatus,
                  rawOrder: mostRecentOrder
                })
              } else {
                console.log(`⚠️ No recent order found for ${med.medications?.name}, orders:`, ordersResult.data)
              }
            }
          } catch (error) {
            console.log(`⚠️ Could not fetch order data for medication ${med.medications?.name}:`, error)
          }
          
          const medicationCard = {
            id: med.id, // This is the preference ID
            medicationId: med.medication_id, // Keep the original medication ID for lookup
            name: med.medications?.name || 'Unknown Medication',
            dosage: med.preferred_dosage || 'Not specified',
            supply: med.supply_days ? `${med.supply_days} day supply` : '30 day supply',
            status: med.status || 'pending',
            estimatedDelivery: estimatedDelivery,
            fulfillmentStatus: fulfillmentStatus,
            nextPrescriptionDue: med.next_prescription_due,
            // Add additional fields for editing
            preferenceId: med.id,
            medicationInfo: med.medications,
            dosageInfo: med.medication_dosages
          }
          console.log(`📋 Final medication card for ${med.medications?.name}:`, medicationCard)
          return medicationCard
        }))
        console.log('✅ Final medication cards to display:', medicationCards)
        setRealMedicationData(medicationCards)
      } else {
        console.log('⚠️ No real medication preferences found - medicationResult:', medicationResult)
        console.log('⚠️ Using sample data for testing - this should NOT happen if data exists in Supabase')
        // Only use sample data if no real data exists
        setRealMedicationData([])
      }

      // Fetch scheduled appointments (only upcoming scheduled/confirmed visits)
      console.log('🔍 Fetching upcoming appointments...')
      const appointmentResult = await authService.getPatientAppointments(user.id, true)
      console.log('🔍 Upcoming appointment result:', appointmentResult)
      
      if (appointmentResult.data && appointmentResult.data.length > 0) {
        console.log(`✅ Found ${appointmentResult.data.length} upcoming scheduled appointments for patient`)
        const appointmentCards = appointmentResult.data.map((appointment: any, index: number) => {
          console.log(`🔍 Processing appointment ${index}:`, appointment)
          console.log(`🔍 Raw appointment data for appointment ${index}:`, JSON.stringify(appointment, null, 2))
          console.log(`🔍 Raw appointment keys:`, Object.keys(appointment))
          // Try different potential provider ID field names - add more fallback options
          const providerId = appointment.provider_id || 
                            appointment.provider_profile_id || 
                            appointment.assigned_provider_id || 
                            appointment.provider_internal_id ||
                            appointment.providerid ||
                            appointment.provider_uuid ||
                            'b692a67a-1356-43a8-a753-af4dd00fbf1d' // Fallback to known weight loss provider ID
          
          console.log(`🔍 Final providerId for appointment ${index}:`, providerId)
          
          const appointmentCard = {
            id: appointment.id, // Use id field from database
            doctorName: appointment.provider_name || 'Healthcare Provider',
            visitType: appointment.appointment_type || 'Initial Consultation',
            dateTime: `${appointment.appointment_date} at ${appointment.start_time}`,
            status: appointment.status || 'scheduled',
            appointmentDate: appointment.appointment_date,
            startTime: appointment.start_time,
            providerId: appointment.provider_id || providerId, // Use provider_id from database first
            treatmentType: appointment.treatment_type || 'weight_loss',
            appointmentType: appointment.appointment_type || 'consultation'
          }
          
          console.log(`🔍 Final appointment card ${index}:`, appointmentCard)
          return appointmentCard
        })
        console.log('✅ Setting all appointment data:', appointmentCards)
        setRealAppointmentData(appointmentCards)
      } else {
        console.log('⚠️ No upcoming scheduled appointments found')
        setRealAppointmentData([])
      }
    } catch (error) {
      console.error('❌ Error fetching post-onboarding data:', error)
    }
  }

  const handleLogout = async () => {
    try {
      console.log('🔄 Patient dashboard: Starting sign out...')
      await authService.signOut()
      console.log('✅ Patient dashboard: Sign out successful, navigating to home')
      navigate('/')
    } catch (error) {
      console.error('❌ Patient dashboard: Error signing out:', error)
      // Force navigation even if sign out fails
      navigate('/')
    }
  }

  const handleChecklistItemClick = async (item: ChecklistItem) => {
    console.log('Checklist item clicked:', item)
    
    // Prevent multiple simultaneous calls
    if (appointmentLoading) {
      console.log('⚠️ Already loading, ignoring click')
      return
    }
    
    if (item.id === 'medication') {
      // Open medication preferences dialog
      try {
        console.log('🔄 Fetching medications...')
        // Fetch available medications from Supabase
        const result = await authService.getAvailableMedications()
        console.log('🔍 Medications result:', result)
        console.log('🔍 Raw result.data:', JSON.stringify(result.data, null, 2))
        
        if (result.data && result.data.length > 0) {
          console.log('✅ Setting medications:', result.data)
          console.log('🔍 First medication sample:', result.data[0])
          console.log('🔍 First medication dosages:', result.data[0]?.medication_dosages)
          
          // Transform database data to match MedicationOption interface
          const transformedMedications = result.data.map((med, index) => {
            console.log(`🔍 Transforming medication ${index}:`, med.name)
            console.log(`🔍 Medication ${index} dosages:`, med.medication_dosages)
            
            const dosages = med.medication_dosages?.map(dosage => {
              console.log(`🔍 Processing dosage:`, dosage)
              return dosage.strength
            }) || []
            
            console.log(`🔍 Final dosages for ${med.name}:`, dosages)
            
            return {
              id: med.id,
              name: `${med.name} (${med.brand_name})`,
              description: med.description,
              category: med.category,
              available_dosages: dosages
            }
          })
          console.log('✅ Transformed medications:', transformedMedications)
          setAvailableMedications(transformedMedications)
        } else {
          console.log('❌ No medications data received:', result.error)
        }
        console.log('🔄 Opening dialog...')
        setMedicationDialogOpen(true)
        console.log('✅ Dialog open state set to true')
        console.log('✅ Dialog should be open now')
      } catch (error) {
        console.error('❌ Failed to load medications:', error)
      }
      return
    }
    
    if (item.id === 'appointment') {
      // Open appointment booking dialog
      if (!user?.id) {
        console.error('❌ No user ID available for appointment booking')
        return
      }
      
      try {
        setAppointmentLoading(true) // Set loading state to prevent multiple calls
        
        console.log('🔄 Loading real data before opening dialog...')
        
        // Set fallback providers first to ensure dialog can open
        const fallbackProviders = [
          {
            id: '1a3803f0-fe96-4649-8e2a-0e06a64c94c1', // Real Weight Loss provider ID from database
            name: 'Weight Loss Provider',
            specialty: 'Weight Loss',
            profile_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
            treatment_type: 'weight_loss',
            is_primary: true
          },
          {
            id: 'd1d66078-a1b4-4eda-8921-cfe09796804f', // Real General provider ID (can serve all treatment types)
            name: 'General Provider',
            specialty: 'General',
            profile_id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
            treatment_type: 'general',
            is_primary: false
          }
        ]
        setProviders(fallbackProviders)
        console.log('✅ Set fallback providers with real IDs')
        
        // Try to load real assigned providers with timeout
        try {
          console.log('🔍 Attempting to load real assigned providers...')
          const assignedResult = await Promise.race([
            authService.getPatientAssignedProviders(user.id),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Provider loading timeout')), 2000))
          ])
          
          if (assignedResult.data && assignedResult.data.length > 0) {
            console.log('✅ Found real assigned providers, updating:', assignedResult.data)
            setProviders(assignedResult.data)
          } else {
            console.log('⚠️ No assigned providers returned, keeping fallback')
          }
        } catch (error) {
          console.log('⚠️ Provider loading failed/timeout, using fallback with real IDs:', error.message)
          // Keep the fallback providers with real IDs we already set
        }
        
        // Set default medications first
        const defaultMedications = [
          {
            id: 'default-1',
            medication_name: 'Semaglutide',
            preferred_dosage: '0.5mg',
            status: 'approved' as const,
            treatment_type: 'weight_loss'
          },
          {
            id: 'default-2',
            medication_name: 'Testosterone',
            preferred_dosage: '200mg/ml',
            status: 'approved' as const,
            treatment_type: 'mens_health'
          }
        ]
        setMedicationPreferences(defaultMedications)
        console.log('✅ Set default medications')
        
        // Try to load real medication preferences with timeout
        try {
          console.log('🔍 Attempting to load real medication preferences...')
          const prefsResult = await Promise.race([
            authService.getPatientMedicationPreferences(user.id),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Medication preferences timeout')), 2000))
          ])
          
          if (prefsResult.data) {
            const approvedPrefs = prefsResult.data
              .filter((pref: any) => pref.status === 'approved')
              .map((pref: any) => ({
                id: pref.id,
                medication_name: pref.medication_name,
                preferred_dosage: pref.preferred_dosage,
                status: pref.status as 'approved',
                treatment_type: pref.treatment_type || 'weight_loss'
              }))
            if (approvedPrefs.length > 0) {
              console.log('✅ Found real medication preferences, updating:', approvedPrefs)
              setMedicationPreferences(approvedPrefs)
            } else {
              console.log('⚠️ No approved preferences found, keeping defaults')
            }
          } else {
            console.log('⚠️ No medication preferences data returned, keeping defaults')
          }
        } catch (error) {
          console.log('⚠️ Medication preferences loading failed/timeout, using defaults:', error.message)
        }
        
        console.log('🔄 Opening appointment dialog with data ready...')
        setAppointmentDialogOpen(true)
        console.log('✅ Dialog state set to open - should be visible now')
        
      } catch (error) {
        console.error('❌ Error in appointment dialog setup:', error)
      } finally {
        setAppointmentLoading(false) // Always reset loading state
      }
      
      return
    }
    
    // Update item as completed for demo purposes
    setChecklistItems(prev => prev.map(i => 
      i.id === item.id ? { ...i, completed: true } : i
    ))

    // Check if all items are completed
    const updatedItems = checklistItems.map(i => 
      i.id === item.id ? { ...i, completed: true } : i
    )
    const allCompleted = updatedItems.every(item => item.completed)
    if (allCompleted) {
      setIsOnboarded(true)
    }
  }


  const handleMedicationAction = () => {
    console.log('Medication action clicked')
    // In real app, would show medication details or update preferences
  }

  const handleEditMedication = (medicationId?: string) => {
    console.log('Edit medication clicked', medicationId)
    
    if (medicationId) {
      // Edit specific medication preference
      const medicationToEdit = realMedicationData.find(med => med.id === medicationId)
      console.log('🔍 PatientDashboard: medicationToEdit found:', medicationToEdit)
      if (medicationToEdit) {
        const editingData = {
          id: medicationToEdit.id, // This is the preference ID
          preferenceId: medicationToEdit.preferenceId, // Preference ID for updates
          medicationId: medicationToEdit.medicationId, // The actual medication ID for lookup
          medicationName: medicationToEdit.name,
          dosage: medicationToEdit.dosage,
          frequency: medicationToEdit.supply,
          status: medicationToEdit.status,
          // Include the full medication info for the dialog
          medicationInfo: medicationToEdit.medicationInfo,
          dosageInfo: medicationToEdit.dosageInfo
        }
        console.log('🔍 PatientDashboard: Setting editingMedication for preference:', editingData)
        setEditingMedication(editingData)
      }
    } else {
      // Add new medication
      setEditingMedication(null)
    }
    
    // Load available medications and open dialog
    loadMedicationsAndOpenDialog()
  }

  const loadMedicationsAndOpenDialog = async () => {
    try {
      console.log('🔄 Loading medications for dialog...')
      const result = await authService.getAvailableMedications()
      console.log('🔍 Edit mode medications result:', result)
      console.log('🔍 Edit mode raw result.data:', JSON.stringify(result.data, null, 2))
      
      if (result.data && result.data.length > 0) {
        console.log('✅ Edit mode: Setting medications:', result.data)
        console.log('🔍 Edit mode: First medication sample:', result.data[0])
        console.log('🔍 Edit mode: First medication dosages:', result.data[0]?.medication_dosages)
        
        // Transform database data to match MedicationOption interface (same as in checklist handler)
        const transformedMedications = result.data.map((med, index) => {
          console.log(`🔍 Edit mode: Transforming medication ${index}:`, med.name)
          console.log(`🔍 Edit mode: Medication ${index} dosages:`, med.medication_dosages)
          
          const dosages = med.medication_dosages?.map(dosage => {
            console.log(`🔍 Edit mode: Processing dosage:`, dosage)
            return dosage.strength
          }) || []
          
          console.log(`🔍 Edit mode: Final dosages for ${med.name}:`, dosages)
          
          return {
            id: med.id,
            name: `${med.name} (${med.brand_name})`,
            description: med.description,
            category: med.category,
            available_dosages: dosages
          }
        })
        console.log('✅ Edit mode: Transformed medications:', transformedMedications)
        setAvailableMedications(transformedMedications)
      } else {
        console.log('❌ Edit mode: No medications data received:', result.error)
      }
      setMedicationDialogOpen(true)
    } catch (error) {
      console.error('❌ Failed to load medications:', error)
    }
  }

  const handleEditAppointment = async (appointmentId?: string) => {
    console.log('Edit appointment clicked - opening reschedule dialog', appointmentId)
    
    if (!user?.id || !realAppointmentData || realAppointmentData.length === 0) {
      console.error('❌ No user ID or appointment data available for rescheduling')
      return
    }

    try {
      setAppointmentLoading(true)
      
      // Find the specific appointment to reschedule
      let appointmentToReschedule
      if (appointmentId) {
        appointmentToReschedule = realAppointmentData.find(apt => apt.id === appointmentId)
        if (!appointmentToReschedule) {
          console.error('❌ Could not find appointment with ID:', appointmentId)
          return
        }
      } else {
        // If no specific appointment ID, use the first one (fallback)
        appointmentToReschedule = realAppointmentData[0]
      }
      
      console.log('🔍 Selected appointment for rescheduling:', appointmentToReschedule)
      console.log('🔍 Appointment date details:', {
        appointmentDate: appointmentToReschedule.appointmentDate,
        startTime: appointmentToReschedule.startTime,
        doctorName: appointmentToReschedule.doctorName
      })
      
      // Get the correct provider internal ID by looking up the provider by profile_id
      console.log('🔍 Looking up provider by profile_id:', appointmentToReschedule.providerId)
      const providerLookupResult = await authService.getProviderByProfileId(appointmentToReschedule.providerId)
      
      let actualProviderId = appointmentToReschedule.providerId // fallback to profile_id
      if (providerLookupResult.data) {
        actualProviderId = providerLookupResult.data.id // Use the internal provider ID
        console.log('✅ Found provider internal ID:', actualProviderId)
      } else {
        console.log('⚠️ Could not find provider internal ID, using profile_id as fallback')
      }
      
      const appointmentData = {
        id: appointmentToReschedule.id,
        providerId: actualProviderId,
        providerName: appointmentToReschedule.doctorName,
        appointmentDate: appointmentToReschedule.appointmentDate,
        startTime: appointmentToReschedule.startTime,
        treatmentType: appointmentToReschedule.treatmentType,
        appointmentType: appointmentToReschedule.appointmentType
      }
      
      console.log('✅ Setting appointment data for reschedule:', appointmentData)
      setAppointmentToReschedule(appointmentData)
      setIsRescheduleMode(true)
      
      // Load providers (reuse existing logic)
      const fallbackProviders = [
        {
          id: actualProviderId,
          name: appointmentToReschedule.doctorName,
          specialty: 'General',
          profile_id: appointmentToReschedule.providerId,
          treatment_type: appointmentToReschedule.treatmentType,
          is_primary: true
        }
      ]
      setProviders(fallbackProviders)
      
      // Open the dialog in reschedule mode
      setAppointmentDialogOpen(true)
      console.log('✅ Reschedule dialog opened')
    } catch (error) {
      console.error('❌ Error setting up reschedule:', error)
      showToast({
        title: 'Error',
        description: 'An error occurred while preparing to reschedule your appointment',
        variant: 'error'
      })
    } finally {
      setAppointmentLoading(false)
    }
  }

  const handleMedicationPreferencesSubmit = async (preferences: { 
    medicationId: string; 
    dosage: string; 
    isEdit?: boolean; 
    preferenceId?: string 
  }) => {
    if (!user?.id) return

    setMedicationLoading(true)
    try {
      let result
      
      if (preferences.isEdit && editingMedication?.id) {
        // Update existing preference using patient-specific method - this will reset status to pending
        console.log('🔄 Updating existing medication preference (will reset to pending for provider review)')
        result = await authService.updatePatientMedicationPreference(
          editingMedication.id, 
          {
            dosage: preferences.dosage
          }
        )
      } else {
        // Create new preference 
        console.log('🔄 Creating new medication preference (will be pending for provider review)')
        result = await authService.createMedicationPreference({
          medicationId: preferences.medicationId,
          dosage: preferences.dosage,
          userId: user.id
        })
      }
      
      if (result.success) {
        console.log('✅ Medication preference saved successfully')
        
        // Show success toast
        const medicationName = editingMedication?.medicationName || 'Medication'
        showToast({
          title: preferences.isEdit ? 'Preference Updated' : 'Preference Added',
          description: `${medicationName} preference has been ${preferences.isEdit ? 'updated' : 'added'} and is pending provider review`,
          variant: 'success'
        })
        
        // Refresh medication data
        await fetchPostOnboardingData()
        
        // Mark medication checklist item as completed
        setChecklistItems(prev => prev.map(i => 
          i.id === 'medication' ? { ...i, completed: true } : i
        ))
        
        // Close dialog and reset editing state
        setMedicationDialogOpen(false)
        setEditingMedication(null)
      } else {
        console.error('❌ Failed to save medication preference:', result.error)
        showToast({
          title: 'Update Failed',
          description: result.error?.message || 'Failed to save medication preference',
          variant: 'error'
        })
      }
    } catch (error) {
      console.error('❌ Exception saving medication preference:', error)
      showToast({
        title: 'Error',
        description: 'An unexpected error occurred while saving your preference',
        variant: 'error'
      })
    } finally {
      setMedicationLoading(false)
    }
  }

  const handleAddAnotherMedication = async (preferences: { medicationId: string; dosage: string }) => {
    if (!user?.id) return

    setMedicationLoading(true)
    try {
      console.log('🔄 Adding additional medication preference')
      const result = await authService.createMedicationPreference({
        medicationId: preferences.medicationId,
        dosage: preferences.dosage,
        userId: user.id
      })
      
      if (result.success) {
        console.log('✅ Additional medication preference added successfully')
        
        // Refresh medication data to show new card (keeping existing ones visible)
        await fetchPostOnboardingData()
        
        // Keep dialog open for more additions
        // Form will be reset automatically by the dialog component
        // Note: The dashboard will show all medication cards including the new one
      } else {
        console.error('❌ Failed to add medication preference:', result.error)
      }
    } catch (error) {
      console.error('❌ Exception adding medication preference:', error)
    } finally {
      setMedicationLoading(false)
    }
  }
  
  const handleAppointmentBooking = async (appointmentData: {
    patientProfileId: string
    providerId: string
    appointmentDate: string
    startTime: string
    treatmentType: string
    medicationPreferenceId: string
    appointmentType: string
    patientNotes?: string
  }) => {
    if (!user?.id) return { success: false, message: 'User not authenticated' }
    
    setAppointmentLoading(true)
    try {
      console.log('🔄 Booking appointment:', appointmentData)
      
      const result = await authService.bookAppointment({
        patientProfileId: user.id,
        providerId: appointmentData.providerId,
        appointmentDate: appointmentData.appointmentDate,
        startTime: appointmentData.startTime,
        treatmentType: appointmentData.treatmentType,
        appointmentType: appointmentData.appointmentType,
        patientNotes: appointmentData.patientNotes
      })
      
      if (result.success) {
        console.log('✅ Appointment booked successfully')
        
        // Mark appointment checklist item as completed
        setChecklistItems(prev => {
          const updatedItems = prev.map(i => 
            i.id === 'appointment' ? { ...i, completed: true } : i
          )
          
          // Check if all checklist items are now completed
          const allCompleted = updatedItems.every(item => item.completed)
          if (allCompleted) {
            console.log('✅ All checklist items completed - transitioning to onboarded state')
            setIsOnboarded(true)
          }
          
          return updatedItems
        })
        
        // Close dialog
        setAppointmentDialogOpen(false)
        
        return { success: true, message: 'Appointment booked successfully', appointmentId: result.appointmentId }
      } else {
        console.error('❌ Failed to book appointment:', result.error)
        return { success: false, message: result.error?.message || 'Failed to book appointment' }
      }
    } catch (error) {
      console.error('❌ Exception booking appointment:', error)
      return { success: false, message: 'An error occurred while booking your appointment' }
    } finally {
      setAppointmentLoading(false)
    }
  }
  
  const handleGetAvailableSlots = async (
    providerId: string,
    startDate: string,
    endDate: string,
    treatmentType?: string
  ) => {
    try {
      console.log('🔄 Getting available slots for provider:', providerId)
      return await authService.getAvailableSlots(providerId, startDate, endDate, treatmentType)
    } catch (error) {
      console.error('❌ Exception getting available slots:', error)
      return { data: [], error }
    }
  }

  const handleRescheduleAppointment = async (appointmentData: {
    appointmentId: string
    appointmentDate: string
    startTime: string
  }) => {
    if (!user?.id) return { success: false, message: 'User not authenticated' }
    
    setAppointmentLoading(true)
    try {
      console.log('🔄 Rescheduling appointment:', appointmentData)
      
      const result = await authService.rescheduleAppointment(
        appointmentData.appointmentId,
        appointmentData.appointmentDate,
        appointmentData.startTime,
        'patient',
        user?.id,
        'Patient requested reschedule via web interface'
      )
      
      if (result.success) {
        console.log('✅ Appointment rescheduled successfully')
        
        // Refresh appointment data
        await fetchPostOnboardingData()
        
        // Close dialog and reset reschedule state
        setAppointmentDialogOpen(false)
        setIsRescheduleMode(false)
        setAppointmentToReschedule(null)
        
        showToast({
          title: 'Appointment Rescheduled',
          description: 'Your appointment has been successfully rescheduled',
          variant: 'success'
        })
        
        return { success: true, message: 'Appointment rescheduled successfully' }
      } else {
        console.error('❌ Failed to reschedule appointment:', result.error)
        return { success: false, message: result.error?.message || 'Failed to reschedule appointment' }
      }
    } catch (error) {
      console.error('❌ Exception rescheduling appointment:', error)
      return { success: false, message: 'An error occurred while rescheduling your appointment' }
    } finally {
      setAppointmentLoading(false)
    }
  }

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!user?.id) return { success: false, message: 'User not authenticated' }
    
    setAppointmentLoading(true)
    try {
      console.log('🔄 Cancelling appointment:', appointmentId)
      
      const result = await authService.cancelAppointment(
        appointmentId,
        'patient',
        user.id,
        'Patient requested cancellation'
      )
      
      if (result.success) {
        console.log('✅ Appointment cancelled successfully')
        
        // Refresh appointment data
        await fetchPostOnboardingData()
        
        // Close dialog and reset reschedule state
        setAppointmentDialogOpen(false)
        setIsRescheduleMode(false)
        setAppointmentToReschedule(null)
        
        showToast({
          title: 'Appointment Cancelled',
          description: 'Your appointment has been successfully cancelled',
          variant: 'success'
        })
        
        return { success: true, message: 'Appointment cancelled successfully' }
      } else {
        console.error('❌ Failed to cancel appointment:', result.error)
        return { success: false, message: result.error?.message || 'Failed to cancel appointment' }
      }
    } catch (error) {
      console.error('❌ Exception cancelling appointment:', error)
      return { success: false, message: 'An error occurred while cancelling your appointment' }
    } finally {
      setAppointmentLoading(false)
    }
  }

  const handleRequestRefill = async (medicationId: string) => {
    if (!user?.id) {
      console.error('❌ No user ID available for refill request')
      return
    }

    try {
      console.log('🔄 Requesting refill for medication:', medicationId)
      const result = await authService.requestPrescriptionRefill(medicationId, user.id)
      
      if (result.success) {
        console.log('✅ Refill requested successfully')
        showToast({
          title: 'Refill Requested',
          description: 'Your refill request has been submitted and is pending provider review',
          variant: 'success'
        })
        
        // Refresh medication data to show updated status
        await fetchPostOnboardingData()
      } else {
        console.error('❌ Failed to request refill:', result.error)
        showToast({
          title: 'Refill Request Failed',
          description: result.error?.message || 'Failed to submit refill request',
          variant: 'error'
        })
      }
    } catch (error) {
      console.error('❌ Exception requesting refill:', error)
      showToast({
        title: 'Error',
        description: 'An error occurred while requesting your refill',
        variant: 'error'
      })
    }
  }

  const handleNavigate = (itemOrUrl: string) => {
    console.log('Navigation clicked:', itemOrUrl)
    // Handle both item names and URLs
    if (itemOrUrl.startsWith('/')) {
      // It's a URL, navigate directly
      navigate(itemOrUrl)
    } else {
      // It's an item name, handle accordingly
      switch (itemOrUrl) {
        case 'Treatments':
          navigate('/treatments')
          break
        case 'Messaging':
          navigate('/messaging')
          break
        case 'Dashboard':
          navigate('/dashboard')
          break
        case 'Tracking':
          navigate('/treatments')
          break
        default:
          console.log('Unknown navigation item:', itemOrUrl)
      }
    }
  }

  // Account dialog state
  const [accountDialogOpen, setAccountDialogOpen] = useState(false)
  const [accountDialogSection, setAccountDialogSection] = useState('Account')

  const handleAccountClick = () => {
    setAccountDialogSection('Account')
    setAccountDialogOpen(true)
  }

  const handleBillingClick = () => {
    setAccountDialogSection('Billing and Plans')
    setAccountDialogOpen(true)
  }

  const handlePreferencesClick = () => {
    setAccountDialogSection('Preferences')
    setAccountDialogOpen(true)
  }

  // Extract user data for the dashboard
  const userData = user ? {
    name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Patient',
    email: user.email || '',
    avatar: user.user_metadata?.avatar_url || ''
  } : undefined

  // Debug current state
  console.log('🔍 PatientDashboard render - isOnboarded:', isOnboarded)
  console.log('🔍 PatientDashboard render - realMedicationData:', realMedicationData)
  console.log('🔍 PatientDashboard render - realMedicationData.length:', realMedicationData?.length)

  return (
    <>
      <SidebarPatientDashboard 
        user={userData} 
        onLogout={handleLogout}
        isOnboarded={isOnboarded}
        checklistItems={!isOnboarded ? checklistItems : undefined}
        onChecklistItemClick={handleChecklistItemClick}
        medication={isOnboarded ? sampleMedication : undefined}
        appointment={undefined} // Use only real appointment data, not sample data
        onRescheduleAppointment={handleRescheduleAppointment}
        onMedicationAction={handleMedicationAction}
        onNavigate={handleNavigate}
        // Simple card data for post-onboarding
        realMedicationData={realMedicationData}
        realAppointmentData={realAppointmentData}
        onEditMedication={handleEditMedication}
        onEditAppointment={handleEditAppointment}
        onAddMedication={() => handleEditMedication()}
        onRequestRefill={handleRequestRefill}
        onAccountClick={handleAccountClick}
        onBillingClick={handleBillingClick}
        onPreferencesClick={handlePreferencesClick}
      />
      <MedicationPreferencesDialog
        open={medicationDialogOpen}
        onOpenChange={(open) => {
          setMedicationDialogOpen(open)
          if (!open) {
            setEditingMedication(null)
          }
        }}
        medications={availableMedications}
        onSubmit={handleMedicationPreferencesSubmit}
        onAddAnother={handleAddAnotherMedication}
        loading={medicationLoading}
        editMode={!!editingMedication}
        isOnboarding={!isOnboarded}
        currentMedication={editingMedication}
      />
      <VisitsBookingDialog
        open={appointmentDialogOpen}
        onOpenChange={(open) => {
          setAppointmentDialogOpen(open)
          if (!open) {
            // Reset reschedule state when dialog closes
            setIsRescheduleMode(false)
            setAppointmentToReschedule(null)
          }
        }}
        patientProfileId={user?.id || ''}
        medicationPreferences={medicationPreferences}
        providers={providers}
        onBookAppointment={handleAppointmentBooking}
        onGetAvailableSlots={handleGetAvailableSlots}
        isRescheduleMode={isRescheduleMode}
        existingAppointment={appointmentToReschedule}
        onRescheduleAppointment={handleRescheduleAppointment}
      />
      <AccountDialog
        open={accountDialogOpen}
        onOpenChange={setAccountDialogOpen}
        activeSection={accountDialogSection}
        onSectionChange={setAccountDialogSection}
      />
    </>
  )
}