export type UserRole = 'patient' | 'admin' | 'provider'

export interface UserProfile {
  id: string
  email: string
  role: UserRole
  first_name?: string
  last_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface AuthState {
  user: UserProfile | null
  loading: boolean
  error: string | null
}