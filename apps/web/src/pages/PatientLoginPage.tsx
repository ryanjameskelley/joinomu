import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { LoginForm, Button } from '@joinomu/ui'
import { authService } from '@joinomu/shared'

interface LoginFormData {
  email: string
  password: string
}

export function PatientLoginPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (data: LoginFormData) => {
    setLoading(true)
    setError('')

    try {
      const { data: authData, error: signInError } = await authService.signIn(data)

      if (signInError) throw signInError

      if (authData.user) {
        // Verify user role and redirect accordingly
        const role = authData.user.user_metadata?.role
        if (role === 'patient') {
          navigate('/patient/dashboard')
        } else {
          setError('This login is for patients only')
          await authService.signOut()
        }
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred during login')
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-8">
      <div className="max-w-2xl w-full">
        <LoginForm 
          userRole="patient"
          onSubmit={handleLogin}
          loading={loading}
          error={error}
          showSignupLink={true}
          signupLink="/patient/signup"
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