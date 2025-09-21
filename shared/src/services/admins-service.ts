import { supabase } from '../config/supabase.js'

export interface AdminProfile {
  id: string
  user_id: string
  email: string
  role: 'super_admin' | 'admin' | 'support' | 'medical_reviewer'
  first_name?: string
  last_name?: string
  department?: string
  permissions: string[]
  is_active: boolean
  last_login?: string
  created_at: string
  updated_at: string
}

export interface PatientOverview {
  id: string
  email: string
  first_name: string
  last_name: string
  treatment_type: string
  eligibility_status: string
  onboarding_completed: boolean
  last_activity?: string
  created_at: string
}

export interface AdminDashboardStats {
  totalPatients: number
  pendingEligibility: number
  activePatients: number
  newSignupsToday: number
  revenueThisMonth: number
  avgOnboardingTime: number
}

export class AdminsService {
  /**
   * Create admin account
   */
  async createAdminAccount(userId: string, adminData: {
    email: string
    role: AdminProfile['role']
    firstName?: string
    lastName?: string
    department?: string
    createdBy: string
  }): Promise<{
    success: boolean
    admin?: AdminProfile
    error?: string
  }> {
    try {
      // Define default permissions based on role
      const permissions = this.getDefaultPermissions(adminData.role)

      const { data: admin, error } = await supabase
        .from('admins')
        .insert({
          user_id: userId,
          email: adminData.email,
          role: adminData.role,
          first_name: adminData.firstName,
          last_name: adminData.lastName,
          department: adminData.department,
          permissions,
          is_active: true,
          created_by: adminData.createdBy
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating admin account:', error)
        return { success: false, error: 'Failed to create admin account' }
      }

      return { success: true, admin }
    } catch (error) {
      console.error('Admin account creation error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  /**
   * Get admin profile by user ID
   */
  async getAdminProfile(userId: string): Promise<{
    success: boolean
    admin?: AdminProfile
    error?: string
  }> {
    try {
      const { data: admin, error } = await supabase
        .from('admins')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single()

      if (error) {
        console.error('Error fetching admin profile:', error)
        return { success: false, error: 'Failed to fetch admin profile' }
      }

      return { success: true, admin }
    } catch (error) {
      console.error('Admin profile fetch error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  /**
   * Get dashboard statistics for admin overview
   */
  async getDashboardStats(): Promise<{
    success: boolean
    stats?: AdminDashboardStats
    error?: string
  }> {
    try {
      // Get total patients
      const { count: totalPatients } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })

      // Get pending eligibility
      const { count: pendingEligibility } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .eq('eligibility_status', 'pending')

      // Get active patients (completed onboarding)
      const { count: activePatients } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .eq('onboarding_completed', true)

      // Get new signups today
      const today = new Date().toISOString().split('T')[0]
      const { count: newSignupsToday } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today)

      // Calculate average onboarding time (mock for now)
      const avgOnboardingTime = 2.5 // days

      // Calculate revenue this month (mock for now)
      const revenueThisMonth = (activePatients || 0) * 199 // avg treatment cost

      const stats: AdminDashboardStats = {
        totalPatients: totalPatients || 0,
        pendingEligibility: pendingEligibility || 0,
        activePatients: activePatients || 0,
        newSignupsToday: newSignupsToday || 0,
        revenueThisMonth,
        avgOnboardingTime
      }

      return { success: true, stats }
    } catch (error) {
      console.error('Dashboard stats error:', error)
      return { success: false, error: 'Failed to fetch dashboard statistics' }
    }
  }

  /**
   * Get patients list with filtering and pagination
   */
  async getPatientsList(options: {
    page?: number
    limit?: number
    status?: string
    treatmentType?: string
    search?: string
  } = {}): Promise<{
    success: boolean
    patients?: PatientOverview[]
    totalCount?: number
    error?: string
  }> {
    try {
      const { page = 1, limit = 50, status, treatmentType, search } = options
      const offset = (page - 1) * limit

      let query = supabase
        .from('patients')
        .select(`
          id,
          email,
          first_name,
          last_name,
          treatment_type,
          eligibility_status,
          onboarding_completed,
          created_at
        `, { count: 'exact' })

      // Apply filters
      if (status) {
        query = query.eq('eligibility_status', status)
      }
      if (treatmentType) {
        query = query.eq('treatment_type', treatmentType)
      }
      if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`)
      }

      // Apply pagination
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      const { data: patients, error, count } = await query

      if (error) {
        console.error('Error fetching patients list:', error)
        return { success: false, error: 'Failed to fetch patients list' }
      }

      return { 
        success: true, 
        patients: patients || [], 
        totalCount: count || 0 
      }
    } catch (error) {
      console.error('Patients list fetch error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  /**
   * Update patient eligibility status
   */
  async updatePatientEligibility(patientId: string, status: 'approved' | 'denied' | 'needs_review', notes?: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const { error } = await supabase
        .from('patients')
        .update({
          eligibility_status: status,
          eligibility_notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', patientId)

      if (error) {
        console.error('Error updating patient eligibility:', error)
        return { success: false, error: 'Failed to update patient eligibility' }
      }

      return { success: true }
    } catch (error) {
      console.error('Patient eligibility update error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  /**
   * Get admin permissions for access control
   */
  async checkPermission(userId: string, permission: string): Promise<boolean> {
    try {
      const { data: admin } = await supabase
        .from('admins')
        .select('permissions, role')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single()

      if (!admin) return false

      // Super admins have all permissions
      if (admin.role === 'super_admin') return true

      // Check specific permission
      return admin.permissions?.includes(permission) || false
    } catch (error) {
      console.error('Permission check error:', error)
      return false
    }
  }

  /**
   * Record admin login for audit trail
   */
  async recordLogin(userId: string): Promise<void> {
    try {
      await supabase
        .from('admins')
        .update({ 
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
    } catch (error) {
      console.error('Error recording admin login:', error)
    }
  }

  /**
   * Get default permissions based on role
   */
  private getDefaultPermissions(role: AdminProfile['role']): string[] {
    const permissionSets = {
      super_admin: [
        'view_all_patients',
        'edit_all_patients',
        'manage_admins',
        'view_analytics',
        'manage_billing',
        'system_settings'
      ],
      admin: [
        'view_all_patients',
        'edit_all_patients',
        'view_analytics',
        'manage_billing'
      ],
      medical_reviewer: [
        'view_all_patients',
        'review_eligibility',
        'view_medical_data'
      ],
      support: [
        'view_all_patients',
        'edit_patient_basic_info',
        'view_support_tickets'
      ]
    }

    return permissionSets[role] || []
  }
}

// Export singleton instance
export const adminsService = new AdminsService()