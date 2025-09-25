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
   * Get available medications from the database
   */
  async getAvailableMedications() {
    try {
      console.log('🔍 Getting available medications')
      console.log('🔄 Making Supabase query...')
      
      const { data, error } = await supabase
        .from('medications')
        .select('*')
        .eq('active', true)
        .order('name')

      console.log('🔄 Supabase query completed')
      console.log('🔍 Query result - data:', data, 'error:', error)

      if (error) {
        console.error('❌ Error fetching medications:', error)
        return { data: [], error }
      }

      console.log('🔍 Raw medication data:', data)

      // Group medications by name and collect available strengths
      const medicationMap = new Map()
      
      if (data && Array.isArray(data)) {
        console.log('🔄 Processing medications...')
        data.forEach((med, index) => {
          console.log(`Processing med ${index}:`, med)
          const key = med.name
          if (!medicationMap.has(key)) {
            medicationMap.set(key, {
              id: med.id, // Use the first ID found for this medication name
              name: `${med.name} (${med.brand_name})`,
              description: med.description,
              category: med.category,
              available_dosages: [med.strength]
            })
          } else {
            const existing = medicationMap.get(key)
            if (!existing.available_dosages.includes(med.strength)) {
              existing.available_dosages.push(med.strength)
            }
          }
        })
      }

      const groupedMedications = Array.from(medicationMap.values())
      console.log('✅ Retrieved and grouped medications:', groupedMedications)
      return { data: groupedMedications, error: null }
    } catch (error) {
      console.error('❌ Exception fetching medications:', error)
      return { data: [], error }
    }
  }

  /**
   * Create medication preference for patient
   */
  async createMedicationPreference(profileId: string, medicationId: string, dosage: string) {
    try {
      console.log('🔍 Creating medication preference for profile:', profileId, 'medication:', medicationId, 'dosage:', dosage)
      
      // First, get the patient ID from the patients table using the profile ID
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('id')
        .eq('profile_id', profileId)
        .single()

      if (patientError || !patientData) {
        console.error('❌ Error finding patient record:', patientError)
        return { success: false, error: patientError || { message: 'Patient not found' } }
      }

      console.log('✅ Found patient ID:', patientData.id)
      
      const insertData = {
        patient_id: patientData.id,
        medication_id: medicationId,
        preferred_dosage: dosage,
        status: 'pending'
      }
      
      console.log('🔄 Insert data prepared:', insertData)
      console.log('🔄 Making Supabase insert call...')

      const { data, error } = await supabase
        .from('patient_medication_preferences')
        .insert(insertData)
        .select()

      console.log('🔍 Supabase insert response - data:', data, 'error:', error)

      if (error) {
        console.error('❌ Error creating medication preference:', error)
        return { success: false, error }
      }

      console.log('✅ Created medication preference:', data)
      return { success: true, data, error: null }
    } catch (error) {
      console.error('❌ Exception creating medication preference:', error)
      return { success: false, error }
    }
  }

  /**
   * Get patient medication preferences for provider view
   */
  async getPatientMedicationPreferences(patientId: string) {
    try {
      console.log('🔍 Getting medication preferences for patient:', patientId)
      console.log('🔄 Starting Supabase query...')
      
      // Try simple query first - temporarily check if any records exist at all
      console.log('🔄 First checking if any records exist...')
      const { count } = await supabase
        .from('patient_medication_preferences')
        .select('*', { count: 'exact', head: true })
        .eq('patient_id', patientId)
      
      console.log('🔄 Record count for patient:', count)
      
      // Now try the actual query with medication name join
      const { data, error } = await supabase
        .from('patient_medication_preferences')
        .select(`
          id,
          medication_id,
          preferred_dosage,
          frequency,
          notes,
          status,
          requested_date,
          created_at,
          updated_at,
          medications(name)
        `)
        .eq('patient_id', patientId)
        .order('requested_date', { ascending: false })
      
      console.log('🔄 Supabase query completed:', { data, error })

      if (error) {
        console.error('❌ Error fetching patient medication preferences:', error)
        return { data: [], error }
      }

      // Transform the data to match the PatientMedicationPreference interface
      const transformedPreferences = (data || []).map((pref: any) => ({
        id: pref.id,
        medication_name: pref.medications?.name || 'Unknown Medication',
        preferred_dosage: pref.preferred_dosage || 'Not specified',
        frequency: pref.frequency || 'As needed',
        status: pref.status,
        requested_date: pref.requested_date,
        notes: pref.notes || null
      }))

      console.log('✅ Retrieved patient medication preferences:', transformedPreferences)
      return { data: transformedPreferences, error: null }
    } catch (error) {
      console.error('❌ Exception fetching patient medication preferences:', error)
      return { data: [], error }
    }
  }

  /**
   * Update medication preference for provider
   */
  async updateMedicationPreference(medicationPreferenceId: string, updates: {
    status?: string
    dosage?: string
    frequency?: string
    providerNotes?: string
  }) {
    try {
      console.log('🔍 Updating medication preference:', medicationPreferenceId, updates)
      console.log('🔄 Starting medication preference update flow...')
      
      // Get the current medication preference to check for status changes
      const { data: currentPref, error: fetchError } = await supabase
        .from('patient_medication_preferences')
        .select('status, patient_id, medication_id')
        .eq('id', medicationPreferenceId)
        .single()
      
      // Get the current provider ID (we need this for approvals)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { success: false, error: { message: 'Not authenticated' } }
      }
      
      const { data: provider, error: providerError } = await supabase
        .from('providers')
        .select('id')
        .eq('profile_id', user.id)
        .single()
        
      if (providerError || !provider) {
        return { success: false, error: { message: 'Provider not found' } }
      }

      if (fetchError) {
        console.error('❌ Error fetching current preference:', fetchError)
        return { success: false, error: fetchError }
      }

      const wasStatusChanged = updates.status && updates.status !== currentPref.status
      const wasApproved = updates.status === 'approved' && currentPref.status !== 'approved'
      
      // Prepare update data for patient_medication_preferences
      const updateData: any = {}
      if (updates.status) updateData.status = updates.status
      if (updates.dosage) updateData.preferred_dosage = updates.dosage
      if (updates.frequency) updateData.frequency = updates.frequency
      if (updates.providerNotes) updateData.notes = updates.providerNotes

      console.log('🔄 Prepared update data:', updateData)
      console.log('🔄 Status change detected:', wasStatusChanged, 'Was approved:', wasApproved)

      // Update the medication preference
      console.log('🔄 Executing Supabase update...')
      const { data, error } = await supabase
        .from('patient_medication_preferences')
        .update(updateData)
        .eq('id', medicationPreferenceId)
        .select()

      if (error) {
        console.error('❌ Error updating medication preference:', error)
        return { success: false, error }
      }

      console.log('✅ Updated medication preference:', data)
      console.log('🔍 Verifying update - new status should be:', updates.status)

      // If status changed to approved, create medication approval and order
      if (wasApproved) {
        console.log('🔄 Status changed to approved, creating medication approval and order...')
        
        try {
          // Create medication approval record
          const { data: approvalData, error: approvalError } = await supabase
            .from('medication_approvals')
            .insert({
              preference_id: medicationPreferenceId,
              provider_id: provider.id,
              status: 'approved',
              approved_dosage: updates.dosage || null,
              approved_frequency: updates.frequency || null,
              provider_notes: updates.providerNotes || null,
              approval_date: new Date().toISOString()
            })
            .select()

          if (approvalError) {
            console.error('❌ Error creating medication approval:', approvalError)
            // Continue anyway, the preference update succeeded
          } else {
            console.log('✅ Created medication approval:', approvalData)
          }

          // Create medication order if approval was successful
          if (!approvalError && approvalData && approvalData[0]) {
            // Get medication info for pricing
            const { data: medicationInfo } = await supabase
              .from('medications')
              .select('unit_price')
              .eq('id', currentPref.medication_id)
              .single()
            
            const unitPrice = medicationInfo?.unit_price || 0
            const quantity = 1 // Default quantity
            
            const { data: orderData, error: orderError } = await supabase
              .from('medication_orders')
              .insert({
                approval_id: approvalData[0].id,
                patient_id: currentPref.patient_id,
                medication_id: currentPref.medication_id,
                quantity: quantity,
                unit_price: unitPrice,
                total_amount: unitPrice * quantity,
                payment_status: 'pending',
                fulfillment_status: 'pending'
              })
              .select()
            
            if (orderError) {
              console.error('❌ Error creating medication order:', orderError)
            } else {
              console.log('✅ Created medication order:', orderData)
            }
          }

        } catch (approvalOrderError) {
          console.error('❌ Exception creating approval/order:', approvalOrderError)
          // Continue anyway, the preference update succeeded
        }
      }

      return { success: true, data, error: null }
    } catch (error) {
      console.error('❌ Exception updating medication preference:', error)
      return { success: false, error }
    }
  }

  /**
   * Get patient medication orders for admin view
   */
  async getPatientMedicationOrders(patientId: string) {
    try {
      console.log('🔍 Getting medication orders for patient:', patientId)
      
      const { data, error } = await supabase
        .from('medication_orders')
        .select(`
          id,
          approval_id,
          quantity,
          unit_price,
          total_amount,
          payment_status,
          fulfillment_status,
          created_at,
          shipped_date,
          tracking_number,
          medication_approvals!inner(
            preference_id,
            approved_dosage,
            patient_medication_preferences!inner(
              medication_id,
              medications(name)
            )
          )
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error fetching medication orders:', error)
        return { data: [], error }
      }

      // Transform the data for the UI
      const transformedOrders = data?.map(order => ({
        id: order.id,
        approval_id: order.approval_id,
        preference_id: order.medication_approvals?.preference_id || null,
        medication_name: order.medication_approvals?.patient_medication_preferences?.medications?.name || 'Unknown',
        quantity: order.quantity,
        dosage: order.medication_approvals?.approved_dosage || 'Unknown',
        total_amount: order.total_amount,
        payment_status: order.payment_status,
        fulfillment_status: order.fulfillment_status,
        created_at: order.created_at,
        shipped_date: order.shipped_date,
        tracking_number: order.tracking_number
      })) || []

      console.log('✅ Fetched medication orders:', transformedOrders)
      return { data: transformedOrders, error: null }

    } catch (error) {
      console.error('❌ Exception fetching medication orders:', error)
      return { data: [], error }
    }
  }

  /**
   * Get medication orders for a specific preference ID
   */
  async getOrdersByPreferenceId(preferenceId: string) {
    try {
      console.log('🔍 AUTH: Getting orders for preference:', preferenceId)
      console.log('🔍 AUTH: Expected to find approval 3e34c9f4-9b47-48bd-b0b5-58e243ca0661 and order b99eda3a-2e7e-45d0-b33c-f772d41198b5')
      
      console.log('🔍 AUTH: About to execute Supabase query...')
      const { data, error } = await supabase
        .from('medication_orders')
        .select(`
          id,
          approval_id,
          quantity,
          unit_price,
          total_amount,
          payment_status,
          fulfillment_status,
          created_at,
          shipped_date,
          tracking_number,
          medication_approvals!inner(
            preference_id,
            approved_dosage,
            patient_medication_preferences!inner(
              medication_id,
              medications(name)
            )
          )
        `)
        .eq('medication_approvals.preference_id', preferenceId)
        .order('created_at', { ascending: false })

      console.log('🔍 AUTH: Raw query result:', { data, error })
      console.log('🔍 AUTH: Query found', data?.length || 0, 'orders')
      if (data && data.length > 0) {
        console.log('🔍 AUTH: First order details:', data[0])
      }

      if (error) {
        console.error('❌ AUTH: Error fetching orders for preference:', error)
        return { data: [], error }
      }

      // Transform the data for the UI
      const transformedOrders = data?.map(order => ({
        id: order.id,
        approval_id: order.approval_id,
        preference_id: preferenceId,
        medication_name: order.medication_approvals?.patient_medication_preferences?.medications?.name || 'Unknown',
        quantity: order.quantity,
        dosage: order.medication_approvals?.approved_dosage || 'Unknown',
        total_amount: order.total_amount,
        payment_status: order.payment_status,
        fulfillment_status: order.fulfillment_status,
        created_at: order.created_at,
        shipped_date: order.shipped_date,
        tracking_number: order.tracking_number
      })) || []

      console.log('✅ Fetched orders for preference:', transformedOrders)
      return { data: transformedOrders, error: null }
      
    } catch (error) {
      console.error('❌ AUTH EXCEPTION: fetching orders for preference:', error)
      console.error('❌ AUTH EXCEPTION: error details:', JSON.stringify(error, null, 2))
      return { data: [], error }
    }
  }

  /**
   * Update medication order fields (admin only)
   */
  async updateMedicationOrderAdmin(orderId: string, updates: {
    payment_status?: string
    payment_method?: string
    payment_date?: string
    fulfillment_status?: string
    tracking_number?: string
    shipped_date?: string
    estimated_delivery?: string
    admin_notes?: string
  }) {
    try {
      console.log('🔍 Updating medication order (admin):', orderId, updates)
      
      const updateData: any = {}
      if (updates.payment_status) updateData.payment_status = updates.payment_status
      if (updates.payment_method) updateData.payment_method = updates.payment_method
      if (updates.payment_date) updateData.payment_date = updates.payment_date
      if (updates.fulfillment_status) updateData.fulfillment_status = updates.fulfillment_status
      if (updates.tracking_number) updateData.tracking_number = updates.tracking_number
      if (updates.shipped_date) updateData.shipped_date = updates.shipped_date
      if (updates.estimated_delivery) updateData.estimated_delivery = updates.estimated_delivery
      if (updates.admin_notes) updateData.admin_notes = updates.admin_notes

      console.log('🔄 Prepared update data:', updateData)

      const { data, error } = await supabase
        .from('medication_orders')
        .update(updateData)
        .eq('id', orderId)
        .select()

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