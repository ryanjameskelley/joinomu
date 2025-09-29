import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { SignupForm, Button } from '@joinomu/ui'
import { authService } from '@joinomu/shared'

interface SignupFormData {
  email: string
  password: string
  confirmPassword: string
  firstName: string
  lastName: string
  role: 'patient' | 'provider' | 'admin'
  specialty?: string
  licenseNumber?: string
  phone?: string
}

export function PatientSignupPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSignup = async (data: SignupFormData) => {
    setLoading(true)
    setError('')

    try {
      const { data: authData, error: signUpError } = await authService.signUp({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        role: 'patient'
      })

      if (signUpError) throw signUpError

      if (authData.user) {
        // User created successfully, they should be automatically signed in
        // Navigate to patient dashboard
        navigate('/patient/dashboard')
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred during signup')
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-8">
      <div className="max-w-2xl w-full">
        <SignupForm 
          userRole="patient"
          onSubmit={handleSignup}
          loading={loading}
          error={error}
          showLoginLink={true}
          loginLink="/patient/login"
        />
        <div className="mt-4 text-center">
          <Button asChild variant="ghost" size="sm">
            <Link to="/">← Back to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}