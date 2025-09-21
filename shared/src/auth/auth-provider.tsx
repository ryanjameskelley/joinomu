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

  const loadUserData = async (userId: string) => {
    try {
      const role = await authService.getUserRole(userId)
      setUserRole(role)
    } catch (error) {
      console.error('Error loading user data:', error)
      setUserRole(null)
    }
  }

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        const { session, error } = await authService.getCurrentSession()
        
        if (session && !error) {
          setSession(session)
          setUser(session.user)
          
          if (session.user) {
            await loadUserData(session.user.id)
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes
    const subscription = authService.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await loadUserData(session.user.id)
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