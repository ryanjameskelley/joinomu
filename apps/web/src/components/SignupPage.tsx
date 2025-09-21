import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { RoleSignupForm, type SignupFormData } from '@joinomu/ui'
import { useAuth } from '@/hooks/useAuth'
import { authService } from '@joinomu/shared'

export function SignupPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  if (user) {
    return <Navigate to="/" replace />
  }

  const handleSignup = async (formData: SignupFormData) => {
    setLoading(true)
    setError('')

    try {
      const { error: signUpError } = await authService.signUp({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
        ...(formData.dateOfBirth && { dateOfBirth: formData.dateOfBirth }),
        ...(formData.phone && { phone: formData.phone }),
        ...(formData.specialty && { specialty: formData.specialty }),
        ...(formData.licenseNumber && { licenseNumber: formData.licenseNumber })
      })

      if (signUpError) {
        if (signUpError.message?.includes('already registered') || signUpError.message?.includes('already exists')) {
          setError('This email is already registered. Please try logging in instead.')
        } else {
          setError(signUpError.message || 'Signup failed')
        }
        return
      }

      setSuccess(true)
    } catch (error: any) {
      console.error('Signup error:', error)
      setError(error.message || 'An error occurred during signup')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md">
          <h2 className="text-2xl font-bold">Account Created Successfully!</h2>
          <p className="text-muted-foreground">
            Your account has been created and you can now log in to access your dashboard.
          </p>
          <a 
            href="/login" 
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
      <div className="w-full max-w-lg">
        <RoleSignupForm 
          onSubmit={handleSignup}
          loading={loading}
          error={error}
          className="w-full"
        />
      </div>
    </div>
  )
}