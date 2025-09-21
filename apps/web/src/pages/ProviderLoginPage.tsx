import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ProviderLoginForm, Button } from '@joinomu/ui'
import { supabase } from '@/utils/supabase/client'
import { authService } from '@joinomu/shared'

export function ProviderLoginPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (email: string, password: string) => {
    setLoading(true)
    setError('')

    try {
      // Use the new auth service method for role-specific login
      const { data, error: signInError } = await authService.signInProvider({
        email,
        password,
      })

      if (signInError) throw signInError

      if (data.user) {
        // Successful provider login - navigate to dashboard
        navigate('/provider/dashboard')
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred during login')
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full">
        <ProviderLoginForm 
          onSubmit={handleLogin}
          loading={loading}
          error={error}
          showSignupLink={true}
          signupLink="/provider/signup"
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