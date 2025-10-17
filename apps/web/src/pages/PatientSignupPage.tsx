import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function PatientSignupPage() {
  const navigate = useNavigate()

  useEffect(() => {
    // Immediately redirect to the new onboarding flow
    navigate('/patient/onboarding', { replace: true })
  }, [navigate])

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Starting your health journey...</p>
      </div>
    </div>
  )
}