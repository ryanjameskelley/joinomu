import { supabase } from '../config/supabase.js'
import type { UserRole, AuthResponse, SignInCredentials, SignUpCredentials } from '../types/auth.js'
import type { Admin } from '../types/database.js'

export interface AdminSignUpCredentials {
  email: string
  password: string
  firstName: string
  lastName: string
  department?: string
}

export interface PatientSignUpCredentials {
  email: string
  password: string
  firstName: string
  lastName: string
  dateOfBirth?: string
  phone?: string
}

export interface ProviderSignUpCredentials {
  email: string
  password: string
  firstName: string
  lastName: string
  specialty: string
  licenseNumber: string
  phone?: string
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
   * Sign up user with email and password (legacy method)
   */
  async signUp(credentials: SignUpCredentials): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
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
   * Fetch user roles (can have multiple roles: admin, patient, provider)
   */
  async fetchUserRoles(userId: string): Promise<{ roles: UserRole[], primaryRole: UserRole | null }> {
    try {
      const roles: UserRole[] = []
      
      // Try to use secure RPC function first (bypasses RLS)
      try {
        const { data: rpcResult, error: rpcError } = await supabase
          .rpc('get_user_roles_secure', { user_id_param: userId })
        
        if (rpcResult && !rpcError) {
          console.log('🔍 Secure RPC result:', rpcResult)
          console.log('🔍 RPC result type:', typeof rpcResult)
          console.log('🔍 RPC result keys:', Object.keys(rpcResult))
          console.log('🔍 RPC result roles:', rpcResult.roles)
          console.log('🔍 RPC result primaryRole:', rpcResult.primary_role || rpcResult.primaryRole)
          console.log('✅ Using secure RPC results, skipping direct queries')
          return {
            roles: rpcResult.roles || [],
            primaryRole: rpcResult.primary_role || rpcResult.primaryRole || null
          }
        } else {
          console.log('Secure RPC failed, trying old RPC:', rpcError)
        }
      } catch (rpcErr) {
        console.log('Secure RPC function error:', rpcErr)
      }

      // Fallback to old RPC function
      try {
        const { data: rpcResult, error: rpcError } = await supabase
          .rpc('get_user_roles', { user_uuid: userId })
        
        if (rpcResult && !rpcError) {
          console.log('🔍 Old RPC result:', rpcResult)
          console.log('✅ Using old RPC results, skipping direct queries')
          return {
            roles: rpcResult.roles || [],
            primaryRole: rpcResult.primary_role || rpcResult.primaryRole || null
          }
        } else {
          console.log('Old RPC failed, falling back to direct queries:', rpcError)
        }
      } catch (rpcErr) {
        console.log('Old RPC function not available, using direct queries:', rpcErr)
      }
      
      console.log('⚠️ Falling back to direct table queries (may cause 406 errors)')
      
      // Fallback to direct table queries with error handling
      // Check if user is an admin (ignore 406 errors for now)
      try {
        const { data: adminData, error: adminError } = await supabase
          .from('admins')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle()
        
        if (adminData && !adminError) {
          roles.push('admin')
        }
      } catch (adminErr) {
        console.log('Admin check failed (likely RLS):', adminErr)
      }

      // Check if user is a patient (ignore 406 errors for now)
      try {
        const { data: patientData, error: patientError } = await supabase
          .from('patients')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle()
        
        if (patientData && !patientError) {
          roles.push('patient')
        }
      } catch (patientErr) {
        console.log('Patient check failed (likely RLS):', patientErr)
      }

      // Check if user is a provider (ignore 406 errors for now)
      try {
        const { data: providerData, error: providerError } = await supabase
          .from('providers')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle()
        
        if (providerData && !providerError) {
          roles.push('provider')
        }
      } catch (providerErr) {
        console.log('Provider check failed (likely RLS):', providerErr)
      }

      const primaryRole = roles.length > 0 ? roles[0] : null
      console.log('🔍 Roles found for user:', { userId, roles, primaryRole })
      return { roles, primaryRole }
    } catch (error) {
      console.error('Error fetching user roles:', error)
      return { roles: [], primaryRole: null }
    }
  }

  /**
   * Fetch user role by checking patients and admins tables (legacy method)
   * @deprecated Use fetchUserRoles instead for multi-role support
   */
  async fetchUserRole(userId: string): Promise<UserRole | null> {
    try {
      console.log('🔍 Fetching user role for ID:', userId)
      
      // Add timeout to prevent hanging
      const timeout = new Promise<{ roles: UserRole[], primaryRole: UserRole | null }>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout fetching user roles')), 10000)
      )
      
      const rolePromise = this.fetchUserRoles(userId)
      
      const { primaryRole } = await Promise.race([rolePromise, timeout])
      console.log('✅ User role fetched:', primaryRole)
      return primaryRole
    } catch (error) {
      console.error('❌ Error in fetchUserRole:', error)
      return null // Return null instead of throwing to prevent app from breaking
    }
  }

  /**
   * Sign up patient user with automatic record creation
   */
  async signUpPatient(credentials: PatientSignUpCredentials): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            role: 'patient',
            first_name: credentials.firstName,
            last_name: credentials.lastName,
            date_of_birth: credentials.dateOfBirth,
            phone: credentials.phone
          }
        }
      })

      // If signup succeeds but we need to check if patient record was created
      if (data.user && !error) {
        // Give the trigger a moment to run
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Check if patient record was created by trigger
        const { data: patientCheck, error: patientError } = await supabase
          .from('patients')
          .select('id')
          .eq('user_id', data.user.id)
          .maybeSingle()
        
        // If no patient record exists, create it manually as fallback
        if (!patientCheck && !patientError) {
          console.log('Trigger failed, creating patient record manually...')
          const { error: manualError } = await supabase
            .from('patients')
            .insert({
              id: crypto.randomUUID(),
              user_id: data.user.id,
              email: credentials.email,
              first_name: credentials.firstName,
              last_name: credentials.lastName,
              date_of_birth: credentials.dateOfBirth,
              phone: credentials.phone,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
          
          if (manualError) {
            console.error('Manual patient creation failed:', manualError)
          } else {
            console.log('Patient record created manually')
          }
        }
      }

      return { data, error }
    } catch (error) {
      return { 
        data: { user: null, session: null }, 
        error: { message: 'An unexpected error occurred during patient sign up' } 
      }
    }
  }

  /**
   * Sign up provider user with automatic record creation
   */
  async signUpProvider(credentials: ProviderSignUpCredentials): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            role: 'provider',
            first_name: credentials.firstName,
            last_name: credentials.lastName,
            specialty: credentials.specialty,
            license_number: credentials.licenseNumber,
            phone: credentials.phone
          }
        }
      })

      // If signup succeeds but we need to check if provider record was created
      if (data.user && !error) {
        // Give the trigger a moment to run
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Check if provider record was created by trigger
        const { data: providerCheck, error: providerError } = await supabase
          .from('providers')
          .select('id')
          .eq('user_id', data.user.id)
          .maybeSingle()
        
        // If no provider record exists, create it manually as fallback
        if (!providerCheck && !providerError) {
          console.log('Trigger failed, creating provider record manually...')
          const { error: manualError } = await supabase
            .from('providers')
            .insert({
              id: crypto.randomUUID(),
              user_id: data.user.id,
              email: credentials.email,
              first_name: credentials.firstName,
              last_name: credentials.lastName,
              specialty: credentials.specialty,
              license_number: credentials.licenseNumber,
              phone: credentials.phone,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
          
          if (manualError) {
            console.error('Manual provider creation failed:', manualError)
          } else {
            console.log('Provider record created manually')
          }
        }
      }

      return { data, error }
    } catch (error) {
      return { 
        data: { user: null, session: null }, 
        error: { message: 'An unexpected error occurred during provider sign up' } 
      }
    }
  }

  /**
   * Sign up admin user with automatic record creation
   */
  async signUpAdmin(credentials: AdminSignUpCredentials): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            role: 'admin',
            first_name: credentials.firstName,
            last_name: credentials.lastName,
            department: credentials.department || 'General'
          }
        }
      })

      // If signup succeeds but we need to check if admin record was created
      if (data.user && !error) {
        // Give the trigger a moment to run
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Check if admin record was created by trigger
        let adminCheck = null
        let adminError = null
        
        try {
          const result = await supabase
            .from('admins')
            .select('id')
            .eq('user_id', data.user.id)
            .maybeSingle()
          adminCheck = result.data
          adminError = result.error
        } catch (checkError) {
          console.log('Admin check failed with error, proceeding with creation:', checkError)
          adminError = checkError
        }
        
        // If no admin record exists OR if there was an error checking, create it manually as fallback
        if (!adminCheck) {
          console.log('Trigger failed, creating admin record manually using RPC...')
          
          // Use RPC function to bypass RLS
          const { data: rpcResult, error: rpcError } = await supabase
            .rpc('create_admin_record', {
              user_id_param: data.user.id,
              email_param: credentials.email,
              first_name_param: credentials.firstName,
              last_name_param: credentials.lastName
            })
          
          if (rpcError) {
            console.error('RPC admin creation failed:', rpcError)
            console.error('RPC Error details:', JSON.stringify(rpcError, null, 2))
          } else if (rpcResult?.success) {
            console.log('Admin record created successfully via RPC:', rpcResult)
            
            // Verify the record was actually created by checking again
            console.log('🔍 Verifying admin record creation...')
            try {
              const { data: verifyResult, error: verifyError } = await supabase
                .rpc('get_user_roles_secure', { user_id_param: data.user.id })
              
              console.log('🔍 Verification result:', verifyResult)
              if (verifyResult?.roles?.includes('admin')) {
                console.log('✅ Admin record verified successfully!')
              } else {
                console.log('❌ Admin record not found in verification check')
              }
            } catch (verifyErr) {
              console.log('❌ Verification check failed:', verifyErr)
            }
          } else {
            console.error('RPC returned error:', rpcResult)
          }
        } else if (adminCheck) {
          console.log('Admin record already exists (trigger worked)')
        } else if (adminError) {
          console.error('Error checking for admin record:', adminError)
        }
      }

      return { data, error }
    } catch (error) {
      return { 
        data: { user: null, session: null }, 
        error: { message: 'An unexpected error occurred during admin sign up' } 
      }
    }
  }

  /**
   * Sign in admin user with role verification using RLS-compliant approach
   */
  async signInAdmin(credentials: SignInCredentials): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })

      if (error) {
        return { data: { user: null, session: null }, error }
      }

      if (data.user) {
        // Use auth service RPC to check admin role (bypasses RLS)
        const { roles } = await this.fetchUserRoles(data.user.id)
        
        if (!roles.includes('admin')) {
          await supabase.auth.signOut()
          return { 
            data: { user: null, session: null }, 
            error: { message: 'Access denied. Admin account required.' } 
          }
        }

        return { data, error: null }
      }

      return { data, error: null }
    } catch (error) {
      return { 
        data: { user: null, session: null }, 
        error: { message: 'An unexpected error occurred during admin sign in' } 
      }
    }
  }

  /**
   * Sign in provider user with role verification using RLS-compliant approach
   */
  async signInProvider(credentials: SignInCredentials): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })

      if (error) {
        return { data: { user: null, session: null }, error }
      }

      if (data.user) {
        // Use auth service RPC to check provider role (bypasses RLS)
        const { roles } = await this.fetchUserRoles(data.user.id)
        
        if (!roles.includes('provider')) {
          await supabase.auth.signOut()
          return { 
            data: { user: null, session: null }, 
            error: { message: 'Access denied. Provider account required.' } 
          }
        }

        return { data, error: null }
      }

      return { data, error: null }
    } catch (error) {
      return { 
        data: { user: null, session: null }, 
        error: { message: 'An unexpected error occurred during provider sign in' } 
      }
    }
  }

  /**
   * Sign in patient user with role verification using RLS-compliant approach
   */
  async signInPatient(credentials: SignInCredentials): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })

      if (error) {
        return { data: { user: null, session: null }, error }
      }

      if (data.user) {
        // Use auth service RPC to check patient role (bypasses RLS)
        const { roles } = await this.fetchUserRoles(data.user.id)
        
        if (!roles.includes('patient')) {
          await supabase.auth.signOut()
          return { 
            data: { user: null, session: null }, 
            error: { message: 'Access denied. Patient account required.' } 
          }
        }

        return { data, error: null }
      }

      return { data, error: null }
    } catch (error) {
      return { 
        data: { user: null, session: null }, 
        error: { message: 'An unexpected error occurred during patient sign in' } 
      }
    }
  }

  /**
   * Get admin data for current user
   */
  async getAdminData(userId: string): Promise<{ data: Admin | null, error: any }> {
    try {
      // First check if user has admin role using secure RPC
      const { roles } = await this.fetchUserRoles(userId)
      
      if (!roles.includes('admin')) {
        return { data: null, error: { message: 'User is not an admin' } }
      }

      // Try direct query first
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (data && !error) {
        return { data, error: null }
      }

      // If direct query fails, create a mock admin data object since we know they're an admin
      console.log('Direct admin query failed, creating mock admin data for dashboard')
      
      // Generate a simple UUID alternative
      const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };
      
      const mockAdminData = {
        id: generateUUID(),
        user_id: userId,
        email: 'admin@example.com', // This should be updated from user data
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin' as const,
        permissions: ['messages', 'patients', 'dashboard'],
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      return { data: mockAdminData, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  /**
   * Get provider data for current user
   */
  async getProviderData(userId: string): Promise<{ data: any | null, error: any }> {
    try {
      const { data, error } = await supabase
        .from('providers')
        .select('*')
        .eq('user_id', userId)
        .single()

      return { data: data || null, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  /**
   * Assign patient to provider (admin only)
   */
  async assignPatientToProvider(
    patientId: string,
    providerId: string,
    treatmentType: string = 'general_care',
    isPrimary: boolean = false
  ): Promise<{ success: boolean, error?: string, assignmentId?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('assign_patient_to_provider', {
          patient_uuid: patientId,
          provider_uuid: providerId,
          treatment_type_param: treatmentType,
          is_primary_param: isPrimary
        })

      if (error) {
        return { success: false, error: error.message }
      }

      return {
        success: data.success,
        error: data.error,
        assignmentId: data.assignment_id
      }
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