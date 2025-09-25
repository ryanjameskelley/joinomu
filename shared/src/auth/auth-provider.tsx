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
  const [isSigningOut, setIsSigningOut] = useState(false)

  const loadUserData = async (userId: string) => {
    try {
      console.log('🔍 Loading user role for user:', userId)
      
      // Try getUserRole with a longer timeout and better error handling
      const role = await authService.getUserRole(userId)
      
      console.log('✅ User role loaded:', role)
      setUserRole(role)
    } catch (error) {
      console.error('❌ Error loading user data:', error)
      // Don't immediately set role to null - retry once
      try {
        console.log('🔄 Retrying getUserRole...')
        const retryRole = await authService.getUserRole(userId)
        console.log('✅ User role loaded on retry:', retryRole)
        setUserRole(retryRole)
      } catch (retryError) {
        console.error('❌ Retry failed:', retryError)
        setUserRole(null)
      }
    }
  }

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        console.log('🔍 Initializing auth...')
        const { session, error } = await authService.getCurrentSession()
        
        if (error) {
          console.error('❌ Error getting current session:', error)
          setSession(null)
          setUser(null)
          setUserRole(null)
        } else if (session) {
          console.log('✅ Found existing session, loading user:', !!session.user)
          setSession(session)
          setUser(session.user)
          
          if (session.user) {
            await loadUserData(session.user.id)
          }
        } else {
          console.log('ℹ️ No existing session found')
          setSession(null)
          setUser(null)
          setUserRole(null)
        }
      } catch (error) {
        console.error('❌ Error initializing auth:', error)
        setSession(null)
        setUser(null)
        setUserRole(null)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes
    const subscription = authService.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change event:', event, 'session:', !!session, 'user:', !!session?.user)
        
        // Log detailed information about automatic logouts
        if (event === 'SIGNED_OUT') {
          console.log('🔄 SIGNED_OUT event received - checking if this was user-initiated or automatic')
          console.log('🔄 Current isSigningOut flag:', isSigningOut)
          if (!isSigningOut) {
            console.warn('⚠️ AUTOMATIC LOGOUT DETECTED - User was signed out without clicking logout')
            console.warn('⚠️ Possible causes: token expired, invalid session, network issues, or Supabase config')
          } else {
            console.log('✅ User-initiated logout detected')
          }
          setUser(null)
          setSession(null)
          setUserRole(null)
          setLoading(false)
          return
        }
        
        // Log other auth events that might indicate issues
        if (event === 'TOKEN_REFRESHED') {
          console.log('🔄 Token refreshed successfully')
        } else if (event === 'USER_UPDATED') {
          console.log('🔄 User updated')
        } else if (event === 'SIGNED_IN') {
          console.log('✅ User signed in')
        }
        
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          try {
            await loadUserData(session.user.id)
          } catch (error) {
            console.error('❌ Error loading user data on auth change:', error)
            // Don't automatically sign out on role loading errors
            // This could cause automatic logout loops
            setUserRole(null)
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
    setIsSigningOut(true)
    setLoading(true)
    
    const { error } = await authService.signOut()
    
    // Force clear all auth state immediately to prevent stale state
    setUser(null)
    setSession(null)
    setUserRole(null)
    setLoading(false)
    
    // Clear signing out flag after a short delay to prevent auto-redirects
    setTimeout(() => {
      setIsSigningOut(false)
    }, 100)
    
    return { error }
  }

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signOut,
    userRole,
    isSigningOut,
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