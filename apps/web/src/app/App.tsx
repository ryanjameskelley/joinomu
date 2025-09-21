import React from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import { Button, LoginForm } from '@joinomu/ui'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import { supabase } from '@/utils/supabase/client'
import { useState } from 'react'
import { AdminLoginPage } from '@/pages/AdminLoginPage'
import { AdminSignupPage } from '@/pages/AdminSignupPage'
import { AdminDashboard } from '@/pages/AdminDashboard'
import { ProviderLoginPage } from '@/pages/ProviderLoginPage'
import { ProviderSignupPage } from '@/pages/ProviderSignupPage'
import { ProviderDashboard } from '@/pages/ProviderDashboard'
import { PatientDashboard } from '@/components/PatientDashboard'
import { SignupPage } from '@/components/SignupPage'
import '@/simple-trigger-fix'
import '@/debug-connectivity'

function LandingPage() {
  const { user, loading, userRole } = useAuth()
  const navigate = useNavigate()
  
  // Auto-redirect admins to their dashboard
  React.useEffect(() => {
    if (!loading && user && userRole === 'admin') {
      console.log('🔄 Landing page auto-redirecting admin to dashboard')
      navigate('/admin/dashboard', { replace: true })
    }
  }, [loading, user, userRole, navigate])
  
  const handleGoToDashboard = () => {
    if (userRole === 'admin') {
      navigate('/admin/dashboard')
    } else if (userRole === 'provider') {
      navigate('/provider/dashboard')
    } else {
      navigate('/dashboard') // Default to patient dashboard
    }
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-6">
        <h1 className="text-3xl font-bold text-center">JoinOmu Health Platform</h1>
        
        {loading ? (
          <p className="text-center">Loading...</p>
        ) : user ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">Welcome back, {user.email}!</p>
            <p className="text-xs text-muted-foreground">Role: {userRole || 'Loading...'}</p>
            <Button onClick={handleGoToDashboard} className="w-full">
              Go to {userRole === 'admin' ? 'Admin' : userRole === 'provider' ? 'Provider' : 'Patient'} Dashboard
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Button asChild className="w-full" size="lg">
              <Link to="/patient-login">Patient Login</Link>
            </Button>
            <Button asChild variant="outline" className="w-full" size="lg">
              <Link to="/admin-login">Admin Login</Link>
            </Button>
            <Button asChild variant="secondary" className="w-full" size="lg">
              <Link to="/provider/login">Provider Login</Link>
            </Button>
          </div>
        )}
        
        <p className="text-center text-sm text-muted-foreground">
          Healthcare management platform powered by React + TypeScript
        </p>
      </div>
    </div>
  )
}

function TestPage({ title }: { title: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-6 text-center">
        <h1 className="text-2xl font-bold">{title}</h1>
        <Button asChild variant="outline">
          <Link to="/">← Back to Home</Link>
        </Button>
      </div>
    </div>
  )
}


function PatientLoginPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

        // Successful patient login - navigate to dashboard
        navigate('/dashboard')
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred during login')
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full">
        <LoginForm 
          onSubmit={handleLogin}
          loading={loading}
          error={error}
          showSignupLink={true}
          signupLink="/patient-signup"
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

function App() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="joinomu-theme"
    >
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/patient-signup" element={<SignupPage />} />
          <Route path="/patient-login" element={<PatientLoginPage />} />
          <Route path="/dashboard" element={<PatientDashboard />} />
          <Route path="/admin-login" element={<AdminLoginPage />} />
          <Route path="/admin/signup" element={<AdminSignupPage />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/provider/login" element={<ProviderLoginPage />} />
          <Route path="/provider/signup" element={<ProviderSignupPage />} />
          <Route path="/provider/dashboard" element={<ProviderDashboard />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App