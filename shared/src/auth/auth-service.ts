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
   * Get user role - optimized for immediate response
   */
  async getUserRole(userId: string): Promise<UserRole | null> {
    console.log('🔍 getUserRole: Checking role for user:', userId)
    
    // Note: Removed hardcoded role override to allow proper role detection
    
    try {
      // Single direct query to profiles table
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()

      if (profileData?.role) {
        console.log('✅ getUserRole: Found role:', profileData.role)
        return profileData.role as UserRole
      }
      
      console.log('❌ getUserRole: No role found')
      return null
      
    } catch (error) {
      console.error('❌ getUserRole: Error:', error)
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
      
      // Query medications with their available dosages from the new medication_dosages table
      const { data, error } = await supabase
        .from('medications')
        .select(`
          id,
          name,
          generic_name,
          brand_name,
          dosage_form,
          description,
          category,
          requires_prescription,
          active,
          medication_dosages!inner (
            id,
            strength,
            unit_price,
            available,
            sort_order
          )
        `)
        .eq('active', true)
        .eq('medication_dosages.available', true)
        .order('name')

      console.log('🔄 Supabase query completed')
      console.log('🔍 Query result - data:', data, 'error:', error)

      if (error) {
        console.error('❌ Error fetching medications:', error)
        return { data: [], error }
      }

      console.log('🔍 Raw medication data:', data)

      // Transform the data to group dosages per medication
      const medications = []
      
      if (data && Array.isArray(data)) {
        console.log('🔄 Processing medications...')
        data.forEach((med, index) => {
          console.log(`Processing med ${index}:`, med)
          
          // Extract available dosages and sort them
          const available_dosages = med.medication_dosages
            .filter(dosage => dosage.available)
            .sort((a, b) => a.sort_order - b.sort_order)
            .map(dosage => dosage.strength)
          
          medications.push({
            id: med.id,
            name: `${med.name} (${med.brand_name})`,
            description: med.description,
            category: med.category,
            available_dosages: available_dosages
          })
        })
      }

      console.log('✅ Retrieved medications with dosages:', medications)
      return { data: medications, error: null }
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
  async getPatientMedicationPreferences(authUserId: string) {
    try {
      console.log('🔍 Getting medication preferences for auth user:', authUserId)
      console.log('🔄 First converting auth user ID to patient profile ID...')
      
      // Convert auth user ID to patient ID (same logic as create method)
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('id')
        .eq('profile_id', authUserId)
        .single()
      
      if (patientError || !patientData) {
        console.error('❌ Failed to find patient for auth user:', authUserId, patientError)
        return { data: [], error: patientError }
      }
      
      const patientId = patientData.id
      console.log('✅ Found patient ID:', patientId)
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
   * Update medication preference for patient (Patient function)
   */
  async updatePatientMedicationPreference(medicationPreferenceId: string, updates: {
    dosage?: string
    frequency?: string
  }) {
    try {
      console.log('🔍 Patient updating medication preference:', medicationPreferenceId, updates)
      
      // Prepare update data - always reset status to pending for patient changes
      const updateData: any = {
        status: 'pending' // Reset to pending when patient makes changes
      }
      if (updates.dosage) updateData.preferred_dosage = updates.dosage
      if (updates.frequency) updateData.frequency = updates.frequency
      
      console.log('🔄 Patient update data:', updateData)
      
      // Update the preference
      const { data, error } = await supabase
        .from('patient_medication_preferences')
        .update(updateData)
        .eq('id', medicationPreferenceId)
        .select()
        .single()
      
      if (error) {
        console.error('❌ Error updating patient medication preference:', error)
        return { success: false, error }
      }
      
      console.log('✅ Patient medication preference updated:', data)
      return { success: true, data }
    } catch (error) {
      console.error('❌ Exception updating patient medication preference:', error)
      return { success: false, error }
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
   * ================================
   * APPOINTMENT SYSTEM METHODS
   * ================================
   */

  /**
   * Get available appointment slots for a provider using database function
   */
  async getAvailableSlots(
    providerId: string,
    startDate: string, // YYYY-MM-DD format
    endDate: string,   // YYYY-MM-DD format
    treatmentType?: string
  ) {
    try {
      console.log('🔍 Getting available slots for provider:', providerId)
      console.log('🔍 Date range:', startDate, 'to', endDate)
      console.log('🔍 Treatment type filter:', treatmentType)
      
      // Use the new database function that properly excludes rescheduled appointments
      const { data, error } = await supabase
        .rpc('get_available_slots_for_provider', {
          p_provider_id: providerId,
          p_start_date: startDate,
          p_end_date: endDate,
          p_treatment_type: treatmentType || null
        })

      if (error) {
        console.error('❌ Error getting available slots:', error)
        return { data: [], error }
      }

      console.log('✅ Retrieved available slots from database function:', data?.length || 0)
      return { data: data || [], error: null }
      
    } catch (error) {
      console.error('❌ Exception getting available slots:', error)
      return { data: [], error }
    }
  }

  private async getAvailableSlotsInternal(
    providerId: string,
    startDate: string,
    endDate: string,
    treatmentType?: string
  ) {
    try {
      
      // Get provider schedules from database
      console.log('🔍 Querying provider_schedules table...')
      let scheduleQuery = supabase
        .from('provider_schedules')
        .select('*')
        .eq('provider_id', providerId)
        .eq('active', true)
      
      // Filter by treatment type if specified
      if (treatmentType) {
        console.log('🔍 Filtering by treatment type:', treatmentType)
        // Allow providers with:
        // 1. Specific treatment type in their array
        // 2. Empty treatment_types arrays (general providers)
        // 3. If searching for 'consultation', also allow weight_loss providers (most common)
        if (treatmentType === 'consultation') {
          scheduleQuery = scheduleQuery.or(`treatment_types.cs.{${treatmentType}},treatment_types.cs.{weight_loss},treatment_types.eq.{}`)
        } else {
          scheduleQuery = scheduleQuery.or(`treatment_types.cs.{${treatmentType}},treatment_types.eq.{}`)
        }
      }
      
      console.log('🔍 Executing schedule query...')
      const { data: schedules, error: scheduleError } = await scheduleQuery
      console.log('🔍 Schedule query completed:', { schedules: schedules?.length, error: scheduleError })
      
      if (scheduleError) {
        console.error('❌ Error getting provider schedules:', scheduleError)
        return { data: [], error: scheduleError }
      }
      
      if (!schedules || schedules.length === 0) {
        console.log('⚠️ No schedules found for provider')
        return { data: [], error: null }
      }
      
      console.log('✅ Found provider schedules:', schedules.length)
      
      // Get availability overrides for the date range (Layer 2: Date-specific exceptions)
      console.log('🔍 Querying availability overrides...')
      const { data: overrides, error: overridesError } = await supabase
        .from('provider_availability_overrides')
        .select('*')
        .eq('provider_id', providerId)
        .gte('date', startDate)
        .lte('date', endDate)
      
      if (overridesError) {
        console.error('⚠️ Error getting availability overrides (continuing without):', overridesError)
      } else {
        console.log('✅ Found availability overrides:', overrides?.length || 0)
      }

      // Generate slots based on actual schedules (Layer 1: Base schedules)
      const slots = []
      const start = new Date(startDate)
      const end = new Date(endDate)
      
      // Iterate through each date in the range
      for (let currentDate = new Date(start); currentDate <= end; currentDate.setDate(currentDate.getDate() + 1)) {
        const dayOfWeek = currentDate.getDay()
        const dateStr = currentDate.toISOString().split('T')[0]
        
        // Check for date-specific overrides
        const dateOverrides = overrides?.filter(override => override.date === dateStr) || []
        
        // Check if entire day is blocked by an override
        const dayBlockedOverride = dateOverrides.find(override => 
          !override.available && !override.start_time && !override.end_time
        )
        
        if (dayBlockedOverride) {
          console.log(`🚫 Day ${dateStr} is completely blocked: ${dayBlockedOverride.reason}`)
          continue // Skip this entire date
        }
        
        // Find schedules for this day of week
        const daySchedules = schedules.filter(schedule => schedule.day_of_week === dayOfWeek)
        
        // Generate slots from regular schedules
        for (const schedule of daySchedules) {
          // Parse start and end times
          const [startHour, startMinute] = schedule.start_time.split(':').map(Number)
          const [endHour, endMinute] = schedule.end_time.split(':').map(Number)
          
          const slotDuration = schedule.slot_duration_minutes
          
          // Generate slots for this schedule block
          let currentTime = new Date(currentDate)
          currentTime.setHours(startHour, startMinute, 0, 0)
          
          const blockEnd = new Date(currentDate)
          blockEnd.setHours(endHour, endMinute, 0, 0)
          
          while (currentTime < blockEnd) {
            const slotEndTime = new Date(currentTime.getTime() + (slotDuration * 60 * 1000))
            
            // Only add slot if it fits within the schedule block
            if (slotEndTime <= blockEnd) {
              const timeStr = currentTime.toTimeString().slice(0, 8) // HH:MM:SS
              const endTimeStr = slotEndTime.toTimeString().slice(0, 8) // HH:MM:SS
              
              // Check if this specific time slot is blocked by an override
              const isBlocked = dateOverrides.some(override => 
                !override.available && 
                override.start_time && override.end_time &&
                timeStr >= override.start_time && timeStr < override.end_time
              )
              
              if (!isBlocked) {
                // Find any override that affects this slot (for admin visibility)
                const relevantOverride = dateOverrides.find(override =>
                  override.start_time && override.end_time &&
                  timeStr >= override.start_time && timeStr < override.end_time
                )
                
                slots.push({
                  slot_date: dateStr,
                  slot_start_time: timeStr,
                  slot_end_time: endTimeStr,
                  duration_minutes: slotDuration,
                  // Keep datetime for backward compatibility
                  datetime: currentTime.toISOString().slice(0, 19),
                  duration: slotDuration,
                  // Include override information for admin visibility
                  override_reason: relevantOverride?.reason || null,
                  is_override: relevantOverride ? true : false
                })
              } else {
                console.log(`🚫 Slot ${dateStr} ${timeStr} blocked by override`)
              }
            }
            
            // Move to next slot
            currentTime = new Date(currentTime.getTime() + (slotDuration * 60 * 1000))
          }
        }
        
        // Add extra slots from available=true overrides (custom availability)
        const customAvailabilityOverrides = dateOverrides.filter(override =>
          override.available && override.start_time && override.end_time
        )
        
        for (const customOverride of customAvailabilityOverrides) {
          console.log(`✅ Adding custom availability for ${dateStr}: ${customOverride.start_time}-${customOverride.end_time}`)
          
          // Use default slot duration or infer from override time range
          const [overrideStartHour, overrideStartMinute] = customOverride.start_time.split(':').map(Number)
          const [overrideEndHour, overrideEndMinute] = customOverride.end_time.split(':').map(Number)
          
          // Default to 30 minutes or use the first schedule's duration
          const customSlotDuration = daySchedules[0]?.slot_duration_minutes || 30
          
          let customTime = new Date(currentDate)
          customTime.setHours(overrideStartHour, overrideStartMinute, 0, 0)
          
          const customEnd = new Date(currentDate)
          customEnd.setHours(overrideEndHour, overrideEndMinute, 0, 0)
          
          while (customTime < customEnd) {
            const customSlotEnd = new Date(customTime.getTime() + (customSlotDuration * 60 * 1000))
            
            if (customSlotEnd <= customEnd) {
              const customTimeStr = customTime.toTimeString().slice(0, 8)
              const customEndTimeStr = customSlotEnd.toTimeString().slice(0, 8)
              
              // Avoid duplicate slots from regular schedules
              const existingSlot = slots.find(slot =>
                slot.slot_date === dateStr && slot.slot_start_time === customTimeStr
              )
              
              if (!existingSlot) {
                slots.push({
                  slot_date: dateStr,
                  slot_start_time: customTimeStr,
                  slot_end_time: customEndTimeStr,
                  duration_minutes: customSlotDuration,
                  datetime: customTime.toISOString().slice(0, 19),
                  duration: customSlotDuration,
                  override_reason: customOverride.reason,
                  is_override: true
                })
              }
            }
            
            customTime = new Date(customTime.getTime() + (customSlotDuration * 60 * 1000))
          }
        }
      }
      
      // Get existing appointments to exclude booked slots (with timeout protection)
      try {
        console.log('🔍 Checking for existing appointments...')
        const appointmentQuery = supabase
          .from('appointments')
          .select('appointment_date, start_time, end_time')
          .eq('provider_id', providerId)
          .gte('appointment_date', startDate)
          .lte('appointment_date', endDate)
          .in('status', ['scheduled', 'confirmed'])

        const { data: appointments, error: appointmentError } = await Promise.race([
          appointmentQuery,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Appointment query timeout')), 3000)
          )
        ]) as { data: any[], error: any }
        
        if (appointmentError) {
          console.error('⚠️ Error getting existing appointments (continuing without filtering):', appointmentError)
        } else if (appointments && appointments.length > 0) {
          console.log('🔍 Filtering out', appointments.length, 'existing appointments')
          
          // Remove slots that conflict with existing appointments
          const availableSlots = slots.filter(slot => {
            const slotDate = slot.slot_date
            const slotTime = slot.slot_start_time
            
            return !appointments.some(appointment => 
              appointment.appointment_date === slotDate &&
              appointment.start_time <= slotTime &&
              appointment.end_time > slotTime
            )
          })
          
          console.log('✅ Generated available slots after filtering:', availableSlots.length, 'of', slots.length, 'total slots')
          return { data: availableSlots, error: null }
        } else {
          console.log('🔍 No existing appointments found, showing all generated slots')
        }
      } catch (error) {
        console.error('⚠️ Appointment filtering failed, showing unfiltered slots:', error.message)
      }
      
      console.log('✅ Generated available slots from real schedules:', slots.length)
      return { data: slots, error: null }
      
    } catch (error) {
      console.error('❌ Exception getting available slots internal:', error)
      return { data: [], error }
    }
  }

  /**
   * Get patient's appointments
   */
  async getPatientAppointments(patientProfileId: string, includePast = false) {
    try {
      console.log('🔍 Getting appointments for patient:', patientProfileId)
      
      const { data, error } = await supabase.rpc('get_patient_appointments', {
        p_patient_profile_id: patientProfileId,
        p_include_past: includePast
      })

      if (error) {
        console.error('❌ Error getting patient appointments:', error)
        return { data: [], error }
      }

      console.log('✅ Retrieved patient appointments:', data?.length || 0)
      return { data: data || [], error: null }
    } catch (error) {
      console.error('❌ Exception getting patient appointments:', error)
      return { data: [], error }
    }
  }

  /**
   * Book a new appointment
   */
  async bookAppointment(appointmentData: {
    patientProfileId: string
    providerId: string
    appointmentDate: string // YYYY-MM-DD format
    startTime: string       // HH:MM:SS format
    treatmentType: string
    appointmentType?: string
    bookedBy?: string
    patientNotes?: string
  }) {
    try {
      console.log('🔍 Booking appointment:', appointmentData)
      
      // Ensure time format is HH:MM:SS (RPC function expects seconds)
      const startTimeWithSeconds = appointmentData.startTime.includes(':') 
        ? (appointmentData.startTime.split(':').length === 2 
           ? `${appointmentData.startTime}:00` 
           : appointmentData.startTime)
        : `${appointmentData.startTime}:00`
      
      const { data, error } = await supabase.rpc('book_appointment', {
        p_patient_profile_id: appointmentData.patientProfileId,
        p_provider_id: appointmentData.providerId,
        p_appointment_date: appointmentData.appointmentDate,
        p_start_time: startTimeWithSeconds,
        p_treatment_type: appointmentData.treatmentType,
        p_appointment_type: appointmentData.appointmentType || 'consultation',
        p_booked_by: appointmentData.bookedBy || 'patient',
        p_patient_notes: appointmentData.patientNotes || null
      })

      if (error) {
        console.error('❌ Error booking appointment:', error)
        return { success: false, error }
      }

      const result = data?.[0]
      if (result?.success) {
        console.log('✅ Appointment booked successfully:', result.appointment_id)
        return { success: true, appointmentId: result.appointment_id, message: result.message }
      } else {
        console.error('❌ Booking failed:', result?.message)
        return { success: false, error: { message: result?.message || 'Unknown error' } }
      }
    } catch (error) {
      console.error('❌ Exception booking appointment:', error)
      return { success: false, error }
    }
  }

  /**
   * Reschedule an appointment using the database function
   */
  async rescheduleAppointment(
    appointmentId: string,
    newDate: string,
    newTime: string,
    rescheduledBy: string = 'patient',
    rescheduledByUserId?: string,
    reason?: string
  ) {
    try {
      console.log('🔍 Rescheduling appointment:', appointmentId, 'to', newDate, newTime)
      
      // Use the database function for proper reschedule logic
      const { data, error } = await supabase
        .rpc('reschedule_appointment', {
          p_appointment_id: appointmentId,
          p_new_date: newDate,
          p_new_time: newTime,
          p_rescheduled_by: rescheduledBy,
          p_rescheduled_by_user_id: rescheduledByUserId,
          p_reason: reason
        })

      if (error) {
        console.error('❌ Error rescheduling appointment:', error)
        return { success: false, error }
      }

      console.log('🔍 Reschedule function result:', data)

      if (data && data.success) {
        console.log('✅ Appointment rescheduled successfully')
        return { 
          success: true, 
          data: {
            oldAppointmentId: data.old_appointment_id,
            newAppointmentId: data.new_appointment_id,
            message: data.message
          }
        }
      } else {
        console.error('❌ Reschedule failed:', data?.error)
        return { success: false, error: { message: data?.error || 'Failed to reschedule appointment' } }
      }
    } catch (error) {
      console.error('❌ Exception rescheduling appointment:', error)
      return { success: false, error }
    }
  }

  /**
   * Calculate end time for appointment
   */
  private calculateEndTime(startTime: string, durationMinutes: number): string {
    const [hours, minutes] = startTime.split(':').map(Number)
    const startDate = new Date()
    startDate.setHours(hours, minutes, 0, 0)
    
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000)
    return `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}:00`
  }

  /**
   * Cancel an appointment
   */
  async cancelAppointment(
    appointmentId: string,
    cancelledBy: string, // 'patient', 'provider', or 'admin'
    cancelledByUserId: string,
    reason: string
  ) {
    try {
      console.log('🔍 Cancelling appointment:', appointmentId)
      
      const { data, error } = await supabase.rpc('cancel_appointment', {
        p_appointment_id: appointmentId,
        p_cancelled_by: cancelledBy,
        p_cancelled_by_user_id: cancelledByUserId,
        p_cancellation_reason: reason
      })

      if (error) {
        console.error('❌ Error cancelling appointment:', error)
        return { success: false, error }
      }

      const result = data?.[0]
      if (result?.success) {
        console.log('✅ Appointment cancelled successfully')
        return { success: true, message: result.message }
      } else {
        console.error('❌ Cancellation failed:', result?.message)
        return { success: false, error: { message: result?.message || 'Unknown error' } }
      }
    } catch (error) {
      console.error('❌ Exception cancelling appointment:', error)
      return { success: false, error }
    }
  }

  /**
   * Get admin appointment overview
   */
  async getAdminAppointmentOverview(filters?: {
    startDate?: string
    endDate?: string
    providerId?: string
    patientId?: string
  }) {
    try {
      console.log('🔍 Getting admin appointment overview')
      
      const { data, error } = await supabase.rpc('get_admin_appointment_overview', {
        p_date_range_start: filters?.startDate || null,
        p_date_range_end: filters?.endDate || null,
        p_provider_id: filters?.providerId || null,
        p_patient_id: filters?.patientId || null
      })

      if (error) {
        console.error('❌ Error getting admin overview:', error)
        return { data: [], error }
      }

      console.log('✅ Retrieved admin appointment overview:', data?.length || 0)
      return { data: data || [], error: null }
    } catch (error) {
      console.error('❌ Exception getting admin overview:', error)
      return { data: [], error }
    }
  }

  /**
   * Provider schedule management - Create/update schedule
   */
  async updateProviderSchedule(
    providerId: string,
    scheduleData: {
      dayOfWeek: number      // 0=Sunday, 6=Saturday
      startTime: string      // HH:MM:SS format
      endTime: string        // HH:MM:SS format
      slotDurationMinutes: number
      treatmentTypes: string[]
      active: boolean
    }
  ) {
    try {
      console.log('🔍 Updating provider schedule:', providerId)
      
      // First check if schedule exists
      const { data: existing, error: checkError } = await supabase
        .from('provider_schedules')
        .select('id')
        .eq('provider_id', providerId)
        .eq('day_of_week', scheduleData.dayOfWeek)
        .eq('start_time', scheduleData.startTime)
        .eq('end_time', scheduleData.endTime)
        .single()

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('❌ Error checking existing schedule:', checkError)
        return { success: false, error: checkError }
      }

      let data, error
      
      if (existing) {
        // Update existing schedule
        ({ data, error } = await supabase
          .from('provider_schedules')
          .update({
            slot_duration_minutes: scheduleData.slotDurationMinutes,
            treatment_types: scheduleData.treatmentTypes,
            active: scheduleData.active,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select())
      } else {
        // Create new schedule
        ({ data, error } = await supabase
          .from('provider_schedules')
          .insert({
            provider_id: providerId,
            day_of_week: scheduleData.dayOfWeek,
            start_time: scheduleData.startTime,
            end_time: scheduleData.endTime,
            slot_duration_minutes: scheduleData.slotDurationMinutes,
            treatment_types: scheduleData.treatmentTypes,
            active: scheduleData.active
          })
          .select())
      }

      if (error) {
        console.error('❌ Error updating provider schedule:', error)
        return { success: false, error }
      }

      console.log('✅ Provider schedule updated successfully')
      return { success: true, data: data?.[0] }
    } catch (error) {
      console.error('❌ Exception updating provider schedule:', error)
      return { success: false, error }
    }
  }

  /**
   * Get provider by profile ID
   */
  async getProviderByProfileId(profileId: string) {
    try {
      console.log('🔍 Getting provider by profile ID:', profileId)
      
      const { data, error } = await supabase
        .from('providers')
        .select('*')
        .eq('profile_id', profileId)
        .single()

      if (error) {
        console.error('❌ Error getting provider by profile ID:', error)
        return { data: null, error }
      }

      console.log('✅ Found provider:', data)
      return { data, error: null }
    } catch (error) {
      console.error('❌ Exception getting provider by profile ID:', error)
      return { data: null, error }
    }
  }

  /**
   * Get providers assigned to a patient
   */
  async getPatientAssignedProviders(patientProfileId: string) {
    try {
      console.log('🔍 Getting assigned providers for patient:', patientProfileId)
      
      // First get the patient ID from the profile ID
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('id')
        .eq('profile_id', patientProfileId)
        .single()

      if (patientError || !patientData) {
        console.error('❌ Patient not found:', patientError)
        return { data: [], error: patientError || { message: 'Patient not found' } }
      }

      console.log('✅ Found patient ID:', patientData.id)

      // Now get the patient assignments (simplified query to avoid profile issues)
      const { data, error } = await supabase
        .from('patient_assignments')
        .select(`
          id,
          treatment_type,
          is_primary,
          providers(
            id,
            profile_id,
            specialty,
            license_number
          )
        `)
        .eq('patient_id', patientData.id)
        .eq('active', true)

      if (error) {
        console.error('❌ Error getting assigned providers:', error)
        return { data: [], error }
      }

      console.log('🔍 Raw assignment data:', data)

      // Transform the data to match the Provider interface (without profile names for now)
      const assignedProviders = (data || []).map((assignment: any, index: number) => ({
        id: assignment.providers.id,
        name: `${assignment.providers.specialty} Provider ${index + 1}`, // Fallback name
        specialty: assignment.providers.specialty,
        profile_id: assignment.providers.profile_id,
        treatment_type: assignment.treatment_type,
        is_primary: assignment.is_primary
      }))

      console.log('✅ Retrieved assigned providers:', assignedProviders)
      return { data: assignedProviders, error: null }
    } catch (error) {
      console.error('❌ Exception getting assigned providers:', error)
      return { data: [], error }
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