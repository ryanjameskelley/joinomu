import { User, Session } from '@supabase/supabase-js'
import { UserRole } from './database.js'

// Re-export UserRole for convenience
export type { UserRole } from './database.js'

export interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
  userRole: UserRole | null
  isSigningOut: boolean
}

export interface SignInCredentials {
  email: string
  password: string
}

export interface SignUpCredentials {
  email: string
  password: string
  confirmPassword?: string
}

export interface AuthError {
  message: string
  code?: string
}

export interface AuthResponse {
  data?: {
    user: User | null
    session: Session | null
  }
  error: AuthError | null
}