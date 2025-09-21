import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { LoginForm } from '@joinomu/ui'
import { useAuth } from '@/hooks/useAuth'

export function LoginPage() {
  const { user, signIn } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (user) {
    return <Navigate to="/" replace />
  }

  const handleLogin = async (email: string, password: string) => {
    setLoading(true)
    setError('')

    try {
      const { error: signInError } = await signIn(email, password)

      if (signInError) {
        setError(signInError.message || 'Login failed')
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred during login')
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <LoginForm 
        onSubmit={handleLogin}
        loading={loading}
        error={error}
        className="w-full max-w-md"
      />
    </div>
  )
}