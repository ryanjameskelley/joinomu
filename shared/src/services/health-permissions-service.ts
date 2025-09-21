import { supabase } from '../config/supabase.js'
import { 
  HealthDataPermission, 
  GrantHealthPermissionRequest,
  HealthMetricType 
} from '../types/database.js'
import { ApiUtils, Logger } from './api-utils.js'

Logger.setContext('HealthPermissionsService')

export interface PermissionSummary {
  patientId: string
  totalProviders: number
  totalAdmins: number
  activePermissions: number
  expiringPermissions: number
  recentGrants: HealthDataPermission[]
}

export interface AccessAuditLog {
  id: string
  patientId: string
  accessorId: string
  accessorType: 'provider' | 'admin'
  accessorName: string
  action: 'view' | 'edit' | 'export'
  metricTypes: string[]
  timestamp: string
  ipAddress?: string
}

export class HealthPermissionsService {
  /**
   * Grant health data permission to a provider or admin
   */
  async grantPermission(
    patientId: string,
    permissionRequest: GrantHealthPermissionRequest,
    grantedBy: string
  ): Promise<{
    success: boolean
    permission?: HealthDataPermission
    error?: string
  }> {
    try {
      // Validate that either provider_id or admin_id is provided, not both
      if (!permissionRequest.provider_id && !permissionRequest.admin_id) {
        return {
          success: false,
          error: 'Either provider_id or admin_id must be specified'
        }
      }

      if (permissionRequest.provider_id && permissionRequest.admin_id) {
        return {
          success: false,
          error: 'Cannot grant permission to both provider and admin simultaneously'
        }
      }

      // Validate permission type
      const validPermissionTypes = ['view', 'edit', 'export']
      if (!validPermissionTypes.includes(permissionRequest.permission_type)) {
        return {
          success: false,
          error: `Invalid permission type: ${permissionRequest.permission_type}`
        }
      }

      // Check if permission already exists
      let existingQuery = supabase
        .from('health_data_permissions')
        .select('id')
        .eq('patient_id', patientId)
        .eq('permission_type', permissionRequest.permission_type)
        .eq('is_active', true)

      if (permissionRequest.provider_id) {
        existingQuery = existingQuery.eq('provider_id', permissionRequest.provider_id)
      }
      if (permissionRequest.admin_id) {
        existingQuery = existingQuery.eq('admin_id', permissionRequest.admin_id)
      }

      const { data: existing } = await existingQuery.single()

      if (existing) {
        return {
          success: false,
          error: 'Permission already exists'
        }
      }

      // Validate expiration date if provided
      if (permissionRequest.expires_at) {
        const expiresAt = new Date(permissionRequest.expires_at)
        if (expiresAt <= new Date()) {
          return {
            success: false,
            error: 'Expiration date must be in the future'
          }
        }
      }

      // Insert new permission
      const { data: permission, error } = await supabase
        .from('health_data_permissions')
        .insert({
          patient_id: patientId,
          provider_id: permissionRequest.provider_id,
          admin_id: permissionRequest.admin_id,
          permission_type: permissionRequest.permission_type,
          metric_types: permissionRequest.metric_types,
          expires_at: permissionRequest.expires_at,
          granted_by: grantedBy,
          is_active: true
        })
        .select()
        .single()

      if (error) {
        Logger.error('Failed to grant permission', error, { patientId, permissionRequest })
        return {
          success: false,
          error: ApiUtils.handleSupabaseError(error).error
        }
      }

      Logger.info('Permission granted successfully', { 
        permissionId: permission.id, 
        patientId,
        providerId: permissionRequest.provider_id,
        adminId: permissionRequest.admin_id 
      })
      
      return { success: true, permission }
    } catch (error) {
      Logger.error('Permission grant error', error)
      return {
        success: false,
        error: 'Failed to grant permission'
      }
    }
  }

  /**
   * Revoke a health data permission
   */
  async revokePermission(permissionId: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const { error } = await supabase
        .from('health_data_permissions')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', permissionId)

      if (error) {
        Logger.error('Failed to revoke permission', error, { permissionId })
        return {
          success: false,
          error: ApiUtils.handleSupabaseError(error).error
        }
      }

      Logger.info('Permission revoked', { permissionId })
      return { success: true }
    } catch (error) {
      Logger.error('Permission revoke error', error)
      return {
        success: false,
        error: 'Failed to revoke permission'
      }
    }
  }

  /**
   * Get all permissions for a patient
   */
  async getPatientPermissions(patientId: string): Promise<{
    success: boolean
    permissions?: HealthDataPermission[]
    error?: string
  }> {
    try {
      const { data: permissions, error } = await supabase
        .from('health_data_permissions')
        .select(`
          *,
          providers:provider_id(id, first_name, last_name, email),
          admins:admin_id(id, first_name, last_name, email)
        `)
        .eq('patient_id', patientId)
        .order('granted_at', { ascending: false })

      if (error) {
        Logger.error('Failed to fetch patient permissions', error, { patientId })
        return {
          success: false,
          error: ApiUtils.handleSupabaseError(error).error
        }
      }

      return { success: true, permissions: permissions || [] }
    } catch (error) {
      Logger.error('Patient permissions fetch error', error)
      return {
        success: false,
        error: 'Failed to fetch permissions'
      }
    }
  }

  /**
   * Get permissions for a provider
   */
  async getProviderPermissions(providerId: string): Promise<{
    success: boolean
    permissions?: HealthDataPermission[]
    error?: string
  }> {
    try {
      const { data: permissions, error } = await supabase
        .from('health_data_permissions')
        .select(`
          *,
          patients:patient_id(id, first_name, last_name, email)
        `)
        .eq('provider_id', providerId)
        .eq('is_active', true)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .order('granted_at', { ascending: false })

      if (error) {
        Logger.error('Failed to fetch provider permissions', error, { providerId })
        return {
          success: false,
          error: ApiUtils.handleSupabaseError(error).error
        }
      }

      return { success: true, permissions: permissions || [] }
    } catch (error) {
      Logger.error('Provider permissions fetch error', error)
      return {
        success: false,
        error: 'Failed to fetch permissions'
      }
    }
  }

  /**
   * Check if user has permission to access specific health data
   */
  async checkPermission(
    patientId: string,
    userId: string,
    userType: 'provider' | 'admin',
    action: 'view' | 'edit' | 'export',
    metricTypes?: HealthMetricType[]
  ): Promise<{
    hasPermission: boolean
    permissionId?: string
    error?: string
  }> {
    try {
      let query = supabase
        .from('health_data_permissions')
        .select('id, metric_types')
        .eq('patient_id', patientId)
        .eq('permission_type', action)
        .eq('is_active', true)

      if (userType === 'provider') {
        query = query.eq('provider_id', userId)
      } else {
        query = query.eq('admin_id', userId)
      }

      // Check expiration
      query = query.or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)

      const { data: permissions, error } = await query

      if (error) {
        Logger.error('Permission check error', error, { patientId, userId, userType })
        return { hasPermission: false, error: 'Failed to check permission' }
      }

      if (!permissions || permissions.length === 0) {
        return { hasPermission: false }
      }

      // If specific metric types are requested, check if they're allowed
      if (metricTypes && metricTypes.length > 0) {
        for (const permission of permissions) {
          // If permission.metric_types is null, it means access to all metrics
          if (!permission.metric_types || permission.metric_types.length === 0) {
            return { hasPermission: true, permissionId: permission.id }
          }

          // Check if all requested metric types are in the allowed list
          const allowedMetrics = permission.metric_types
          const hasAllMetrics = metricTypes.every(metric => allowedMetrics.includes(metric))
          
          if (hasAllMetrics) {
            return { hasPermission: true, permissionId: permission.id }
          }
        }
        
        return { hasPermission: false }
      }

      // If no specific metrics requested, any permission is sufficient
      return { hasPermission: true, permissionId: permissions[0].id }
    } catch (error) {
      Logger.error('Permission check error', error)
      return { hasPermission: false, error: 'Failed to check permission' }
    }
  }

  /**
   * Get permission summary for a patient
   */
  async getPermissionSummary(patientId: string): Promise<{
    success: boolean
    summary?: PermissionSummary
    error?: string
  }> {
    try {
      const { data: permissions, error } = await supabase
        .from('health_data_permissions')
        .select('*')
        .eq('patient_id', patientId)

      if (error) {
        return {
          success: false,
          error: ApiUtils.handleSupabaseError(error).error
        }
      }

      const activePermissions = permissions?.filter(p => 
        p.is_active && (!p.expires_at || new Date(p.expires_at) > new Date())
      ) || []

      const expiringPermissions = permissions?.filter(p => 
        p.is_active && p.expires_at && 
        new Date(p.expires_at) > new Date() &&
        new Date(p.expires_at) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      ) || []

      const recentGrants = permissions
        ?.filter(p => new Date(p.granted_at) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) // 7 days
        .slice(0, 5) || []

      const totalProviders = new Set(
        activePermissions.filter(p => p.provider_id).map(p => p.provider_id)
      ).size

      const totalAdmins = new Set(
        activePermissions.filter(p => p.admin_id).map(p => p.admin_id)
      ).size

      const summary: PermissionSummary = {
        patientId,
        totalProviders,
        totalAdmins,
        activePermissions: activePermissions.length,
        expiringPermissions: expiringPermissions.length,
        recentGrants
      }

      return { success: true, summary }
    } catch (error) {
      Logger.error('Permission summary error', error)
      return {
        success: false,
        error: 'Failed to get permission summary'
      }
    }
  }

  /**
   * Update permission expiration
   */
  async updateExpiration(
    permissionId: string,
    newExpiresAt?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('health_data_permissions')
        .update({
          expires_at: newExpiresAt,
          updated_at: new Date().toISOString()
        })
        .eq('id', permissionId)

      if (error) {
        Logger.error('Failed to update permission expiration', error, { permissionId })
        return {
          success: false,
          error: ApiUtils.handleSupabaseError(error).error
        }
      }

      Logger.info('Permission expiration updated', { permissionId, newExpiresAt })
      return { success: true }
    } catch (error) {
      Logger.error('Permission expiration update error', error)
      return {
        success: false,
        error: 'Failed to update permission expiration'
      }
    }
  }

  /**
   * Clean up expired permissions
   */
  async cleanupExpiredPermissions(): Promise<{
    success: boolean
    cleaned: number
    error?: string
  }> {
    try {
      const { data: expiredPermissions, error: fetchError } = await supabase
        .from('health_data_permissions')
        .select('id')
        .eq('is_active', true)
        .lt('expires_at', new Date().toISOString())

      if (fetchError) {
        return {
          success: false,
          cleaned: 0,
          error: ApiUtils.handleSupabaseError(fetchError).error
        }
      }

      if (!expiredPermissions || expiredPermissions.length === 0) {
        return { success: true, cleaned: 0 }
      }

      const { error: updateError } = await supabase
        .from('health_data_permissions')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .in('id', expiredPermissions.map(p => p.id))

      if (updateError) {
        return {
          success: false,
          cleaned: 0,
          error: ApiUtils.handleSupabaseError(updateError).error
        }
      }

      Logger.info('Expired permissions cleaned up', { count: expiredPermissions.length })
      return { success: true, cleaned: expiredPermissions.length }
    } catch (error) {
      Logger.error('Permission cleanup error', error)
      return {
        success: false,
        cleaned: 0,
        error: 'Failed to cleanup expired permissions'
      }
    }
  }
}

// Export singleton instance
export const healthPermissionsService = new HealthPermissionsService()