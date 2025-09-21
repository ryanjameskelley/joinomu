import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { SignupForm } from '@joinomu/ui'
import { useAuth } from '@/hooks/useAuth'
import { authService } from '@joinomu/shared'

export function SignupPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Add loading state for auth
  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  const handleSignup = async (email: string, password: string) => {
    setLoading(true)
    setError('')

    try {
      // Use new auth service method with role metadata for automatic patient creation
      const { data, error: signUpError } = await authService.signUpPatient({
        email,
        password,
        firstName: 'Patient',
        lastName: 'User'
      })

      if (signUpError) {
        // If user already exists, show appropriate error
        if (signUpError.message?.includes('already registered') || signUpError.message?.includes('already exists')) {
          setError('This email is already registered. If you\'re having trouble logging in, please try the login page.')
          setLoading(false)
          return
        }
        
        throw signUpError
      }

      if (data.user) {
        // Database trigger will automatically create patient record
        setSuccess(true)
      }
    } catch (error: any) {
      console.error('Full signup error:', error)
      setError(error.message || 'An error occurred during signup')
    }
    
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md">
          <h2 className="text-2xl font-bold">Account Created Successfully!</h2>
          <p className="text-muted-foreground">
            Your patient account has been created and you can now log in to access your dashboard.
          </p>
          <a 
            href="/patient-login" 
            className="inline-block bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
          >
            Go to Login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md">
        <SignupForm 
          onSubmit={handleSignup}
          loading={loading}
          error={error}
          className="w-full"
        />
      </div>
    </div>
  )
}