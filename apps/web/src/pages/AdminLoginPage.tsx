import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AdminLoginForm, Button } from '@joinomu/ui'
import { authService } from '@joinomu/shared'

export function AdminLoginPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (email: string, password: string) => {
    setLoading(true)
    setError('')

    try {
      const result = await authService.signInAdmin({ email, password })
      
      if (result.error) {
        setError(result.error.message)
      } else if (result.data?.user) {
        // Successful admin login - navigate to admin dashboard
        console.log('✅ Admin login successful, redirecting to dashboard')
        navigate('/admin/dashboard')
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred during login')
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full">
        <AdminLoginForm 
          onSubmit={handleLogin}
          loading={loading}
          error={error}
        />
        <div className="mt-4 text-center space-y-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/">← Back to Home</Link>
          </Button>
          <div className="text-sm text-muted-foreground">
            Need admin access?{" "}
            <Link to="/admin/signup" className="underline underline-offset-4 hover:text-foreground">
              Request Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}