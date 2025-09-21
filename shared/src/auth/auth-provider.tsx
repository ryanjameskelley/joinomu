import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { authService } from './auth-service.js'
import type { AuthContextType, UserRole, SignInCredentials } from '../types/auth.js'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<UserRole | null>(null)

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        console.log('🔄 Initializing auth...')
        const { session, error } = await authService.getCurrentSession()
        
        console.log('📋 Session check:', { session: !!session, error })
        
        if (session && !error) {
          setSession(session)
          setUser(session.user)
          
          if (session.user) {
            console.log('👤 Fetching user role for:', session.user.id)
            try {
              const { roles, primaryRole } = await authService.fetchUserRoles(session.user.id)
              console.log('🎭 User roles:', { roles, primaryRole })
              setUserRole(primaryRole || 'patient') // Default to patient if role not found
            } catch (roleError) {
              console.error('❌ Error fetching user role:', roleError)
              setUserRole('patient') // Default to patient on error
            }
          }
        } else {
          console.log('🚫 No session or error:', error)
        }
      } catch (initError) {
        console.error('❌ Error initializing auth:', initError)
      } finally {
        console.log('✅ Auth initialization complete')
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes
    const subscription = authService.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event, !!session)
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          try {
            // Add a small delay for new signups to ensure database writes are committed
            if (event === 'SIGNED_IN') {
              console.log('🔄 New sign in detected, waiting for database sync...')
              await new Promise(resolve => setTimeout(resolve, 2000))
            }
            
            const { primaryRole } = await authService.fetchUserRoles(session.user.id)
            console.log('🎭 Auth provider role result:', primaryRole)
            
            // Only update role if we got a valid role or if we don't have one yet
            if (primaryRole || userRole === null) {
              setUserRole(primaryRole || 'patient')
            } else {
              console.log('🔒 Keeping existing role:', userRole, 'instead of null result')
            }
          } catch (roleError) {
            console.error('❌ Error fetching user role in state change:', roleError)
            // Only set to patient if we don't have a role yet
            if (userRole === null) {
              setUserRole('patient')
            }
          }
        } else {
          setUserRole(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const credentials: SignInCredentials = { email, password }
    const { error } = await authService.signIn(credentials)
    return { error }
  }

  const signOut = async () => {
    const { error } = await authService.signOut()
    return { error }
  }

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signOut,
    userRole,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}