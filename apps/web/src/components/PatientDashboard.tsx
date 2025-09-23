import { PatientDashboard as SidebarPatientDashboard, type ChecklistItem, type MedicationInfo, type AppointmentInfo, MedicationPreferencesDialog, type MedicationOption } from '@joinomu/ui'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { authService } from '@joinomu/shared'

export function PatientDashboard() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  // Sample onboarding state - in real app this would come from database
  const [isOnboarded, setIsOnboarded] = useState(false)
  const [medicationDialogOpen, setMedicationDialogOpen] = useState(false)
  const [medicationLoading, setMedicationLoading] = useState(false)
  const [availableMedications, setAvailableMedications] = useState<MedicationOption[]>([])
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([
    {
      id: 'plan',
      title: 'Select a plan',
      description: 'Choose the healthcare plan that fits your needs',
      completed: false,
    },
    {
      id: 'medication',
      title: 'Select medication preferences',
      description: "Select from the medications you're eligible for",
      completed: false,
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

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const handleChecklistItemClick = async (item: ChecklistItem) => {
    console.log('Checklist item clicked:', item)
    
    if (item.id === 'medication') {
      // Open medication preferences dialog
      try {
        console.log('🔄 Fetching medications...')
        // Fetch available medications from Supabase
        const result = await authService.getAvailableMedications()
        console.log('🔍 Medications result:', result)
        if (result.data) {
          console.log('✅ Setting medications:', result.data)
          setAvailableMedications(result.data)
        }
        console.log('🔄 Opening dialog...')
        setMedicationDialogOpen(true)
        console.log('✅ Dialog should be open now')
      } catch (error) {
        console.error('❌ Failed to load medications:', error)
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

  const handleRescheduleAppointment = () => {
    console.log('Reschedule appointment clicked')
    // In real app, would open reschedule modal or navigate to booking page
  }

  const handleMedicationAction = () => {
    console.log('Medication action clicked')
    // In real app, would show medication details or update preferences
  }

  const handleMedicationPreferencesSubmit = async (preferences: { medicationId: string; dosage: string }) => {
    if (!user?.id) return

    setMedicationLoading(true)
    try {
      const result = await authService.createMedicationPreference(
        user.id, 
        preferences.medicationId, 
        preferences.dosage
      )
      
      if (result.success) {
        console.log('✅ Medication preference created successfully')
        
        // Mark medication checklist item as completed
        setChecklistItems(prev => prev.map(i => 
          i.id === 'medication' ? { ...i, completed: true } : i
        ))
        
        // Close dialog
        setMedicationDialogOpen(false)
      } else {
        console.error('❌ Failed to create medication preference:', result.error)
      }
    } catch (error) {
      console.error('❌ Exception creating medication preference:', error)
    } finally {
      setMedicationLoading(false)
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
        default:
          console.log('Unknown navigation item:', itemOrUrl)
      }
    }
  }

  // Extract user data for the dashboard
  const userData = user ? {
    name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Patient',
    email: user.email || '',
    avatar: user.user_metadata?.avatar_url || ''
  } : undefined

  return (
    <>
      <SidebarPatientDashboard 
        user={userData} 
        onLogout={handleLogout}
        isOnboarded={isOnboarded}
        checklistItems={!isOnboarded ? checklistItems : undefined}
        onChecklistItemClick={handleChecklistItemClick}
        medication={isOnboarded ? sampleMedication : undefined}
        appointment={isOnboarded ? sampleAppointment : undefined}
        onRescheduleAppointment={handleRescheduleAppointment}
        onMedicationAction={handleMedicationAction}
        onNavigate={handleNavigate}
      />
      <MedicationPreferencesDialog
        open={medicationDialogOpen}
        onOpenChange={setMedicationDialogOpen}
        medications={availableMedications}
        onSubmit={handleMedicationPreferencesSubmit}
        loading={medicationLoading}
      />
    </>
  )
}