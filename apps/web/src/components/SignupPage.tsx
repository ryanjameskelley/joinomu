import { useState, useEffect } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { RoleSignupForm, type SignupFormData } from '@joinomu/ui'
import { useAuth } from '@/hooks/useAuth'
import { authService } from '@joinomu/shared'

export function SignupPage() {
  const { user, userRole, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [justSignedUp, setJustSignedUp] = useState(false)

  // Handle redirect after successful signup when auth state is fully loaded
  useEffect(() => {
    if (justSignedUp && user && userRole && !authLoading) {
      console.log('✅ Post-signup redirect: User role loaded:', userRole)
      switch (userRole) {
        case 'patient':
          navigate('/dashboard', { replace: true })
          break
        case 'provider':
          navigate('/provider/dashboard', { replace: true })
          break
        case 'admin':
          navigate('/admin/dashboard', { replace: true })
          break
        default:
          navigate('/', { replace: true })
      }
    }
  }, [justSignedUp, user, userRole, authLoading, navigate])

  // Redirect if already authenticated
  if (user && !justSignedUp) {
    return <Navigate to="/" replace />
  }

  const handleSignup = async (formData: SignupFormData) => {
    setLoading(true)
    setError('')

    try {
      console.log('🔐 Starting signup process for:', formData.email, 'Role:', formData.role)
      
      const { data: signUpData, error: signUpError } = await authService.signUp({
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
        console.error('❌ Signup error:', signUpError)
        if (signUpError.message?.includes('already registered') || signUpError.message?.includes('already exists')) {
          setError('This email is already registered. Please try logging in instead.')
        } else {
          setError(signUpError.message || 'Signup failed')
        }
        return
      }

      console.log('✅ Signup successful, user created:', signUpData?.user?.id)
      
      // Auto-login after successful signup
      console.log('🔑 Auto-logging in after signup...')
      const { error: signInError } = await authService.signIn({
        email: formData.email,
        password: formData.password
      })

      if (signInError) {
        console.error('❌ Auto-login failed:', signInError)
        setError('Account created but auto-login failed. Please sign in manually.')
        navigate('/login')
        return
      }

      console.log('✅ Auto-login successful, waiting for role detection...')
      // Set flag to indicate we just signed up, useEffect will handle redirect
      setJustSignedUp(true)
      
    } catch (error: any) {
      console.error('💥 Signup error:', error)
      setError(error.message || 'An error occurred during signup')
    } finally {
      setLoading(false)
    }
  }

  // Show loading state while waiting for role detection after signup
  if (justSignedUp && user && !userRole && authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md">
          <h2 className="text-2xl font-bold">Setting up your account...</h2>
          <p className="text-muted-foreground">
            Please wait while we prepare your dashboard.
          </p>
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    )
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