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
      console.log('🔍 getUserRole: Checking role for user:', userId)
      
      // Check in admins table first
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('id')
        .eq('profile_id', userId)
        .single()

      console.log('🔍 Admin query result:', { adminData, adminError })

      if (adminData && !adminError) {
        console.log('✅ getUserRole: Found admin role')
        return 'admin'
      }

      // Check in providers table
      const { data: providerData, error: providerError } = await supabase
        .from('providers')
        .select('id')
        .eq('profile_id', userId)
        .single()

      console.log('🔍 Provider query result:', { providerData, providerError })

      if (providerData && !providerError) {
        console.log('✅ getUserRole: Found provider role')
        return 'provider'
      }

      // Check in patients table
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('id')
        .eq('profile_id', userId)
        .single()

      console.log('🔍 Patient query result:', { patientData, patientError })

      if (patientData && !patientError) {
        console.log('✅ getUserRole: Found patient role')
        return 'patient'
      }

      console.log('❌ getUserRole: No role found for user')
      return null
    } catch (error) {
      console.error('❌ getUserRole: Error checking role:', error)
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
   * Get all patients for admin view
   */
  async getAllPatients(): Promise<{ data: any[] | null, error: any }> {
    try {
      const { data, error } = await supabase.rpc('get_all_patients_for_admin')
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  /**
   * Get assigned patients for provider view
   */
  async getAssignedPatients(providerProfileId: string): Promise<{ data: any[] | null, error: any }> {
    try {
      const { data, error } = await supabase.rpc('get_assigned_patients_for_provider', {
        provider_profile_id: providerProfileId
      })
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  /**
   * Assign patient to provider (admin only)
   */
  async assignPatientToProvider(
    patientProfileId: string,
    providerProfileId: string,
    treatmentType: string = 'general_care',
    isPrimary: boolean = false
  ): Promise<{ success: boolean, error?: string, data?: any }> {
    try {
      const { data, error } = await supabase.rpc('assign_patient_to_provider', {
        patient_profile_id: patientProfileId,
        provider_profile_id: providerProfileId,
        treatment_type_param: treatmentType,
        is_primary_param: isPrimary
      })

      if (error) {
        return { success: false, error: error.message }
      }

      // The function returns an array with the result
      if (data && data.length > 0) {
        const result = data[0]
        return { 
          success: result.success, 
          error: result.success ? undefined : result.message, 
          data: result 
        }
      }

      return { success: false, error: 'No result returned from assignment function' }
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred during assignment' }
    }
  }

  /**
   * Get detailed medication data for a patient
   */
  async getPatientMedicationsDetailed(patientId: string) {
    try {
      console.log('🔍 Getting detailed medications for patient:', patientId)
      
      const { data, error } = await supabase.rpc('get_patient_medications_detailed', {
        patient_uuid: patientId
      })

      if (error) {
        console.error('❌ Error fetching detailed medications:', error)
        return { data: [], error }
      }

      console.log('✅ Retrieved detailed medications:', data)
      return { data: data || [], error: null }
    } catch (error) {
      console.error('❌ Exception fetching detailed medications:', error)
      return { data: [], error }
    }
  }

  /**
   * Update medication order fields (payment, shipping, etc.)
   */
  async updateMedicationOrder(orderId: string, updates: {
    lastPaymentDate?: string
    sentToPharmacyDate?: string
    shippedToPharmacyDate?: string
    trackingNumber?: string
  }) {
    try {
      console.log('🔍 Updating medication order:', orderId, updates)
      
      const updateData: any = {}
      if (updates.lastPaymentDate) updateData.payment_date = updates.lastPaymentDate
      if (updates.sentToPharmacyDate) updateData.sent_to_pharmacy = updates.sentToPharmacyDate
      if (updates.shippedToPharmacyDate) updateData.shipped_date = updates.shippedToPharmacyDate
      if (updates.trackingNumber) updateData.tracking_number = updates.trackingNumber

      console.log('🔄 Prepared update data:', updateData)
      console.log('🔄 Making Supabase update call...')

      const { data, error } = await supabase
        .from('medication_orders')
        .update(updateData)
        .eq('id', orderId)
        .select()

      console.log('🔍 Supabase response - data:', data, 'error:', error)

      if (error) {
        console.error('❌ Error updating medication order:', error)
        return { success: false, error }
      }

      console.log('✅ Updated medication order:', data)
      return { success: true, data, error: null }
    } catch (error) {
      console.error('❌ Exception updating medication order:', error)
      return { success: false, error }
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