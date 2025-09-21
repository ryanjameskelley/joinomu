import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { SignupForm, Button, Alert } from '@joinomu/ui'
import { authService } from '@joinomu/shared'

export function AdminSignupPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [redirecting, setRedirecting] = useState(false)

  const handleSignup = async (email: string, password: string) => {
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      console.log('🚀 Starting admin signup for:', email)
      const result = await authService.signUpAdmin({
        email,
        password,
        firstName: 'Admin',
        lastName: 'User',
      })
      
      console.log('📝 Signup result:', result)
      
      if (result.error) {
        console.error('❌ Signup error:', result.error)
        setError(result.error.message)
      } else if (result.data?.user) {
        console.log('✅ Admin signup successful for user:', result.data.user.id)
        console.log('🚀 Redirecting to admin dashboard...')
        
        setRedirecting(true)
        setLoading(false)
        
        // Redirect to admin dashboard since we know admin record will be created
        setTimeout(() => {
          console.log('🔄 Forcing redirect to admin dashboard')
          window.location.href = '/admin/dashboard'
        }, 3000)
      }
    } catch (error: any) {
      console.error('💥 Signup exception:', error)
      setError(error.message || 'An error occurred during signup')
    }
    
    setLoading(false)
  }

  if (redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full space-y-6 text-center">
          <h2 className="text-2xl font-bold">Admin Account Created!</h2>
          <p className="text-muted-foreground">Redirecting to admin dashboard...</p>
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full">
        <SignupForm 
          onSubmit={handleSignup}
          loading={loading}
          error={error}
        />
        <div className="mt-4 text-center space-y-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/">← Back to Home</Link>
          </Button>
          <div className="text-sm text-muted-foreground">
            Already have admin access?{" "}
            <Link to="/admin-login" className="underline underline-offset-4 hover:text-foreground">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}