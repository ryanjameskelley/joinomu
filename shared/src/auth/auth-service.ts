import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type UserRole = 'patient' | 'provider' | 'admin'

interface SignupData {
  email: string
  password: string
  firstName: string
  lastName: string
  role: UserRole
  specialty?: string
  licenseNumber?: string
  phone?: string
}

interface LoginData {
  email: string
  password: string
}

class AuthService {
  async signUp(data: SignupData) {
    try {
      console.log('🔄 Starting signup process for:', data.email, 'role:', data.role)
      
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            role: data.role,
            specialty: data.specialty,
            license_number: data.licenseNumber,
            phone: data.phone
          }
        }
      })

      if (authError) {
        console.error('❌ Auth signup error:', authError)
        throw authError
      }
      
      console.log('✅ Auth user created successfully:', authData.user?.id)

      // Note: Profile and role-specific records are now created automatically by the database trigger
      console.log('✅ Auth user created - trigger will handle profile and role record creation')

      return { data: authData, error: null }
    } catch (error: any) {
      return { data: null, error }
    }
  }

  async signIn(data: LoginData) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      })

      if (authError) throw authError

      return { data: authData, error: null }
    } catch (error: any) {
      return { data: null, error }
    }
  }

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return { error: null }
    } catch (error: any) {
      return { error }
    }
  }

  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      return { user, error: null }
    } catch (error: any) {
      return { user: null, error }
    }
  }

  async getCurrentSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      return { session, error: null }
    } catch (error: any) {
      return { session: null, error }
    }
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }

  // Get user role from auth metadata
  async getUserRole(): Promise<UserRole | null> {
    try {
      const { user } = await this.getCurrentUser()
      return user?.user_metadata?.role || null
    } catch (error) {
      return null
    }
  }

  // Get user profile data based on role (includes profile info + role-specific info)
  async getUserProfile() {
    try {
      const { user } = await this.getCurrentUser()
      if (!user) return { data: null, error: new Error('No user found') }

      const role = user.user_metadata?.role
      if (!role) return { data: null, error: new Error('No role found') }

      // Get profile data first
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) return { data: null, error: profileError }

      // Get role-specific data
      let tableName = ''
      switch (role) {
        case 'patient':
          tableName = 'patients'
          break
        case 'provider':
          tableName = 'providers'
          break
        case 'admin':
          tableName = 'admins'
          break
        default:
          return { data: null, error: new Error('Invalid role') }
      }

      const { data: roleData, error: roleError } = await supabase
        .from(tableName)
        .select('*')
        .eq('profile_id', user.id)
        .single()

      if (roleError) return { data: null, error: roleError }

      // Combine profile and role data
      const combinedData = {
        ...roleData,
        ...profileData,
        // Keep role-specific id as the primary id, profile id as profile_id
        profile_id: profileData.id,
        id: roleData.id
      }

      return { data: combinedData, error: null }
    } catch (error: any) {
      return { data: null, error }
    }
  }

  // Alias for getUserProfile - used by ProviderDashboard
  async getRoleData() {
    return this.getUserProfile()
  }

  // Patient-specific methods
  async getPatientMedicationPreferences(userId?: string) {
    try {
      const targetUserId = userId || (await this.getCurrentUser()).user?.id
      if (!targetUserId) return { data: null, error: new Error('No user ID') }

      console.log('🔍 getPatientMedicationPreferences for user profile ID:', targetUserId)

      // First get the patient table ID from the profile ID
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('id')
        .eq('profile_id', targetUserId)
        .single()

      if (patientError || !patientData) {
        console.log('❌ Patient not found for profile ID:', targetUserId, patientError)
        return { data: [], error: null }
      }

      console.log('🔍 Found patient table ID:', patientData.id)

      // Get medication preferences with full medication and dosage information
      console.log('🔍 Querying patient_medication_preferences for patient_id:', patientData.id)
      
      const { data, error } = await supabase
        .from('patient_medication_preferences')
        .select(`
          *,
          medications (
            id,
            name,
            description,
            category,
            active
          ),
          medication_dosages (
            id,
            strength,
            unit_price,
            available
          )
        `)
        .eq('patient_id', patientData.id)
        .order('created_at', { ascending: false })
      
      console.log('🔍 Query completed. Data:', data, 'Error:', error)

      if (error) {
        console.log('❌ Error fetching medication preferences:', error)
        return { data: null, error }
      }

      console.log('🔍 Raw medication preferences data:', data)

      // Transform the data to flatten the medication name for UI compatibility
      const transformedData = data?.map(preference => ({
        ...preference,
        medication_name: preference.medications?.name || 'Unknown Medication',
        // Keep the original structure as well for compatibility
        medications: preference.medications,
        // Map notes to provider_notes for UI compatibility (since UI expects providerNotes)
        provider_notes: preference.notes
      })) || []

      console.log('🔍 Transformed medication preferences with flattened names:', transformedData)

      return { data: transformedData, error: null }
    } catch (error: any) {
      console.log('❌ Exception in getPatientMedicationPreferences:', error)
      return { data: null, error }
    }
  }

  async getPatientMedicationOrders(patientId: string) {
    try {
      console.log('🔍 getPatientMedicationOrders for patient ID:', patientId)

      // Get medication orders with proper relationships through approvals
      const { data, error } = await supabase
        .from('medication_orders')
        .select(`
          *,
          medications (
            name,
            unit_price
          ),
          medication_approvals!inner (
            approved_dosage,
            patient_medication_preferences!inner (
              preferred_dosage
            )
          )
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })

      if (error) {
        console.log('❌ Error fetching medication orders:', error)
        return { data: [], error }
      }

      console.log('🔍 Raw medication orders data:', data)

      // Transform the data to match expected format
      const transformedData = data?.map((order: any) => ({
        id: order.id,
        patient_id: order.patient_id,
        medication_id: order.medication_id,
        medication_name: order.medications?.name,
        dosage: order.medication_approvals?.approved_dosage || 
               order.medication_approvals?.patient_medication_preferences?.preferred_dosage || 
               'Not specified',
        quantity: order.quantity,
        unit_price: order.unit_price,
        total_amount: order.total_amount,
        payment_status: order.payment_status,
        fulfillment_status: order.fulfillment_status,
        payment_method: order.payment_method,
        payment_date: order.payment_date,
        shipped_date: order.shipped_date,
        estimated_delivery: order.estimated_delivery,
        tracking_number: order.tracking_number,
        admin_notes: order.admin_notes,
        created_at: order.created_at,
        updated_at: order.updated_at
      })) || []

      console.log('🔍 Transformed medication orders:', transformedData)

      return { data: transformedData, error: null }
    } catch (error: any) {
      console.log('❌ Exception in getPatientMedicationOrders:', error)
      return { data: [], error }
    }
  }

  async updateMedicationOrderAdmin(orderId: string, updateData: {
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
      console.log('🔄 Updating medication order (admin):', orderId, updateData)

      const { data, error } = await supabase
        .from('medication_orders')
        .update(updateData)
        .eq('id', orderId)
        .select()
        .single()

      if (error) {
        console.error('❌ Error updating medication order:', error)
        return { success: false, error }
      }

      console.log('✅ Medication order updated successfully:', data)
      return { success: true, data, error: null }
    } catch (error: any) {
      console.error('❌ Exception updating medication order:', error)
      return { success: false, error }
    }
  }

  async getOrdersByPreferenceId(preferenceId: string) {
    try {
      console.log('🔍 getOrdersByPreferenceId for preference ID:', preferenceId)

      // Get medication orders that are linked to this preference through approvals
      const { data, error } = await supabase
        .from('medication_orders')
        .select(`
          *,
          medications (
            name,
            unit_price
          ),
          medication_approvals!inner (
            id,
            approved_dosage,
            patient_medication_preferences!inner (
              id,
              preferred_dosage
            )
          )
        `)
        .eq('medication_approvals.patient_medication_preferences.id', preferenceId)
        .order('created_at', { ascending: false })

      if (error) {
        console.log('❌ Error fetching orders by preference ID:', error)
        return { data: [], error }
      }

      console.log('🔍 Raw orders by preference data:', data)

      // Transform the data to match expected format
      const transformedData = data?.map((order: any) => ({
        id: order.id,
        patient_id: order.patient_id,
        medication_id: order.medication_id,
        medication_name: order.medications?.name,
        dosage: order.medication_approvals?.approved_dosage || 
               order.medication_approvals?.patient_medication_preferences?.preferred_dosage || 
               'Not specified',
        quantity: order.quantity,
        unit_price: order.unit_price,
        total_amount: order.total_amount,
        payment_status: order.payment_status,
        fulfillment_status: order.fulfillment_status,
        payment_method: order.payment_method,
        payment_date: order.payment_date,
        shipped_date: order.shipped_date,
        estimated_delivery: order.estimated_delivery,
        tracking_number: order.tracking_number,
        admin_notes: order.admin_notes,
        created_at: order.created_at,
        updated_at: order.updated_at
      })) || []

      console.log('🔍 Transformed orders by preference:', transformedData)

      return { data: transformedData, error: null }
    } catch (error: any) {
      console.log('❌ Exception in getOrdersByPreferenceId:', error)
      return { data: [], error }
    }
  }

  async getPatientMedicationsDetailed(patientId: string) {
    try {
      console.log('🔍 getPatientMedicationsDetailed for patient ID:', patientId)

      // Get detailed medication data from orders with full joins
      const { data, error } = await supabase
        .from('medication_orders')
        .select(`
          id as order_id,
          quantity,
          unit_price,
          total_price,
          payment_status as status,
          payment_date as last_payment_date,
          shipped_date,
          tracking_number,
          medications (
            name as medication_name
          ),
          patient_medication_preferences (
            preferred_dosage as dosage
          )
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })

      if (error) {
        console.log('❌ Error fetching detailed medications:', error)
        return []
      }

      console.log('🔍 Raw detailed medication data:', data)

      // Transform the data to match expected format
      const transformedData = data?.map((order: any) => ({
        id: order.order_id,
        name: order.medications?.medication_name || 'Unknown Medication',
        dosage: order.patient_medication_preferences?.dosage || '1mg',
        supply: `${order.quantity || 30} day supply`,
        status: order.status || 'active',
        lastPaymentDate: order.last_payment_date,
        sentToPharmacyDate: order.sent_to_pharmacy_date,
        shippedToPharmacyDate: order.shipped_date,
        trackingNumber: order.tracking_number
      })) || []

      console.log('🔍 Transformed detailed medication data:', transformedData)

      return transformedData
    } catch (error: any) {
      console.log('❌ Exception in getPatientMedicationsDetailed:', error)
      return []
    }
  }

  async getAvailableMedications() {
    try {
      const { data, error } = await supabase
        .from('medications')
        .select(`
          *,
          medication_dosages(*)
        `)
        .eq('active', true)

      if (error) {
        console.error('❌ Supabase error loading medications:', error)
        return { data: null, error }
      }

      // Filter medications that have available dosages
      const medicationsWithDosages = data?.filter(med => 
        med.medication_dosages && med.medication_dosages.length > 0
      ) || []

      console.log('✅ Loaded medications with dosages:', medicationsWithDosages)
      return { data: medicationsWithDosages, error: null }
    } catch (error: any) {
      console.error('❌ Exception loading medications:', error)
      return { data: null, error }
    }
  }

  async getMedicationDosages(medicationId: string) {
    try {
      const { data, error } = await supabase
        .from('medication_dosages')
        .select('*')
        .eq('medication_id', medicationId)
        .eq('available', true)
        .order('sort_order')

      return { data, error }
    } catch (error: any) {
      return { data: null, error }
    }
  }

  async getPatientVisits(userId?: string) {
    try {
      const targetUserId = userId || (await this.getCurrentUser()).user?.id
      if (!targetUserId) return { data: null, error: new Error('No user ID') }

      const { data, error } = await supabase
        .from('appointments')
        .select('*, providers(*)')
        .eq('patient_id', targetUserId)
        .order('appointment_date', { ascending: false })

      return { data, error }
    } catch (error: any) {
      return { data: null, error }
    }
  }

  async getPatientAppointments(userId?: string) {
    try {
      const targetUserId = userId || (await this.getCurrentUser()).user?.id
      if (!targetUserId) return { data: null, error: new Error('No user ID') }

      console.log('🔍 getPatientAppointments for user profile ID:', targetUserId)

      // First get the patient table ID from the profile ID
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('id')
        .eq('profile_id', targetUserId)
        .single()

      if (patientError || !patientData) {
        console.log('❌ Patient not found for profile ID:', targetUserId, patientError)
        return { data: [], error: null }
      }

      console.log('🔍 Found patient table ID:', patientData.id)

      // Get appointments with full provider information including profile data
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          providers!inner (
            id,
            profile_id,
            specialty,
            license_number,
            phone,
            active,
            profiles!inner (
              first_name,
              last_name,
              email
            )
          )
        `)
        .eq('patient_id', patientData.id)
        .order('appointment_date', { ascending: false })

      if (error) {
        console.log('❌ Error fetching appointments:', error)
        return { data: null, error }
      }

      console.log('🔍 Raw appointment data:', data)

      // Transform the data to include provider name
      const transformedData = data?.map(appointment => ({
        ...appointment,
        provider_name: appointment.providers?.profiles ? 
          `${appointment.providers.profiles.first_name} ${appointment.providers.profiles.last_name}` : 
          'Unknown Provider',
        provider_specialty: appointment.providers?.specialty || 'General Practice'
      })) || []

      console.log('🔍 Transformed appointment data:', transformedData)

      return { data: transformedData, error: null }
    } catch (error: any) {
      console.log('❌ Exception in getPatientAppointments:', error)
      return { data: null, error }
    }
  }

  async createMedicationPreference(preferences: { medicationId: string; dosage: string; userId?: string }) {
    try {
      const targetUserId = preferences.userId || (await this.getCurrentUser()).user?.id
      if (!targetUserId) return { success: false, error: new Error('No user ID') }

      // First, get the patient table ID from the profile ID
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('id')
        .eq('profile_id', targetUserId)
        .single()

      if (patientError || !patient) {
        return { success: false, error: new Error('Patient record not found') }
      }

      const { data, error } = await supabase
        .from('patient_medication_preferences')
        .insert({
          patient_id: patient.id, // Use the patient table ID, not the profile ID
          medication_id: preferences.medicationId,
          preferred_dosage: preferences.dosage,
          status: 'pending'
        })
        .select()
        .single()

      if (error) {
        return { success: false, error }
      }

      return { success: true, data, error: null }
    } catch (error: any) {
      return { success: false, error }
    }
  }

  async updateMedicationPreference(preferenceId: string, preferences: { 
    medicationId?: string; 
    dosage?: string; 
    status?: string; 
    frequency?: string; 
    providerNotes?: string 
  }, providerId?: string) {
    try {
      console.log('🔄 Updating medication preference:', preferenceId, preferences)
      
      // Build update object with only provided fields
      const updateData: any = {
        updated_at: new Date().toISOString()
      }
      
      if (preferences.medicationId !== undefined) {
        updateData.medication_id = preferences.medicationId
      }
      if (preferences.dosage !== undefined) {
        updateData.preferred_dosage = preferences.dosage
      }
      if (preferences.status !== undefined) {
        updateData.status = preferences.status
      }
      if (preferences.frequency !== undefined) {
        updateData.frequency = preferences.frequency
      }
      if (preferences.providerNotes !== undefined) {
        updateData.notes = preferences.providerNotes
      }
      
      console.log('🔍 Update data:', updateData)
      
      const { data, error } = await supabase
        .from('patient_medication_preferences')
        .update(updateData)
        .eq('id', preferenceId)
        .select()
        .single()

      if (error) {
        console.log('❌ Error updating medication preference:', error)
        return { success: false, error }
      }
      
      console.log('✅ Medication preference updated successfully:', data)
      
      // If status is approved and we have providerId, create approval and order records
      if (preferences.status === 'approved' && providerId && data) {
        console.log('🔄 Creating approval and order records for approved medication...')
        
        try {
          // Create medication approval record
          const approvalData = {
            preference_id: preferenceId,
            provider_id: providerId,
            status: 'approved',
            approved_dosage: preferences.dosage || data.preferred_dosage,
            approved_frequency: preferences.frequency || data.frequency,
            provider_notes: preferences.providerNotes || '',
            approval_date: new Date().toISOString()
          }
          
          console.log('🔍 Creating approval with data:', approvalData)
          
          const { data: approvalRecord, error: approvalError } = await supabase
            .from('medication_approvals')
            .insert(approvalData)
            .select()
            .single()
          
          if (approvalError) {
            console.log('❌ Error creating approval record:', approvalError)
            // Don't fail the entire operation, just log the error
          } else {
            console.log('✅ Approval record created:', approvalRecord)
            
            // Create medication order record
            // Get medication pricing and information from medications table
            console.log('🔍 Looking up medication info and pricing for medication_id:', data.medication_id)
            
            const { data: medicationInfo, error: medError } = await supabase
              .from('medications')
              .select('unit_price, name, brand_name, strength')
              .eq('id', data.medication_id)
              .single()
            
            if (medError) {
              console.log('⚠️ Error looking up medication info:', medError)
            } else {
              console.log('✅ Found medication info:', medicationInfo)
            }
            
            const unitPrice = medicationInfo?.unit_price || 100.00 // Default price if not found
            console.log('🔍 Using unit price:', unitPrice)
            const quantity = 1 // Default quantity
            const totalAmount = unitPrice * quantity
            
            const orderData = {
              approval_id: approvalRecord.id,
              patient_id: data.patient_id,
              medication_id: data.medication_id,
              quantity: quantity,
              unit_price: unitPrice,
              total_amount: totalAmount,
              payment_status: 'pending', // Admin needs to complete payment details
              fulfillment_status: 'pending' // Admin needs to process fulfillment
            }
            
            console.log('🔍 Creating order with data:', orderData)
            
            const { data: orderRecord, error: orderError } = await supabase
              .from('medication_orders')
              .insert(orderData)
              .select()
              .single()
            
            if (orderError) {
              console.log('❌ Error creating order record:', orderError)
              console.log('❌ Order data that failed:', orderData)
            } else {
              console.log('✅ Order record created successfully:', orderRecord)
            }
          }
        } catch (approvalOrderError) {
          console.log('❌ Exception creating approval/order records:', approvalOrderError)
          // Don't fail the main operation
        }
      }
      
      return { success: true, data, error: null }
    } catch (error: any) {
      console.log('❌ Exception updating medication preference:', error)
      return { success: false, error }
    }
  }

  async updatePatientMedicationPreference(preferenceId: string, preferences: { medicationId?: string; dosage?: string }) {
    try {
      const { data, error } = await supabase
        .from('patient_medication_preferences')
        .update({
          medication_id: preferences.medicationId,
          preferred_dosage: preferences.dosage,
          status: 'pending', // Reset status to pending when updated
          updated_at: new Date().toISOString()
        })
        .eq('id', preferenceId)
        .select()
        .single()

      if (error) {
        return { success: false, error }
      }

      return { success: true, data, error: null }
    } catch (error: any) {
      return { success: false, error }
    }
  }

  async getPatientAssignedProviders(userId?: string) {
    try {
      const targetUserId = userId || (await this.getCurrentUser()).user?.id
      if (!targetUserId) return { data: null, error: new Error('No user ID') }

      console.log('🔍 getPatientAssignedProviders for user:', targetUserId)

      // First get the patient ID from the profile ID
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('id')
        .eq('profile_id', targetUserId)
        .single()

      if (patientError || !patientData) {
        console.log('❌ Patient not found for profile ID:', targetUserId, patientError)
        return { data: [], error: null }
      }

      console.log('🔍 Found patient ID:', patientData.id)

      // Get providers assigned to this patient through patient_assignments
      const { data, error } = await supabase
        .from('patient_assignments')
        .select(`
          *,
          providers!inner (
            id,
            profile_id,
            specialty,
            license_number,
            phone,
            active,
            profiles!inner (
              first_name,
              last_name,
              email
            )
          )
        `)
        .eq('patient_id', patientData.id)
        .eq('active', true)
        .eq('providers.active', true)

      if (error) {
        console.log('❌ Error fetching patient assignments:', error)
        return { data: null, error }
      }

      console.log('🔍 Raw assignment data:', data)

      // Transform the data to include provider details
      const transformedData = data?.map(assignment => ({
        id: assignment.providers.id, // This is the provider table ID we need
        profile_id: assignment.providers.profile_id,
        specialty: assignment.providers.specialty,
        license_number: assignment.providers.license_number,
        phone: assignment.providers.phone,
        active: assignment.providers.active,
        first_name: assignment.providers.profiles.first_name,
        last_name: assignment.providers.profiles.last_name,
        email: assignment.providers.profiles.email,
        name: `${assignment.providers.profiles.first_name} ${assignment.providers.profiles.last_name}`,
        treatment_type: assignment.treatment_type,
        is_primary: assignment.is_primary,
        assigned_date: assignment.assigned_date
      })) || []

      console.log('🔍 Transformed provider data:', transformedData)

      return { data: transformedData, error: null }
    } catch (error: any) {
      console.log('❌ Exception in getPatientAssignedProviders:', error)
      return { data: null, error }
    }
  }

  async getProviderByProfileId(profileId: string) {
    try {
      const { data, error } = await supabase
        .from('providers')
        .select('*')
        .eq('profile_id', profileId)
        .single()

      return { data, error }
    } catch (error: any) {
      return { data: null, error }
    }
  }

  // Provider-specific methods
  async getAssignedPatients(providerProfileId: string) {
    try {
      console.log('🔍 getAssignedPatients for provider profile ID:', providerProfileId)

      // First get the provider table ID from the profile ID
      const { data: providerData, error: providerError } = await supabase
        .from('providers')
        .select('id')
        .eq('profile_id', providerProfileId)
        .single()

      if (providerError || !providerData) {
        console.log('❌ Provider not found for profile ID:', providerProfileId, providerError)
        return { data: [], error: null }
      }

      console.log('🔍 Found provider table ID:', providerData.id)

      // Get patients assigned to this provider through patient_assignments
      const { data, error } = await supabase
        .from('patient_assignments')
        .select(`
          *,
          patients!inner (
            id,
            profile_id,
            date_of_birth,
            phone,
            has_completed_intake,
            profiles!inner (
              first_name,
              last_name,
              email
            )
          )
        `)
        .eq('provider_id', providerData.id)
        .eq('active', true)

      if (error) {
        console.log('❌ Error fetching assigned patients:', error)
        return { data: null, error }
      }

      console.log('🔍 Raw assigned patients data:', data)

      // Transform the data to include patient details
      const transformedData = data?.map(assignment => ({
        // Patient assignment info
        assignment_id: assignment.id,
        provider_id: assignment.provider_id,
        patient_id: assignment.patient_id,
        treatment_type: assignment.treatment_type,
        is_primary: assignment.is_primary,
        assigned_date: assignment.assigned_date,
        
        // Patient info
        id: assignment.patients.id,
        profile_id: assignment.patients.profile_id,
        date_of_birth: assignment.patients.date_of_birth,
        phone: assignment.patients.phone,
        has_completed_intake: assignment.patients.has_completed_intake,
        
        // Profile info
        first_name: assignment.patients.profiles.first_name,
        last_name: assignment.patients.profiles.last_name,
        email: assignment.patients.profiles.email,
        
        // Additional fields for UI
        created_at: assignment.created_at
      })) || []

      console.log('🔍 Transformed assigned patients data:', transformedData)

      return { data: transformedData, error: null }
    } catch (error: any) {
      console.log('❌ Exception in getAssignedPatients:', error)
      return { data: null, error }
    }
  }

  async bookAppointment(appointmentData: {
    patientProfileId: string
    providerId: string
    appointmentDate: string
    startTime: string
    treatmentType: string
    appointmentType: string
    patientNotes?: string
  }) {
    try {
      console.log('🔍 BookAppointment called with:', {
        patientProfileId: appointmentData.patientProfileId,
        providerId: appointmentData.providerId,
        appointmentDate: appointmentData.appointmentDate,
        startTime: appointmentData.startTime,
        treatmentType: appointmentData.treatmentType
      })
      
      const { data, error } = await supabase
        .rpc('book_appointment', {
          p_patient_profile_id: appointmentData.patientProfileId,
          p_provider_id: appointmentData.providerId,
          p_appointment_date: appointmentData.appointmentDate,
          p_start_time: appointmentData.startTime,
          p_treatment_type: appointmentData.treatmentType,
          p_appointment_type: appointmentData.appointmentType,
          p_booked_by: 'patient',
          p_patient_notes: appointmentData.patientNotes
        })

      if (error) {
        return { success: false, error }
      }

      // The RPC function returns a table with success, appointment_id, message
      const result = data?.[0]
      if (result?.success) {
        return { success: true, data: result, appointmentId: result.appointment_id, error: null }
      } else {
        return { success: false, error: new Error(result?.message || 'Failed to book appointment') }
      }
    } catch (error: any) {
      return { success: false, error }
    }
  }

  async getAvailableSlots(providerId: string, startDate: string, endDate: string, treatmentType?: string) {
    try {
      console.log('🔄 Getting available slots for provider:', providerId)
      
      const { data, error } = await supabase
        .rpc('get_available_slots_for_provider', {
          p_provider_id: providerId,
          p_start_date: startDate,
          p_end_date: endDate,
          p_treatment_type: treatmentType
        })

      if (error) {
        console.error('❌ Error getting slots:', error)
        return { data: null, error }
      }

      console.log(`✅ Found ${data?.length || 0} available slots`)
      
      // If no real slots found (provider has no schedule), return mock slots for testing
      if (!data || data.length === 0) {
        console.log('⚠️ No slots from database, generating mock slots for testing')
        
        const slots = []
        const start = new Date(startDate)
        const end = new Date(endDate)
        
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          // Skip weekends for simplicity
          const dayOfWeek = d.getDay()
          if (dayOfWeek === 0 || dayOfWeek === 6) continue
          
          // Skip past dates
          if (d < new Date()) continue
          
          // Generate morning slots (9 AM - 12 PM)
          for (let hour = 9; hour < 12; hour++) {
            slots.push({
              slot_date: d.toISOString().split('T')[0],
              slot_start_time: `${hour.toString().padStart(2, '0')}:00:00`,
              slot_end_time: `${hour.toString().padStart(2, '0')}:30:00`,
              duration_minutes: 30
            })
            slots.push({
              slot_date: d.toISOString().split('T')[0],
              slot_start_time: `${hour.toString().padStart(2, '0')}:30:00`,
              slot_end_time: `${(hour + 1).toString().padStart(2, '0')}:00:00`,
              duration_minutes: 30
            })
          }
          
          // Generate afternoon slots (2 PM - 5 PM)
          for (let hour = 14; hour < 17; hour++) {
            slots.push({
              slot_date: d.toISOString().split('T')[0],
              slot_start_time: `${hour.toString().padStart(2, '0')}:00:00`,
              slot_end_time: `${hour.toString().padStart(2, '0')}:30:00`,
              duration_minutes: 30
            })
            slots.push({
              slot_date: d.toISOString().split('T')[0],
              slot_start_time: `${hour.toString().padStart(2, '0')}:30:00`,
              slot_end_time: `${(hour + 1).toString().padStart(2, '0')}:00:00`,
              duration_minutes: 30
            })
          }
        }
        
        return { data: slots.slice(0, 20), error: null } // Limit to 20 slots for testing
      }
      
      return { data, error: null }
    } catch (error: any) {
      console.error('❌ Exception getting slots:', error)
      return { data: null, error }
    }
  }

  async rescheduleAppointment(
    appointmentId: string,
    appointmentDate: string,
    startTime: string,
    rescheduledBy: string,
    rescheduledByUserId: string,
    reason: string
  ) {
    try {
      console.log('🔄 Attempting to reschedule appointment:', {
        appointmentId,
        appointmentDate,
        startTime,
        rescheduledBy,
        rescheduledByUserId,
        reason
      })

      // Use direct update approach since RPC function has parameter issues
      console.log('⚠️ Using direct update approach for reschedule')
      
      // Calculate new end time
      const [hours, minutes] = startTime.split(':').map(Number)
      const startTimeObj = new Date()
      startTimeObj.setHours(hours, minutes, 0, 0)
      const endTimeObj = new Date(startTimeObj.getTime() + 30 * 60000) // Add 30 minutes
      const endTime = `${endTimeObj.getHours().toString().padStart(2, '0')}:${endTimeObj.getMinutes().toString().padStart(2, '0')}:00`
      
      // Update the appointment directly
      const updateResult = await supabase
        .from('appointments')
        .update({
          appointment_date: appointmentDate,
          start_time: startTime,
          end_time: endTime,
          admin_notes: `Rescheduled by ${rescheduledBy}${reason ? ': ' + reason : ''}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId)
        .select()
        .single()
      
      const data = updateResult.data
      const error = updateResult.error

      if (error) {
        console.error('❌ Reschedule appointment error:', error)
        return { success: false, error }
      }

      console.log('✅ Reschedule appointment success:', data)
      return { success: true, data, error: null }
    } catch (error: any) {
      console.error('❌ Reschedule appointment exception:', error)
      return { success: false, error }
    }
  }

  async cancelAppointment(
    appointmentId: string,
    cancelledBy: string,
    cancelledByUserId: string,
    reason: string
  ) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update({
          status: 'cancelled',
          cancelled_by: cancelledBy,
          cancelled_by_user_id: cancelledByUserId,
          cancellation_reason: reason,
          cancelled_at: new Date().toISOString()
        })
        .eq('id', appointmentId)
        .select()
        .single()

      if (error) {
        return { success: false, error }
      }

      return { success: true, data, error: null }
    } catch (error: any) {
      return { success: false, error }
    }
  }

  // Admin-specific methods
  async getAllPatients() {
    try {
      console.log('🔍 Getting all patients for admin dashboard')
      
      const { data, error } = await supabase
        .from('patients')
        .select(`
          id,
          profile_id,
          date_of_birth,
          phone,
          has_completed_intake,
          created_at,
          updated_at,
          profiles!inner (
            first_name,
            last_name,
            email,
            role
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.log('❌ Error fetching all patients:', error)
        return { data: null, error }
      }

      console.log(`✅ Found ${data?.length || 0} patients`)
      
      // Transform the data to flatten profile information
      const transformedData = data?.map(patient => ({
        id: patient.id,
        profile_id: patient.profile_id,
        first_name: patient.profiles?.first_name || 'Unknown',
        last_name: patient.profiles?.last_name || 'User',
        email: patient.profiles?.email || '',
        date_of_birth: patient.date_of_birth,
        phone: patient.phone,
        has_completed_intake: patient.has_completed_intake,
        created_at: patient.created_at,
        updated_at: patient.updated_at
      })) || []

      console.log('✅ Transformed patient data:', transformedData)
      return { data: transformedData, error: null }
    } catch (error: any) {
      console.log('❌ Exception in getAllPatients:', error)
      return { data: null, error }
    }
  }

  async getAllProviders() {
    try {
      console.log('🔍 Getting all providers for admin dashboard')
      
      const { data, error } = await supabase
        .from('providers')
        .select(`
          id,
          profile_id,
          specialty,
          license_number,
          phone,
          active,
          created_at,
          updated_at,
          profiles!inner (
            first_name,
            last_name,
            email,
            role
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.log('❌ Error fetching all providers:', error)
        return { data: null, error }
      }

      console.log(`✅ Found ${data?.length || 0} providers`)
      
      // Transform the data to flatten profile information
      const transformedData = data?.map(provider => ({
        id: provider.id,
        profile_id: provider.profile_id,
        first_name: provider.profiles?.first_name || 'Unknown',
        last_name: provider.profiles?.last_name || 'User',
        email: provider.profiles?.email || '',
        specialty: provider.specialty,
        license_number: provider.license_number,
        phone: provider.phone,
        active: provider.active,
        created_at: provider.created_at,
        updated_at: provider.updated_at
      })) || []

      console.log('✅ Transformed provider data:', transformedData)
      return { data: transformedData, error: null }
    } catch (error: any) {
      console.log('❌ Exception in getAllProviders:', error)
      return { data: null, error }
    }
  }
}

export const authService = new AuthService()
export default authService