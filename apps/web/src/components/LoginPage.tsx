import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { LoginForm } from '@joinomu/ui'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/utils/supabase/client'

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
      // First, authenticate with Supabase
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError

      if (data.user) {
        // Check if user exists in patients table
        const { data: patientData, error: patientError } = await supabase
          .from('patients')
          .select('*')
          .eq('user_id', data.user.id)
          .single()

        if (patientError || !patientData) {
          // User exists in auth but not in patients table
          await supabase.auth.signOut()
          setError('Access denied. Patient account required.')
          setLoading(false)
          return
        }

        // Successful patient login - redirect will happen via useAuth
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