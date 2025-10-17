import React from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import { Button } from '@joinomu/ui'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from 'sonner'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import { PatientLoginPage } from '@/pages/PatientLoginPage'
import { PatientSignupPage } from '@/pages/PatientSignupPage'
import { PatientOnboardingFlowSimple } from '@/pages/PatientOnboardingFlowSimple'
import { ProviderLoginPage } from '@/pages/ProviderLoginPage'
import { ProviderSignupPage } from '@/pages/ProviderSignupPage'
import { AdminLoginPage } from '@/pages/AdminLoginPage'
import { AdminSignupPage } from '@/pages/AdminSignupPage'
import { AdminDashboard } from '@/pages/AdminDashboard'
import { ProviderDashboard } from '@/pages/ProviderDashboard'
import { PatientDashboard } from '@/components/PatientDashboard'
import { AdminPatientsPage } from '@/pages/AdminPatientsPage'
import { PatientTreatmentsPage } from '@/pages/PatientTreatmentsPage'

function LandingPage() {
  const { user, loading, userRole, isSigningOut } = useAuth()
  const navigate = useNavigate()
  
  // Auto-redirect users to their appropriate dashboard (but not if they just signed out)
  React.useEffect(() => {
    console.log('🔍 LandingPage: Auth state check:', { loading, user: !!user, userRole, isSigningOut })
    if (!loading && user && userRole && !isSigningOut) {
      console.log(`✅ Auto-redirecting ${userRole} to dashboard`)
      switch (userRole) {
        case 'admin':
          navigate('/admin/dashboard', { replace: true })
          break
        case 'provider':
          navigate('/provider/dashboard', { replace: true })
          break
        case 'patient':
          navigate('/patient/dashboard', { replace: true })
          break
      }
    } else if (!loading && user && !userRole) {
      console.log('❌ User authenticated but no role found:', user.id)
    } else if (!loading && !user) {
      console.log('❌ No user authenticated')
    } else if (isSigningOut) {
      console.log('🔄 User is signing out, preventing auto-redirect')
    }
  }, [loading, user, userRole, isSigningOut, navigate])
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p>Loading...</p>
      </div>
    )
  }

  if (user && userRole && !isSigningOut) {
    // This should not show due to the useEffect redirect above, but just in case
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full space-y-6 text-center">
          <h1 className="text-3xl font-bold">Welcome back!</h1>
          <p className="text-sm text-muted-foreground">Redirecting you to your dashboard...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-6">
        <h1 className="text-3xl font-bold text-center">JoinOmu Health Platform</h1>
        
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/patient/login">Patient</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/provider/login">Provider</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/login">Admin</Link>
            </Button>
          </div>
          <p className="text-center text-xs text-muted-foreground">Choose your portal to sign in</p>
          
          <div className="grid grid-cols-3 gap-2">
            <Button asChild variant="secondary" size="sm">
              <Link to="/patient/signup">Patient Signup</Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link to="/provider/signup">Provider Signup</Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link to="/admin/signup">Admin Signup</Link>
            </Button>
          </div>
        </div>
        
        <p className="text-center text-sm text-muted-foreground">
          Healthcare management platform for patients, providers, and administrators
        </p>
      </div>
    </div>
  )
}

// Protected route component that redirects based on user role
function ProtectedRoute({ 
  children, 
  requiredRole 
}: { 
  children: React.ReactNode
  requiredRole?: 'patient' | 'admin' | 'provider'
}) {
  const { user, loading, userRole, isSigningOut } = useAuth()
  const navigate = useNavigate()

  React.useEffect(() => {
    if (!loading && !isSigningOut) {
      if (!user) {
        navigate('/patient/login', { replace: true })
      } else if (requiredRole && userRole !== requiredRole) {
        // Redirect to appropriate dashboard if user has wrong role
        switch (userRole) {
          case 'admin':
            navigate('/admin/dashboard', { replace: true })
            break
          case 'provider':
            navigate('/provider/dashboard', { replace: true })
            break
          case 'patient':
            navigate('/patient/dashboard', { replace: true })
            break
          default:
            navigate('/patient/login', { replace: true })
        }
      }
    }
  }, [user, loading, userRole, isSigningOut, requiredRole, navigate])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p>Loading...</p>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  if (requiredRole && userRole !== requiredRole) {
    return null // Will redirect to appropriate dashboard
  }

  return <>{children}</>
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
          
          {/* Auth Routes */}
          <Route path="/patient/login" element={<PatientLoginPage />} />
          <Route path="/patient/signup" element={<PatientSignupPage />} />
          <Route path="/patient/onboarding" element={<PatientOnboardingFlowSimple />} />
          <Route path="/provider/login" element={<ProviderLoginPage />} />
          <Route path="/provider/signup" element={<ProviderSignupPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/signup" element={<AdminSignupPage />} />
          
          {/* Patient Routes */}
          <Route 
            path="/patient/dashboard" 
            element={
              <ProtectedRoute requiredRole="patient">
                <PatientDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute requiredRole="patient">
                <PatientDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/treatments" 
            element={
              <ProtectedRoute requiredRole="patient">
                <PatientTreatmentsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/treatments/weightloss" 
            element={
              <ProtectedRoute requiredRole="patient">
                <PatientTreatmentsPage treatmentType="Weight Loss" />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/treatments/mens-health" 
            element={
              <ProtectedRoute requiredRole="patient">
                <PatientTreatmentsPage treatmentType="Men's Health" />
              </ProtectedRoute>
            } 
          />
          
          {/* Admin Routes */}
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/patients" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminPatientsPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Provider Routes */}
          <Route 
            path="/provider/dashboard" 
            element={
              <ProtectedRoute requiredRole="provider">
                <ProviderDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Legacy route redirects for backward compatibility */}
          <Route path="/login" element={<PatientLoginPage />} />
          <Route path="/signup" element={<PatientSignupPage />} />
          <Route path="/patient-login" element={<PatientLoginPage />} />
          <Route path="/admin-login" element={<AdminLoginPage />} />
          <Route path="/patient-signup" element={<PatientSignupPage />} />
        </Routes>
        <Toaster 
          position="bottom-right"
          expand={true}
          visibleToasts={3}
          closeButton={false}
          theme="light"
        />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App