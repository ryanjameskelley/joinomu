import { PatientTreatments, type MonthlyHistory, MedicationTrackingDialog, type MedicationTrackingEntry, type MedicationOption, MetricsTracking } from '@joinomu/ui'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { medicationTrackingService, patientsService, healthMetricsService, type CreateTrackingEntryData, type UpdateTrackingEntryData, type HealthMetricData } from '@joinomu/shared'
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
  const [selectedMedications, setSelectedMedications] = React.useState<string[]>([])
  const [metricsDialogOpen, setMetricsDialogOpen] = React.useState(false)
  const [healthMetricsData, setHealthMetricsData] = React.useState<any[]>([])
  const [currentMetricType, setCurrentMetricType] = React.useState<string>('weight')


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

  // Load health metrics data
  const loadHealthMetrics = React.useCallback(async (metricType: string = 'weight') => {
    console.log('🔍 loadHealthMetrics called with:', { metricType, userId: user?.id })
    if (!user) {
      console.log('🔍 No user, exiting loadHealthMetrics')
      return
    }
    
    try {
      // Get patient record first 
      const { success, patient, error } = await patientsService.getPatientProfile(user.id)
      if (!success || !patient?.id) {
        console.error('❌ Error getting patient profile:', error)
        setHealthMetricsData([])
        return
      }
      
      console.log('🔍 Using patient ID:', patient.id)

      // Get health metrics for the specified type (generous date range to catch all data)
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + 30) // Future buffer
      const startDate = new Date(2024, 0, 1) // January 1st, 2024 (fixed year)

      // Map metric types to database types
      const metricTypeMap: Record<string, string> = {
        'weight': 'weight',
        'steps': 'steps', 
        'sleep': 'sleep',
        'calories': 'calories',
        'protein': 'protein',
        'sugar': 'sugar',
        'water': 'water',
        'heart-rate': 'heart_rate'
      }

      const dbMetricType = metricTypeMap[metricType] || 'weight'

      console.log('🔍 Loading health metrics:', {
        metricType,
        dbMetricType,
        patientId: patient.id,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      })

      console.log('🚨 ABOUT TO CALL HEALTH METRICS SERVICE with params:', {
        patientId: patient.id,
        metricTypes: [dbMetricType],
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 1000
      })

      let metricsResult
      try {
        console.log('🔍 Using fetch API directly to bypass client issues...')
        
        // Use direct fetch API to avoid Supabase client conflicts
        const apiUrl = 'http://127.0.0.1:54321/rest/v1/patient_health_metrics'
        const headers = {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
          'Content-Type': 'application/json'
        }
        
        const queryParams = new URLSearchParams({
          'patient_id': `eq.${patient.id}`,
          'metric_type': `eq.${dbMetricType}`,
          'recorded_at': `gte.${startDate.toISOString()}`,
          'recorded_at': `lte.${endDate.toISOString()}`,
          'order': 'recorded_at.desc',
          'limit': '1000'
        })
        
        console.log('🔍 Executing direct fetch API call...')
        console.log('🔍 API URL:', `${apiUrl}?${queryParams.toString()}`)
        
        const response = await fetch(`${apiUrl}?${queryParams.toString()}`, {
          method: 'GET',
          headers: headers
        })
        
        console.log('🚨 FETCH RESPONSE STATUS:', response.status, response.statusText)
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('❌ Fetch error:', errorText)
          metricsResult = { success: false, error: `HTTP ${response.status}: ${errorText}`, metrics: [] }
        } else {
          const rawMetrics = await response.json()
          console.log('✅ Fetch success. Raw data count:', rawMetrics?.length)
          console.log('✅ Raw data sample:', rawMetrics?.slice(0, 3))
          
          // Transform to expected format
          const transformedMetrics = (rawMetrics || []).map(metric => ({
            patientId: metric.patient_id,
            metricType: metric.metric_type,
            value: metric.value,
            unit: metric.unit,
            recordedAt: metric.recorded_at,
            syncedFrom: metric.synced_from,
            metadata: metric.metadata
          }))
          
          metricsResult = { success: true, metrics: transformedMetrics }
        }
        
        console.log('🚨 TRANSFORMED METRICS RESULT:', metricsResult)
        console.log('🔍 Success?', metricsResult.success)
        console.log('🔍 Error?', metricsResult.error)
        console.log('🔍 Number of metrics returned:', metricsResult.metrics?.length || 0)
      } catch (serviceError) {
        console.error('🚨 DIRECT QUERY THREW ERROR:', serviceError)
        console.error('🚨 Error stack:', serviceError.stack)
        metricsResult = { success: false, error: 'Direct query failed', metrics: [] }
      }
      
      if (metricsResult && metricsResult.metrics && metricsResult.metrics.length > 0) {
        console.log('🔍 First few raw metrics:', metricsResult.metrics.slice(0, 3))
        console.log('🔍 Date range in raw metrics:', {
          first: metricsResult.metrics[0]?.recordedAt,
          last: metricsResult.metrics[metricsResult.metrics.length - 1]?.recordedAt
        })
      }

      if (metricsResult.success && metricsResult.metrics && metricsResult.metrics.length > 0) {
        console.log('🔍 Raw metrics from service (first 5):', metricsResult.metrics.slice(0, 5))
        console.log('🔍 Raw metrics from service (all dates):', metricsResult.metrics.map(m => m.recordedAt))
        
        // Transform to chart format
        const chartData = metricsResult.metrics.map(metric => ({
          date: metric.recordedAt.split('T')[0], // Convert to YYYY-MM-DD format
          value: metric.value,
          unit: metric.unit
        }))
        
        // Sort by date ascending for proper chart display
        chartData.sort((a, b) => a.date.localeCompare(b.date))
        
        console.log('🔍 Transformed chart data (total count):', chartData.length)
        console.log('🔍 Chart data date range:', {
          first: chartData[0]?.date,
          last: chartData[chartData.length - 1]?.date
        })
        console.log('🔍 Chart data sample (first 3, last 3):', {
          first3: chartData.slice(0, 3),
          last3: chartData.slice(-3)
        })
        
        // Check for recent data (last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const recentData = chartData.filter(d => new Date(d.date) >= thirtyDaysAgo)
        console.log('🔍 Data in last 30 days:', recentData.length, 'items')
        console.log('🔍 Recent dates:', recentData.map(d => d.date).slice(0, 10))
        
        console.log('🚨 SETTING HEALTH METRICS DATA:', {
          dataLength: chartData.length,
          sampleData: chartData.slice(0, 3),
          metricType: metricType
        })
        setHealthMetricsData(chartData)
      } else {
        console.log('🔍 No real data found, setting empty array')
        setHealthMetricsData([])
      }
    } catch (error) {
      console.error('Error loading health metrics:', error)
      setHealthMetricsData([])
    }
  }, [user])

  // Load real medication data
  // Force load health metrics on mount
  React.useEffect(() => {
    if (user) {
      console.log('🚨 FORCE LOADING HEALTH METRICS ON MOUNT')
      loadHealthMetrics(currentMetricType)
    }
  }, [user, loadHealthMetrics, currentMetricType])

  React.useEffect(() => {
    const loadMedicationData = async () => {
      if (!user) return
      
      try {
        setLoading(true)
        console.log('🔍 PatientTreatmentsPage: Starting to load medication data for user:', user.id)
        
        // Get patient medications
        console.log('🔍 PatientTreatmentsPage: Calling getPatientMedications...')
        try {
          const medicationsResult = await patientsService.getPatientMedications(user.id)
          console.log('🔍 PatientTreatmentsPage: Medications result:', medicationsResult)
          
          if (medicationsResult.success && medicationsResult.medications) {
            console.log('✅ PatientTreatmentsPage: Setting medications:', medicationsResult.medications)
            setRealMedications(medicationsResult.medications)
          } else {
            console.error('❌ PatientTreatmentsPage: Failed to fetch medications:', medicationsResult.error)
            setRealMedications([])
          }
          console.log('🔍 PatientTreatmentsPage: Finished processing medications, moving to tracking entries...')
        } catch (medicationError) {
          console.error('💥 PatientTreatmentsPage: Exception in getPatientMedications:', medicationError)
          setRealMedications([])
        }
        
        // Get tracking entries
        console.log('🔍 PatientTreatmentsPage: About to call getPatientTrackingEntries...')
        console.log('🔍 PatientTreatmentsPage: medicationTrackingService exists?', !!medicationTrackingService)
        console.log('🔍 PatientTreatmentsPage: getPatientTrackingEntries method exists?', typeof medicationTrackingService.getPatientTrackingEntries)
        
        try {
          console.log('🔍 PatientTreatmentsPage: Calling getPatientTrackingEntries...')
          const entriesResult = await medicationTrackingService.getPatientTrackingEntries()
          console.log('🔍 PatientTreatmentsPage: Tracking entries result:', entriesResult)
          console.log('🔍 PatientTreatmentsPage: Tracking entries success:', entriesResult.success)
          console.log('🔍 PatientTreatmentsPage: Tracking entries data length:', entriesResult.data?.length || 0)
          
          if (!entriesResult.success) {
            console.error('❌ PatientTreatmentsPage: Failed to fetch tracking entries:', entriesResult.error)
            setTrackingEntries([])
          } else if (entriesResult.success && entriesResult.data) {
            console.log('✅ PatientTreatmentsPage: Setting tracking entries:', entriesResult.data)
            setTrackingEntries(entriesResult.data)
          } else {
            console.log('⚠️ PatientTreatmentsPage: No tracking entries data')
            setTrackingEntries([])
          }
        } catch (trackingError) {
          console.error('💥 PatientTreatmentsPage: Exception in getPatientTrackingEntries:', trackingError)
          setTrackingEntries([])
        }

        // Load health metrics data
        console.log('🔍 PatientTreatmentsPage: Loading initial health metrics with currentMetricType:', currentMetricType)
        await loadHealthMetrics(currentMetricType)
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
  }, [user, loadHealthMetrics])

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
      console.log('🔍 getRealTreatmentData: Entries length:', entries?.length || 0)
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
            medication: entry.patient_medication_preferences?.medications?.name || 'Unknown Medication',
            dosage: entry.patient_medication_preferences?.preferred_dosage || 'Unknown dosage',
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
      
      console.log('🔍 getTreatmentDataSafely: realMedications.length:', realMedications.length)
      console.log('🔍 getTreatmentDataSafely: trackingEntries.length:', trackingEntries.length)
      
      if (realMedications.length > 0) {
        // Check if we have any approved medications
        const approvedMedications = realMedications.filter(med => med?.status === 'approved')
        const pendingMedications = realMedications.filter(med => med?.status === 'pending')
        
        console.log('🔍 Total realMedications:', realMedications.length)
        console.log('🔍 realMedications data:', realMedications)
        console.log('🔍 Approved medications:', approvedMedications.length)
        console.log('🔍 Pending medications:', pendingMedications.length)
        console.log('🔍 Approved medications data:', approvedMedications)
        console.log('🔍 Pending medications data:', pendingMedications)
        
        if (approvedMedications.length > 0) {
          console.log('🔍 Using real medication data with approved medications')
          return getRealTreatmentData(realMedications, trackingEntries, treatmentType)
        } else if (pendingMedications.length > 0) {
          console.log('🔍 Only pending medications found - showing appropriate message')
          console.log('🔍 Returning hasPendingMedications: true')
          // Return special state for pending medications
          return { 
            nextShot: null, 
            additionalMedications: [], 
            history: [],
            hasPendingMedications: true
          }
        } else {
          console.log('🔍 No approved or pending medications found')
          return { 
            nextShot: null, 
            additionalMedications: [], 
            history: [] 
          }
        }
      } else {
        console.log('🔍 No real medications found - patient has no medication preferences')
        console.log('🔍 Returning empty state instead of sample data')
        // Return empty state when patient has no medications assigned
        return { 
          nextShot: null, 
          additionalMedications: [], 
          history: [] 
        }
      }
    } catch (error) {
      console.error('💥 Error getting treatment data:', error)
      return { nextShot: null, additionalMedications: [], history: [] }
    }
  }

  const { nextShot, additionalMedications, history, hasPendingMedications } = getTreatmentDataSafely()

  // Convert real medications to MedicationOption format for chart dropdown
  const medicationOptions: MedicationOption[] = React.useMemo(() => {
    return realMedications
      .filter(med => med?.status === 'approved')
      .map(med => ({
        id: med.id,
        name: med.medications?.name || 'Unknown Medication',
        dosage: med.preferred_dosage || 'Unknown dosage'
      }))
  }, [realMedications])

  const handleMedicationSelectionChange = (selected: string[]) => {
    setSelectedMedications(selected)
  }

  const handleMetricChange = async (metricType: string) => {
    setCurrentMetricType(metricType)
    await loadHealthMetrics(metricType)
  }

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

  const handleSaveMetrics = async (metrics: Record<string, number>, date: string) => {
    try {
      if (!user) {
        toast.error('User not authenticated')
        return
      }

      // Get patient record first 
      const { success, patient, error } = await patientsService.getPatientProfile(user.id)
      if (!success || !patient?.id) {
        toast.error('Patient profile not found')
        console.error('Error getting patient profile:', error)
        return
      }

      // Convert metrics to HealthMetricData format
      const metricsToSave: HealthMetricData[] = []
      const recordedAt = new Date(date).toISOString()

      // Map our component metrics to database metric types
      const metricMapping = {
        weight: { type: 'weight' as const, unit: 'lbs' },
        steps: { type: 'steps' as const, unit: 'steps' },
        sleep: { type: 'sleep' as const, unit: 'hours' },
        calories: { type: 'calories' as const, unit: 'kcal' },
        protein: { type: 'protein' as const, unit: 'grams' },
        sugar: { type: 'sugar' as const, unit: 'grams' },
        water: { type: 'water' as const, unit: 'fl oz' },
        averageHeartRate: { type: 'heart_rate' as const, unit: 'bpm' }
      }

      for (const [key, value] of Object.entries(metrics)) {
        const mapping = metricMapping[key as keyof typeof metricMapping]
        if (mapping && value > 0) {
          metricsToSave.push({
            patientId: patient.id,
            metricType: mapping.type,
            value: value,
            unit: mapping.unit,
            recordedAt: recordedAt,
            syncedFrom: 'manual'
          })
        }
      }

      if (metricsToSave.length === 0) {
        toast.error('No metrics to save')
        return
      }

      console.log('🔍 About to save metrics:', metricsToSave)
      const result = await healthMetricsService.addBatchEntries(metricsToSave)
      console.log('🔍 Save result:', result)
      
      if (result.success && result.saved > 0) {
        toast.success(`Successfully saved ${result.saved} metric(s)`)
        setMetricsDialogOpen(false)
        
        console.log('🔍 About to refresh metrics with type:', currentMetricType)
        // Refresh health metrics data to show the new data in charts
        await loadHealthMetrics(currentMetricType)
        console.log('🔍 Finished refreshing metrics')
        
        // Force re-render by updating a trigger state
        setLoading(false)
      } else {
        toast.error(result.errors?.join(', ') || 'Failed to save metrics')
      }
    } catch (error) {
      console.error('Error saving metrics:', error)
      toast.error('An unexpected error occurred')
    }
  }

  console.log('🚨 RENDERING PatientTreatments with healthMetricsData:', {
    length: healthMetricsData.length,
    sample: healthMetricsData.slice(0, 3),
    currentMetricType
  })

  return (
    <>
      <PatientTreatments 
        user={userData}
        onLogout={handleLogout}
        onNavigate={handleNavigate}
        nextShot={nextShot ? {
          ...nextShot,
          onStartTracking: nextShot.onStartTracking
        } : null}
        additionalMedications={additionalMedications || []}
        history={history.map(month => ({
          ...month,
          items: month.items.map(item => ({
            ...item,
            onEdit: () => handleEditEntry(item.originalEntry || item)
          }))
        }))}
        treatmentType={treatmentType}
        medications={medicationOptions}
        selectedMedications={selectedMedications}
        onMedicationSelectionChange={handleMedicationSelectionChange}
        onAddMetrics={() => setMetricsDialogOpen(true)}
        healthMetricsData={healthMetricsData}
        patientId={user?.id}
        onRefreshMetrics={() => loadHealthMetrics(currentMetricType)}
        onMetricChange={handleMetricChange}
        medicationTrackingEntries={trackingEntries}
        hasPendingMedications={hasPendingMedications}
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

      {metricsDialogOpen && (
        <MetricsTracking
          defaultOpen={metricsDialogOpen}
          onSave={handleSaveMetrics}
          patientId={userData?.email}
        />
      )}
    </>
  )
}