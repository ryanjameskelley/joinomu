import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { AdminLoginForm } from '@joinomu/ui'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/utils/supabase/client'

export function AdminLoginPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // If user is already logged in, check if they're an admin
  if (user) {
    return <Navigate to="/admin" replace />
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
        // Check if user exists in admins table
        const { data: adminData, error: adminError } = await supabase
          .from('admins')
          .select('*')
          .eq('user_id', data.user.id)
          .single()

        if (adminError || !adminData) {
          // User exists in auth but not in admins table
          await supabase.auth.signOut()
          setError('Access denied. Admin account required.')
          setLoading(false)
          return
        }

        // Successful admin login - redirect will happen via useAuth
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred during login')
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <AdminLoginForm 
        onSubmit={handleLogin}
        loading={loading}
        error={error}
        className="w-full max-w-md"
      />
    </div>
  )
}