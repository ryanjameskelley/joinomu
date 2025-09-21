import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { AdminSignupForm } from '@joinomu/ui'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/utils/supabase/client'

export function AdminSignupPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  if (user) {
    return <Navigate to="/admin" replace />
  }

  const handleSignup = async (email: string, password: string, firstName: string, lastName: string) => {
    setLoading(true)
    setError('')

    try {
      // Create the user account with email confirmation
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/admin-login`
        }
      })

      if (signUpError) {
        console.error('Admin signup error:', signUpError)
        throw signUpError
      }

      if (data.user) {
        console.log('Admin user created successfully:', data.user.id)
        
        // Create admin profile
        try {
          const { error: profileError } = await supabase
            .from('admins')
            .insert([
              {
                user_id: data.user.id,
                email: email,
                first_name: firstName,
                last_name: lastName,
                role: 'admin',
                permissions: ['messages', 'patients', 'dashboard']
              }
            ])

          if (profileError) {
            console.error('Error creating admin profile:', profileError)
            // Continue anyway - the user account was created successfully
          }
        } catch (profileErr) {
          console.error('Admin profile creation failed:', profileErr)
          // Continue anyway - the user account was created successfully
        }

        setSuccess(true)
      }
    } catch (error: any) {
      console.error('Full admin signup error:', error)
      setError(error.message || 'An error occurred during signup')
    }
    
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md">
          <h2 className="text-2xl font-bold">Admin Account Requested</h2>
          <p className="text-muted-foreground">
            Your admin account request has been submitted. Please check your email for a confirmation link, 
            then contact your system administrator to activate your admin privileges.
          </p>
          <a 
            href="/admin-login" 
            className="inline-block text-primary underline underline-offset-4 hover:no-underline"
          >
            Return to admin login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <AdminSignupForm 
        onSubmit={handleSignup}
        loading={loading}
        error={error}
        className="w-full max-w-md"
      />
    </div>
  )
}