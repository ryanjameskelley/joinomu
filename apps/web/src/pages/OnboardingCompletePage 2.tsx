import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { OnboardingCompletion } from '@joinomu/ui'
import { useAuth } from '@/hooks/useAuth'

export function OnboardingCompletePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)

  // This would typically come from your app state or URL params
  // For demo purposes, using sample data
  const selectedMedication = {
    name: 'Semaglutide (Ozempic)',
    dosage: '0.25mg (starting dose)',
    frequency: 'Once weekly injection',
    status: 'pending' as const,
    category: 'weightloss' as const,
    description: 'Your provider will review your medical history and approve your preferred medication within 24-48 hours.',
    averageResults: {
      weightLoss: '12-15% body weight over 6 months',
      bloodSugar: '1.5-2.0% HbA1c reduction',
      satisfaction: '85% patient satisfaction in clinical trials'
    }
  }

  const scheduledAppointment = {
    doctorName: 'Dr. Sarah Johnson',
    doctorTitle: 'Board Certified Weight Management Specialist',
    date: 'December 15, 2024',
    time: '2:00 PM EST',
    type: 'Virtual Initial Consultation'
  }

  const handleEditMedication = () => {
    // Navigate back to medication selection step
    navigate('/onboarding/medications')
  }

  const handleRescheduleAppointment = () => {
    // Navigate back to appointment scheduling step
    navigate('/onboarding/schedule')
  }

  const handleContinue = () => {
    // Navigate to the patient dashboard
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <OnboardingCompletion
          selectedMedication={selectedMedication}
          scheduledAppointment={scheduledAppointment}
          onEditMedication={handleEditMedication}
          onRescheduleAppointment={handleRescheduleAppointment}
          onContinue={handleContinue}
          showAverageResults={true}
          paymentRequired={false}
        />
      </div>
    </div>
  )
}