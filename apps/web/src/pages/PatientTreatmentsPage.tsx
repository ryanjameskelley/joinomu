import { PatientTreatments, type MonthlyHistory, MedicationTrackingDialog, type MedicationTrackingEntry } from '@joinomu/ui'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { medicationTrackingService, patientsService, type CreateTrackingEntryData, type UpdateTrackingEntryData } from '@joinomu/shared'
import * as React from 'react'
import { toast } from 'sonner'

interface PatientTreatmentsPageProps {
  treatmentType?: string
}

export function PatientTreatmentsPage({ treatmentType = "Weight Loss" }: PatientTreatmentsPageProps) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [trackingDialogOpen, setTrackingDialogOpen] = React.useState(false)
  const [selectedMedication, setSelectedMedication] = React.useState<{name: string, dosage: string, id: string, frequency?: string} | null>(null)
  const [editingEntry, setEditingEntry] = React.useState<MedicationTrackingEntry | null>(null)
  const [realMedications, setRealMedications] = React.useState<any[]>([])
  const [trackingEntries, setTrackingEntries] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/')
    } catch (error) {
      console.error('Logout failed:', error)
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
        case 'Dashboard':
          navigate('/dashboard')
          break
        case 'Treatments':
          navigate('/treatments')
          break
        case 'WeightLoss':
          navigate('/treatments/weightloss')
          break
        case 'Mens Health':
          navigate('/treatments/mens-health')
          break
        case 'Messaging':
          navigate('/messaging')
          break
        default:
          console.log('Unknown navigation item:', itemOrUrl)
      }
    }
  }

  // Extract user data for the treatments page
  const userData = user ? {
    name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Patient',
    email: user.email || '',
    avatar: user.user_metadata?.avatar_url || ''
  } : undefined

  // Sample treatment data - in real app this would come from database
  const getTreatmentData = (type: string) => {
    if (type === "Mens Health" || type === "Men's Health") {
      return {
        nextShot: {
          medication: "Testosterone Cypionate",
          dosage: "200 mg",
          day: "Friday",
          time: "10:00 AM"
        },
        history: [
          {
            month: "December 2024",
            items: [
              {
                medication: "Testosterone Cypionate",
                dosage: "200 mg",
                date: "Friday",
                time: "10:00 AM"
              },
              {
                medication: "Testosterone Cypionate", 
                dosage: "200 mg",
                date: "Monday",
                time: "2:30 PM"
              }
            ]
          },
          {
            month: "November 2024",
            items: [
              {
                medication: "Testosterone Cypionate",
                dosage: "200 mg",
                date: "Thursday",
                time: "9:00 AM"
              },
              {
                medication: "Testosterone Cypionate",
                dosage: "200 mg", 
                date: "Monday",
                time: "11:15 AM"
              },
              {
                medication: "Testosterone Cypionate",
                dosage: "200 mg",
                date: "Friday",
                time: "3:45 PM"
              }
            ]
          },
          {
            month: "October 2024",
            items: [
              {
                medication: "Testosterone Cypionate",
                dosage: "200 mg",
                date: "Tuesday",
                time: "8:30 AM"
              },
              {
                medication: "Testosterone Cypionate",
                dosage: "200 mg",
                date: "Saturday",
                time: "1:00 PM"
              },
              {
                medication: "Testosterone Cypionate",
                dosage: "200 mg",
                date: "Wednesday",
                time: "4:20 PM"
              }
            ]
          }
        ]
      }
    }
    
    // Default: Weight Loss treatment
    return {
      nextShot: {
        medication: "Semaglutide (Ozempic)",
        dosage: "0.5 mg",
        day: "Monday",
        time: "8:00 AM"
      },
      history: [
        {
          month: "December 2024",
          items: [
            {
              medication: "Semaglutide (Ozempic)",
              dosage: "0.5 mg",
              date: "Wednesday",
              time: "6:00 PM"
            },
            {
              medication: "Semaglutide (Ozempic)",
              dosage: "0.5 mg",
              date: "Monday",
              time: "8:00 AM"
            },
            {
              medication: "Semaglutide (Ozempic)",
              dosage: "0.5 mg",
              date: "Friday",
              time: "7:30 AM"
            }
          ]
        },
        {
          month: "November 2024",
          items: [
            {
              medication: "Semaglutide (Ozempic)",
              dosage: "0.25 mg",
              date: "Wednesday",
              time: "6:00 PM"
            },
            {
              medication: "Semaglutide (Ozempic)",
              dosage: "0.25 mg",
              date: "Monday",
              time: "8:00 AM"
            },
            {
              medication: "Semaglutide (Ozempic)",
              dosage: "0.25 mg",
              date: "Friday",
              time: "7:30 AM"
            },
            {
              medication: "Semaglutide (Ozempic)",
              dosage: "0.25 mg",
              date: "Tuesday",
              time: "9:15 AM"
            }
          ]
        },
        {
          month: "October 2024",
          items: [
            {
              medication: "Semaglutide (Ozempic)",
              dosage: "0.25 mg",
              date: "Saturday",
              time: "7:00 AM"
            },
            {
              medication: "Semaglutide (Ozempic)",
              dosage: "0.25 mg",
              date: "Wednesday",
              time: "6:30 PM"
            }
          ]
        }
      ]
    }
  }

  // Load real medication data
  React.useEffect(() => {
    const loadMedicationData = async () => {
      if (!user) return
      
      try {
        setLoading(true)
        console.log('🔍 PatientTreatmentsPage: Starting to load medication data for user:', user.id)
        
        // Get patient medications
        console.log('🔍 PatientTreatmentsPage: Calling getPatientMedications...')
        const medicationsResult = await patientsService.getPatientMedications(user.id)
        console.log('🔍 PatientTreatmentsPage: Medications result:', medicationsResult)
        
        if (medicationsResult.success && medicationsResult.medications) {
          console.log('✅ PatientTreatmentsPage: Setting medications:', medicationsResult.medications)
          setRealMedications(medicationsResult.medications)
        } else {
          console.error('❌ PatientTreatmentsPage: Failed to fetch medications:', medicationsResult.error)
          setRealMedications([])
        }
        
        // Get tracking entries
        console.log('🔍 PatientTreatmentsPage: Calling getPatientTrackingEntries...')
        const entriesResult = await medicationTrackingService.getPatientTrackingEntries()
        console.log('🔍 PatientTreatmentsPage: Tracking entries result:', entriesResult)
        
        if (entriesResult.success && entriesResult.data) {
          console.log('✅ PatientTreatmentsPage: Setting tracking entries:', entriesResult.data)
          setTrackingEntries(entriesResult.data)
        } else {
          console.error('❌ PatientTreatmentsPage: Failed to fetch tracking entries:', entriesResult.error)
          setTrackingEntries([])
        }
      } catch (error) {
        console.error('💥 PatientTreatmentsPage: Critical error loading medication data:', error)
        setRealMedications([])
        setTrackingEntries([])
      } finally {
        console.log('🏁 PatientTreatmentsPage: Finished loading medication data')
        setLoading(false)
      }
    }
    
    loadMedicationData()
  }, [user])

  // Helper function to determine button text based on tracking history
  const getButtonText = (medicationId: string, entries: any[]): string => {
    // Check if this medication has any tracking entries
    const medicationEntries = (entries || []).filter(entry => entry?.medication_preference_id === medicationId)
    return medicationEntries.length > 0 ? "Take" : "Start Tracking"
  }

  // Helper function to calculate next due date
  const calculateNextDueDate = (medicationId: string, entries: any[], frequency: string): string | undefined => {
    try {
      console.log('🔍 calculateNextDueDate: medicationId:', medicationId, 'entries:', entries, 'frequency:', frequency)
      
      // Find the latest entry for this medication
      const medicationEntries = (entries || []).filter(entry => entry?.medication_preference_id === medicationId)
      console.log('🔍 Found medication entries:', medicationEntries)
      
      if (medicationEntries.length === 0) {
        console.log('🔍 No previous entries found for medication')
        return undefined // No previous entries
      }
      
      // Sort by date and get the most recent
      const latestEntry = medicationEntries.sort((a, b) => 
        new Date(b.taken_date).getTime() - new Date(a.taken_date).getTime()
      )[0]
      
      console.log('🔍 Latest entry:', latestEntry)
      
      const nextDate = medicationTrackingService.calculateNextDoseDate(latestEntry.taken_date, frequency)
      console.log('🔍 Calculated next date:', nextDate)
      
      return nextDate
    } catch (error) {
      console.error('❌ Error calculating next due date:', error)
      return undefined
    }
  }

  // Function to get real treatment data from database
  const getRealTreatmentData = (medications: any[], entries: any[], treatmentType: string) => {
    try {
      console.log('🔍 getRealTreatmentData: Starting with medications:', medications)
      console.log('🔍 getRealTreatmentData: Entries:', entries)
      console.log('🔍 getRealTreatmentData: Treatment type:', treatmentType)
      
      // Safely filter medications by treatment type
      const filteredMeds = (medications || []).filter(med => {
        try {
          if (!treatmentType || treatmentType === 'Weight Loss') {
            const medName = med?.medications?.name?.toLowerCase() || ''
            const result = medName.includes('semaglutide') || 
                   medName.includes('ozempic') ||
                   medName.includes('wegovy') ||
                   medName.includes('tirzepatide') ||
                   medName.includes('mounjaro')
            console.log('🔍 Medication filter result for', medName, ':', result)
            return result
          }
          return true // For now, include all for other treatment types
        } catch (filterError) {
          console.error('❌ Error filtering medication:', med, filterError)
          return false
        }
      })
      
      console.log('🔍 Filtered medications:', filteredMeds)
      
      // Get all approved medications for tracking
      const approvedMedications = filteredMeds.filter(med => med?.status === 'approved')
      console.log('🔍 All approved medications found:', approvedMedications)
      
      // For now, keep the first one as nextShot for compatibility with existing UI
      const nextMedication = approvedMedications[0]
      console.log('🔍 Primary medication for nextShot:', nextMedication)
      
      const nextShot = nextMedication ? {
        medication: nextMedication.medications?.name || 'Medication',
        dosage: nextMedication.preferred_dosage || 'Unknown dosage',
        day: 'Monday', // This could be calculated based on frequency
        time: '8:00 AM', // This could be user preference
        nextDueDate: calculateNextDueDate(nextMedication.id, entries || [], nextMedication.frequency || 'weekly'),
        buttonText: getButtonText(nextMedication.id, entries || []),
        onStartTracking: () => handleStartTracking({
          name: nextMedication.medications?.name || 'Medication',
          dosage: nextMedication.preferred_dosage || 'Unknown dosage',
          id: nextMedication.id,
          frequency: nextMedication.frequency || 'weekly'
        })
      } : null
      
      // Create additional medications list for multiple tracking cards
      const additionalMedications = approvedMedications.slice(1).map(med => ({
        medication: med.medications?.name || 'Medication',
        dosage: med.preferred_dosage || 'Unknown dosage',
        day: 'Monday',
        time: '8:00 AM',
        nextDueDate: calculateNextDueDate(med.id, entries || [], med.frequency || 'weekly'),
        buttonText: getButtonText(med.id, entries || []),
        onStartTracking: () => handleStartTracking({
          name: med.medications?.name || 'Medication',
          dosage: med.preferred_dosage || 'Unknown dosage',
          id: med.id,
          frequency: med.frequency || 'weekly'
        })
      }))
      
      console.log('🔍 Next shot data:', nextShot)
      
      // Convert tracking entries to history format
      const historyMap = new Map<string, any[]>()
      
      console.log('🔍 Processing tracking entries for history:', entries)
      
      ;(entries || []).forEach((entry: any) => {
        try {
          const date = new Date(entry.taken_date)
          const monthKey = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
          
          if (!historyMap.has(monthKey)) {
            historyMap.set(monthKey, [])
          }
          
          historyMap.get(monthKey)?.push({
            medication: entry.medication_preference?.medications?.name || 'Unknown Medication',
            dosage: entry.medication_preference?.preferred_dosage || 'Unknown dosage',
            date: date.toLocaleDateString('en-US', { weekday: 'long' }),
            time: entry.taken_time || 'No time recorded',
            notes: entry.notes || '',
            originalEntry: entry, // Keep reference to original entry for editing
            onEdit: () => handleEditEntry(entry)
          })
        } catch (entryError) {
          console.error('❌ Error processing tracking entry:', entry, entryError)
        }
      })
      
      const history = Array.from(historyMap.entries())
        .map(([month, items]) => ({ month, items }))
        .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
        .reverse() // Most recent first
      
      console.log('🔍 Final history data:', history)
      console.log('🔍 Additional medications:', additionalMedications)
      console.log('🔍 Returning treatment data:', { nextShot, additionalMedications, history })
      
      return { nextShot, additionalMedications, history }
    } catch (error) {
      console.error('💥 Error in getRealTreatmentData:', error)
      return { nextShot: null, additionalMedications: [], history: [] }
    }
  }

  const getTreatmentDataSafely = () => {
    try {
      if (loading) {
        console.log('🔍 Still loading, returning empty data')
        return { nextShot: null, additionalMedications: [], history: [] }
      }
      
      if (realMedications.length > 0) {
        console.log('🔍 Using real medication data')
        return getRealTreatmentData(realMedications, trackingEntries, treatmentType)
      } else {
        console.log('🔍 Using sample treatment data')
        // Add empty additionalMedications for sample data compatibility
        const sampleData = getTreatmentData(treatmentType)
        return { ...sampleData, additionalMedications: [] }
      }
    } catch (error) {
      console.error('💥 Error getting treatment data:', error)
      return { nextShot: null, additionalMedications: [], history: [] }
    }
  }

  const { nextShot, additionalMedications, history } = getTreatmentDataSafely()

  const handleStartTracking = (medication: {name: string, dosage: string, id: string, frequency?: string}) => {
    setSelectedMedication(medication)
    setEditingEntry(null)
    setTrackingDialogOpen(true)
  }

  const handleEditEntry = (entry: any) => {
    console.log('🔍 handleEditEntry called with entry:', entry)
    console.log('🔍 realMedications available:', realMedications)
    
    // Find the medication from realMedications using the medication_preference_id
    const medication = realMedications.find(med => med.id === entry.medication_preference_id)
    console.log('🔍 Found medication for entry:', medication)
    
    if (medication) {
      // Set the selected medication if not already set
      if (!selectedMedication) {
        const medicationData = {
          name: medication.medications?.name || 'Unknown Medication',
          dosage: medication.preferred_dosage || 'Unknown Dosage',
          id: medication.id,
          frequency: medication.frequency
        }
        console.log('🔍 Setting selectedMedication:', medicationData)
        setSelectedMedication(medicationData)
      }
      
      // Use the actual database entry data, not the formatted display data
      setEditingEntry({
        id: entry.id,
        medication_preference_id: entry.medication_preference_id,
        taken_date: entry.taken_date, // Use the actual YYYY-MM-DD format from database
        taken_time: entry.taken_time,
        notes: entry.notes || '',
        created_at: entry.created_at,
        updated_at: entry.updated_at
      })
      setTrackingDialogOpen(true)
    } else {
      console.error('❌ Could not find medication for entry:', entry)
    }
  }

  const handleSaveEntry = async (entryData: Omit<MedicationTrackingEntry, 'id'>) => {
    try {
      if (editingEntry) {
        // Update existing entry
        const updateData: UpdateTrackingEntryData = {
          taken_date: entryData.taken_date,
          taken_time: entryData.taken_time,
          notes: entryData.notes
        }
        const result = await medicationTrackingService.updateTrackingEntry(editingEntry.id, updateData)
        if (result.success) {
          toast.success('Tracking entry updated successfully')
        } else {
          toast.error(result.error?.message || 'Failed to update tracking entry')
        }
      } else {
        // Create new entry
        const createData: CreateTrackingEntryData = {
          medication_preference_id: entryData.medication_preference_id,
          taken_date: entryData.taken_date,
          taken_time: entryData.taken_time,
          notes: entryData.notes
        }
        const result = await medicationTrackingService.createTrackingEntry(createData)
        if (result.success) {
          toast.success('Medication tracked successfully')
        } else {
          toast.error(result.error?.message || 'Failed to track medication')
        }
      }
      
      // Reload tracking entries after saving
      const entriesResult = await medicationTrackingService.getPatientTrackingEntries()
      if (entriesResult.success && entriesResult.data) {
        setTrackingEntries(entriesResult.data)
      }
    } catch (error) {
      console.error('Error saving tracking entry:', error)
      toast.error('An unexpected error occurred')
    }
  }

  return (
    <>
      <PatientTreatments 
        user={userData}
        onLogout={handleLogout}
        onNavigate={handleNavigate}
        nextShot={{
          ...nextShot,
          onStartTracking: nextShot?.onStartTracking
        }}
        additionalMedications={additionalMedications || []}
        history={history.map(month => ({
          ...month,
          items: month.items.map(item => ({
            ...item,
            onEdit: () => handleEditEntry(item.originalEntry || item)
          }))
        }))}
        treatmentType={treatmentType}
      />
      
      {selectedMedication && (
        <MedicationTrackingDialog
          open={trackingDialogOpen}
          onOpenChange={setTrackingDialogOpen}
          medication={selectedMedication}
          entry={editingEntry}
          onSave={handleSaveEntry}
          isEditing={!!editingEntry}
        />
      )}
    </>
  )
}