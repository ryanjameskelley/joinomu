import { supabase } from '../config/supabase.js'
import type { UserRole, AuthResponse, SignInCredentials } from '../types/auth.js'

export interface SignUpCredentials {
  email: string
  password: string
  firstName: string
  lastName: string
  role: UserRole
  dateOfBirth?: string
  phone?: string
  specialty?: string
  licenseNumber?: string
}

export class AuthService {
  /**
   * Sign in user with email and password
   */
  async signIn(credentials: SignInCredentials): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })

      return { data, error }
    } catch (error) {
      return { 
        data: { user: null, session: null }, 
        error: { message: 'An unexpected error occurred during sign in' } 
      }
    }
  }

  /**
   * Sign up user with role-specific data using our clean trigger system
   */
  async signUp(credentials: SignUpCredentials): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            role: credentials.role,
            first_name: credentials.firstName,
            last_name: credentials.lastName,
            ...(credentials.dateOfBirth && { date_of_birth: credentials.dateOfBirth }),
            ...(credentials.phone && { phone: credentials.phone }),
            ...(credentials.specialty && { specialty: credentials.specialty }),
            ...(credentials.licenseNumber && { license_number: credentials.licenseNumber })
          }
        }
      })

      return { data, error }
    } catch (error) {
      return { 
        data: { user: null, session: null }, 
        error: { message: 'An unexpected error occurred during sign up' } 
      }
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<{ error: any }> {
    try {
      const { error } = await supabase.auth.signOut()
      return { error }
    } catch (error) {
      return { error: { message: 'An unexpected error occurred during sign out' } }
    }
  }

  /**
   * Get current session
   */
  async getCurrentSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      return { session, error }
    } catch (error) {
      return { session: null, error }
    }
  }

  /**
   * Get user role from profiles table (simple and clean)
   */
  async getUserRole(userId: string): Promise<UserRole | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()

      if (error || !data) {
        return null
      }

      return data.role as UserRole
    } catch (error) {
      return null
    }
  }

  /**
   * Get user profile data
   */
  async getUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  /**
   * Get role-specific user data
   */
  async getRoleData(userId: string, role: UserRole) {
    try {
      let query;
      switch (role) {
        case 'patient':
          query = supabase
            .from('patients')
            .select('*')
            .eq('profile_id', userId)
            .single()
          break
        case 'provider':
          query = supabase
            .from('providers')
            .select('*')
            .eq('profile_id', userId)
            .single()
          break
        case 'admin':
          query = supabase
            .from('admins')
            .select('*')
            .eq('profile_id', userId)
            .single()
          break
        default:
          return { data: null, error: { message: 'Invalid role' } }
      }

      const { data, error } = await query
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  /**
   * Assign patient to provider (admin only - uses database function)
   */
  async assignPatientToProvider(
    patientProfileId: string,
    providerProfileId: string,
    treatmentType: string = 'general_care',
    isPrimary: boolean = false
  ): Promise<{ success: boolean, error?: string, data?: any }> {
    try {
      const { data, error } = await supabase
        .rpc('assign_patient_to_provider', {
          patient_profile_id: patientProfileId,
          provider_profile_id: providerProfileId,
          treatment_type_param: treatmentType,
          is_primary_param: isPrimary
        })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: data.success, error: data.error, data }
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  /**
   * Listen for auth state changes
   */
  onAuthStateChange(callback: (event: any, session: any) => void) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(callback)
    return subscription
  }
}

// Create and export a singleton instance
export const authService = new AuthService()