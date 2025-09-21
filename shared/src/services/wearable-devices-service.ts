import { supabase } from '../config/supabase.js'
import { 
  WearableDevice, 
  CreateWearableDeviceRequest, 
  DeviceType, 
  HealthMetricType 
} from '../types/database.js'
import { ApiUtils, Logger } from './api-utils.js'

Logger.setContext('WearableDevicesService')

export interface DeviceConnectionStatus {
  isConnected: boolean
  lastSync?: string
  syncErrors?: string[]
  enabledMetrics: HealthMetricType[]
}

export interface DeviceSyncResult {
  success: boolean
  deviceId: string
  metricsSynced: number
  errors: string[]
  lastSync: string
}

export class WearableDevicesService {
  /**
   * Connect a new wearable device for a patient
   */
  async connectDevice(
    patientId: string, 
    deviceRequest: CreateWearableDeviceRequest
  ): Promise<{
    success: boolean
    device?: WearableDevice
    error?: string
  }> {
    try {
      // Validate device type
      const validDeviceTypes: DeviceType[] = [
        'apple_watch', 'fitbit', 'garmin', 'samsung_health', 'google_fit', 'manual'
      ]
      
      if (!validDeviceTypes.includes(deviceRequest.device_type as DeviceType)) {
        return { 
          success: false, 
          error: `Invalid device type: ${deviceRequest.device_type}` 
        }
      }

      // Check if device already exists
      if (deviceRequest.device_identifier) {
        const { data: existing } = await supabase
          .from('wearable_devices')
          .select('id')
          .eq('patient_id', patientId)
          .eq('device_identifier', deviceRequest.device_identifier)
          .single()

        if (existing) {
          return { 
            success: false, 
            error: 'Device already connected' 
          }
        }
      }

      // Insert new device
      const { data: device, error } = await supabase
        .from('wearable_devices')
        .insert({
          patient_id: patientId,
          device_type: deviceRequest.device_type,
          device_name: deviceRequest.device_name || this.getDefaultDeviceName(deviceRequest.device_type as DeviceType),
          device_identifier: deviceRequest.device_identifier,
          is_connected: true,
          sync_frequency: deviceRequest.sync_frequency || 'realtime',
          enabled_metrics: deviceRequest.enabled_metrics || this.getDefaultMetrics(deviceRequest.device_type as DeviceType),
          connection_metadata: deviceRequest.connection_metadata || {},
          last_sync: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        Logger.error('Failed to connect device', error, { patientId, deviceRequest })
        return { 
          success: false, 
          error: ApiUtils.handleSupabaseError(error).error 
        }
      }

      Logger.info('Device connected successfully', { deviceId: device.id, patientId })
      return { success: true, device }
    } catch (error) {
      Logger.error('Device connection error', error)
      return { 
        success: false, 
        error: 'Failed to connect device' 
      }
    }
  }

  /**
   * Get all devices for a patient
   */
  async getDevices(patientId: string): Promise<{
    success: boolean
    devices?: WearableDevice[]
    error?: string
  }> {
    try {
      const { data: devices, error } = await supabase
        .from('wearable_devices')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })

      if (error) {
        Logger.error('Failed to fetch devices', error, { patientId })
        return { 
          success: false, 
          error: ApiUtils.handleSupabaseError(error).error 
        }
      }

      return { success: true, devices: devices || [] }
    } catch (error) {
      Logger.error('Device fetch error', error)
      return { 
        success: false, 
        error: 'Failed to fetch devices' 
      }
    }
  }

  /**
   * Update device connection status
   */
  async updateDeviceStatus(
    deviceId: string, 
    isConnected: boolean, 
    lastSync?: string,
    syncErrors?: string[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = {
        is_connected: isConnected,
        updated_at: new Date().toISOString()
      }

      if (lastSync) {
        updateData.last_sync = lastSync
      }

      if (syncErrors && syncErrors.length > 0) {
        updateData.connection_metadata = {
          last_sync_errors: syncErrors,
          last_error_time: new Date().toISOString()
        }
      }

      const { error } = await supabase
        .from('wearable_devices')
        .update(updateData)
        .eq('id', deviceId)

      if (error) {
        Logger.error('Failed to update device status', error, { deviceId })
        return { 
          success: false, 
          error: ApiUtils.handleSupabaseError(error).error 
        }
      }

      Logger.info('Device status updated', { deviceId, isConnected })
      return { success: true }
    } catch (error) {
      Logger.error('Device status update error', error)
      return { 
        success: false, 
        error: 'Failed to update device status' 
      }
    }
  }

  /**
   * Update device enabled metrics
   */
  async updateEnabledMetrics(
    deviceId: string, 
    enabledMetrics: HealthMetricType[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('wearable_devices')
        .update({
          enabled_metrics: enabledMetrics,
          updated_at: new Date().toISOString()
        })
        .eq('id', deviceId)

      if (error) {
        Logger.error('Failed to update enabled metrics', error, { deviceId })
        return { 
          success: false, 
          error: ApiUtils.handleSupabaseError(error).error 
        }
      }

      Logger.info('Device metrics updated', { deviceId, enabledMetrics })
      return { success: true }
    } catch (error) {
      Logger.error('Enabled metrics update error', error)
      return { 
        success: false, 
        error: 'Failed to update enabled metrics' 
      }
    }
  }

  /**
   * Disconnect a device
   */
  async disconnectDevice(deviceId: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const { error } = await supabase
        .from('wearable_devices')
        .update({
          is_connected: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', deviceId)

      if (error) {
        Logger.error('Failed to disconnect device', error, { deviceId })
        return { 
          success: false, 
          error: ApiUtils.handleSupabaseError(error).error 
        }
      }

      Logger.info('Device disconnected', { deviceId })
      return { success: true }
    } catch (error) {
      Logger.error('Device disconnect error', error)
      return { 
        success: false, 
        error: 'Failed to disconnect device' 
      }
    }
  }

  /**
   * Delete a device completely
   */
  async deleteDevice(deviceId: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const { error } = await supabase
        .from('wearable_devices')
        .delete()
        .eq('id', deviceId)

      if (error) {
        Logger.error('Failed to delete device', error, { deviceId })
        return { 
          success: false, 
          error: ApiUtils.handleSupabaseError(error).error 
        }
      }

      Logger.info('Device deleted', { deviceId })
      return { success: true }
    } catch (error) {
      Logger.error('Device delete error', error)
      return { 
        success: false, 
        error: 'Failed to delete device' 
      }
    }
  }

  /**
   * Get device connection status summary
   */
  async getConnectionStatus(patientId: string): Promise<{
    success: boolean
    status?: {
      totalDevices: number
      connectedDevices: number
      lastSync?: string
      supportedMetrics: HealthMetricType[]
    }
    error?: string
  }> {
    try {
      const { data: devices, error } = await supabase
        .from('wearable_devices')
        .select('*')
        .eq('patient_id', patientId)

      if (error) {
        Logger.error('Failed to get connection status', error, { patientId })
        return { 
          success: false, 
          error: ApiUtils.handleSupabaseError(error).error 
        }
      }

      const totalDevices = devices?.length || 0
      const connectedDevices = devices?.filter(d => d.is_connected).length || 0
      
      // Get most recent sync time
      const lastSync = devices
        ?.filter(d => d.last_sync)
        .sort((a, b) => new Date(b.last_sync).getTime() - new Date(a.last_sync).getTime())[0]?.last_sync

      // Collect all supported metrics from connected devices
      const supportedMetrics = Array.from(new Set(
        devices
          ?.filter(d => d.is_connected)
          .flatMap(d => d.enabled_metrics) || []
      )) as HealthMetricType[]

      return {
        success: true,
        status: {
          totalDevices,
          connectedDevices,
          lastSync,
          supportedMetrics
        }
      }
    } catch (error) {
      Logger.error('Connection status error', error)
      return { 
        success: false, 
        error: 'Failed to get connection status' 
      }
    }
  }

  /**
   * Get default device name for device type
   */
  private getDefaultDeviceName(deviceType: DeviceType): string {
    const nameMap: Record<DeviceType, string> = {
      'apple_watch': 'Apple Watch',
      'fitbit': 'Fitbit Device',
      'garmin': 'Garmin Device',
      'samsung_health': 'Samsung Health',
      'google_fit': 'Google Fit',
      'manual': 'Manual Entry'
    }
    return nameMap[deviceType]
  }

  /**
   * Get default metrics for device type
   */
  private getDefaultMetrics(deviceType: DeviceType): HealthMetricType[] {
    const metricsMap: Record<DeviceType, HealthMetricType[]> = {
      'apple_watch': [
        'heart_rate', 'steps', 'distance_walked', 'active_energy_burned',
        'exercise_time', 'stand_hours', 'sleep_duration'
      ],
      'fitbit': [
        'heart_rate', 'steps', 'distance_walked', 'active_energy_burned',
        'sleep_duration', 'weight'
      ],
      'garmin': [
        'heart_rate', 'steps', 'distance_walked', 'active_energy_burned',
        'vo2_max', 'sleep_duration'
      ],
      'samsung_health': [
        'heart_rate', 'steps', 'weight', 'blood_pressure_systolic',
        'blood_pressure_diastolic', 'sleep_duration'
      ],
      'google_fit': [
        'steps', 'distance_walked', 'active_energy_burned', 'heart_rate'
      ],
      'manual': [
        'weight', 'blood_pressure_systolic', 'blood_pressure_diastolic',
        'blood_glucose', 'body_temperature'
      ]
    }
    return metricsMap[deviceType] || []
  }
}

// Export singleton instance
export const wearableDevicesService = new WearableDevicesService()