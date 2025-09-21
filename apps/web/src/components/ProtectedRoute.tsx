import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

interface ProtectedRouteProps {
  children: ReactNode
  role?: 'patient' | 'admin' | 'provider'
}

export function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const { user, loading, userRole } = useAuth()

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!user) {
    return <Navigate to="/patient-login" replace />
  }

  if (role && userRole !== role) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}