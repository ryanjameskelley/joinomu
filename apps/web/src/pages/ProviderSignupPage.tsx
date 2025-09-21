import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { SignupForm, Button } from '@joinomu/ui'
import { authService } from '@joinomu/shared'

export function ProviderSignupPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSignup = async (email: string, password: string) => {
    setLoading(true)
    setError('')

    try {
      // Use new auth service method that includes role metadata
      const { data: authData, error: signUpError } = await authService.signUpProvider({
        email,
        password,
        firstName: 'Provider',
        lastName: 'User',
        specialty: 'General Practice', // Default specialty
        licenseNumber: 'TBD', // Will be updated in profile
        phone: '' // Optional
      })

      if (signUpError) throw signUpError

      if (authData.user) {
        // Show success message and redirect to login
        alert('Provider account created successfully! You can now sign in to your account.')
        navigate('/provider/login')
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
          onSubmit={handleSignup}
          loading={loading}
          error={error}
          showLoginLink={true}
          loginLink="/provider/login"
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