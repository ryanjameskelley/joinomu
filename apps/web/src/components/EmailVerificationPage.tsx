import { useEffect, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/utils/supabase/client'

export function EmailVerificationPage() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      const token = searchParams.get('token')
      const type = searchParams.get('type')

      if (type === 'signup' && token) {
        try {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'signup'
          })

          if (error) throw error

          if (data.user) {
            // Now create the patient record since email is confirmed
            const userEmail = data.user.email
            const userName = data.user.user_metadata?.full_name || ''
            
            const nameParts = userName.trim().split(' ')
            const firstName = nameParts[0] || ''
            const lastName = nameParts.slice(1).join(' ') || ''

            const { error: profileError } = await supabase
              .from('patients')
              .insert([
                {
                  user_id: data.user.id,
                  email: userEmail,
                  first_name: firstName,
                  last_name: lastName,
                  has_completed_intake: false
                }
              ])

            if (profileError) {
              console.error('Error creating patient profile:', profileError)
              setStatus('error')
              setMessage('Account verified but profile creation failed. Please contact support.')
              return
            }

            setStatus('success')
            setMessage('Email verified successfully! You can now log in.')
          }
        } catch (error: any) {
          console.error('Verification error:', error)
          setStatus('error')
          setMessage(error.message || 'Email verification failed')
        }
      } else {
        setStatus('error')
        setMessage('Invalid verification link')
      }
    }

    handleEmailConfirmation()
  }, [searchParams])

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md">
          <h2 className="text-2xl font-bold text-green-600">Email Verified!</h2>
          <p className="text-muted-foreground">
            Your account has been successfully verified. You can now log in to access your dashboard.
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

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md">
          <h2 className="text-2xl font-bold text-destructive">Verification Failed</h2>
          <p className="text-muted-foreground">{message}</p>
          <a 
            href="/patient-signup" 
            className="inline-block text-primary underline underline-offset-4 hover:no-underline"
          >
            Try signing up again
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold">Verifying Email...</h2>
        <p className="text-muted-foreground">Please wait while we verify your email address.</p>
      </div>
    </div>
  )
}