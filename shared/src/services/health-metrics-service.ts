import { supabase } from '../config/supabase.js'

export interface HealthMetricData {
  patientId: string
  metricType: 'weight' | 'heart_rate' | 'blood_pressure' | 'steps' | 'sleep' | 'blood_glucose' | 'exercise_minutes'
  value: number
  unit: string
  recordedAt: string
  syncedFrom?: 'healthkit' | 'manual' | 'device' | 'provider'
  metadata?: {
    deviceName?: string
    confidence?: number
    sessionId?: string
    [key: string]: any
  }
}

export interface HealthMetricQuery {
  patientId: string
  metricTypes?: string[]
  startDate?: string
  endDate?: string
  limit?: number
  syncedFrom?: string
}

export interface MetricSummary {
  metricType: string
  latestValue: number
  unit: string
  lastRecorded: string
  trend: 'up' | 'down' | 'stable'
  changePercent: number
  averageWeek: number
  averageMonth: number
}

export interface HealthDashboard {
  patientId: string
  lastSync?: string
  summaries: MetricSummary[]
  recentActivity: HealthMetricData[]
  goals: {
    metricType: string
    targetValue: number
    currentValue: number
    progress: number
  }[]
}

export class HealthMetricsService {
  /**
   * Sync health data from HealthKit or other sources
   */
  async syncHealthData(metrics: HealthMetricData[]): Promise<{
    success: boolean
    synced: number
    skipped: number
    errors: string[]
  }> {
    try {
      let synced = 0
      let skipped = 0
      const errors: string[] = []

      for (const metric of metrics) {
        try {
          // Check for duplicate entries (same patient, type, value, time)
          const { data: existing } = await supabase
            .from('patient_health_metrics')
            .select('id')
            .eq('patient_id', metric.patientId)
            .eq('metric_type', metric.metricType)
            .eq('recorded_at', metric.recordedAt)
            .eq('value', metric.value)
            .single()

          if (existing) {
            skipped++
            continue
          }

          // Insert new metric
          const { error } = await supabase
            .from('patient_health_metrics')
            .insert({
              patient_id: metric.patientId,
              metric_type: metric.metricType,
              value: metric.value,
              unit: metric.unit,
              recorded_at: metric.recordedAt,
              synced_from: metric.syncedFrom || 'manual',
              metadata: metric.metadata
            })

          if (error) {
            errors.push(`Failed to sync ${metric.metricType}: ${error.message}`)
          } else {
            synced++
          }
        } catch (error) {
          errors.push(`Error processing ${metric.metricType}: ${error}`)
        }
      }

      // Update last sync time for patient
      if (synced > 0 && metrics.length > 0) {
        await this.updateLastSyncTime(metrics[0].patientId)
      }

      return { success: true, synced, skipped, errors }
    } catch (error) {
      console.error('Health data sync error:', error)
      return { 
        success: false, 
        synced: 0, 
        skipped: 0, 
        errors: ['Failed to sync health data'] 
      }
    }
  }

  /**
   * Get health metrics for a patient
   */
  async getHealthMetrics(query: HealthMetricQuery): Promise<{
    success: boolean
    metrics?: HealthMetricData[]
    error?: string
  }> {
    try {
      let dbQuery = supabase
        .from('patient_health_metrics')
        .select('*')
        .eq('patient_id', query.patientId)

      // Apply filters
      if (query.metricTypes && query.metricTypes.length > 0) {
        dbQuery = dbQuery.in('metric_type', query.metricTypes)
      }
      if (query.startDate) {
        dbQuery = dbQuery.gte('recorded_at', query.startDate)
      }
      if (query.endDate) {
        dbQuery = dbQuery.lte('recorded_at', query.endDate)
      }
      if (query.syncedFrom) {
        dbQuery = dbQuery.eq('synced_from', query.syncedFrom)
      }

      // Order and limit
      dbQuery = dbQuery
        .order('recorded_at', { ascending: false })
        .limit(query.limit || 100)

      const { data: metrics, error } = await dbQuery

      if (error) {
        console.error('Error fetching health metrics:', error)
        return { success: false, error: 'Failed to fetch health metrics' }
      }

      // Transform to HealthMetricData format
      const transformedMetrics: HealthMetricData[] = (metrics || []).map(metric => ({
        patientId: metric.patient_id,
        metricType: metric.metric_type,
        value: metric.value,
        unit: metric.unit,
        recordedAt: metric.recorded_at,
        syncedFrom: metric.synced_from,
        metadata: metric.metadata
      }))

      return { success: true, metrics: transformedMetrics }
    } catch (error) {
      console.error('Health metrics fetch error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  /**
   * Get health dashboard summary for patient
   */
  async getHealthDashboard(patientId: string): Promise<{
    success: boolean
    dashboard?: HealthDashboard
    error?: string
  }> {
    try {
      // Get recent metrics for summaries
      const metricTypes = ['weight', 'heart_rate', 'steps', 'blood_pressure', 'sleep']
      const summaries: MetricSummary[] = []

      for (const metricType of metricTypes) {
        const summary = await this.getMetricSummary(patientId, metricType)
        if (summary) {
          summaries.push(summary)
        }
      }

      // Get recent activity (last 7 days)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)

      const { metrics: recentActivity } = await this.getHealthMetrics({
        patientId,
        startDate: weekAgo.toISOString(),
        limit: 50
      })

      // Get last sync time
      const { data: lastSyncData } = await supabase
        .from('patients')
        .select('last_health_sync')
        .eq('id', patientId)
        .single()

      // Mock goals for now (could be stored in database)
      const goals = [
        {
          metricType: 'weight',
          targetValue: 180,
          currentValue: summaries.find(s => s.metricType === 'weight')?.latestValue || 0,
          progress: 0.75
        },
        {
          metricType: 'steps',
          targetValue: 10000,
          currentValue: summaries.find(s => s.metricType === 'steps')?.latestValue || 0,
          progress: 0.6
        }
      ]

      const dashboard: HealthDashboard = {
        patientId,
        lastSync: lastSyncData?.last_health_sync,
        summaries,
        recentActivity: recentActivity || [],
        goals
      }

      return { success: true, dashboard }
    } catch (error) {
      console.error('Health dashboard error:', error)
      return { success: false, error: 'Failed to load health dashboard' }
    }
  }

  /**
   * Add manual health metric entry
   */
  async addManualEntry(metric: HealthMetricData): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const { error } = await supabase
        .from('patient_health_metrics')
        .insert({
          patient_id: metric.patientId,
          metric_type: metric.metricType,
          value: metric.value,
          unit: metric.unit,
          recorded_at: metric.recordedAt,
          synced_from: 'manual',
          metadata: metric.metadata
        })

      if (error) {
        console.error('Error adding manual entry:', error)
        return { success: false, error: 'Failed to add health metric' }
      }

      return { success: true }
    } catch (error) {
      console.error('Manual entry error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  /**
   * Get metric summary with trends
   */
  private async getMetricSummary(patientId: string, metricType: string): Promise<MetricSummary | null> {
    try {
      // Get latest value
      const { data: latest } = await supabase
        .from('patient_health_metrics')
        .select('value, unit, recorded_at')
        .eq('patient_id', patientId)
        .eq('metric_type', metricType)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single()

      if (!latest) return null

      // Get previous week average
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)

      const { data: weekData } = await supabase
        .from('patient_health_metrics')
        .select('value')
        .eq('patient_id', patientId)
        .eq('metric_type', metricType)
        .gte('recorded_at', weekAgo.toISOString())

      // Get previous month average
      const monthAgo = new Date()
      monthAgo.setDate(monthAgo.getDate() - 30)

      const { data: monthData } = await supabase
        .from('patient_health_metrics')
        .select('value')
        .eq('patient_id', patientId)
        .eq('metric_type', metricType)
        .gte('recorded_at', monthAgo.toISOString())

      const weekValues = weekData?.map(d => d.value) || []
      const monthValues = monthData?.map(d => d.value) || []

      const averageWeek = weekValues.length > 0 
        ? weekValues.reduce((sum, val) => sum + val, 0) / weekValues.length 
        : latest.value

      const averageMonth = monthValues.length > 0 
        ? monthValues.reduce((sum, val) => sum + val, 0) / monthValues.length 
        : latest.value

      // Calculate trend
      const changePercent = averageWeek > 0 
        ? ((latest.value - averageWeek) / averageWeek) * 100 
        : 0

      const trend: 'up' | 'down' | 'stable' = 
        Math.abs(changePercent) < 5 ? 'stable' :
        changePercent > 0 ? 'up' : 'down'

      return {
        metricType,
        latestValue: latest.value,
        unit: latest.unit,
        lastRecorded: latest.recorded_at,
        trend,
        changePercent: Math.round(changePercent * 10) / 10,
        averageWeek: Math.round(averageWeek * 10) / 10,
        averageMonth: Math.round(averageMonth * 10) / 10
      }
    } catch (error) {
      console.error(`Error getting summary for ${metricType}:`, error)
      return null
    }
  }

  /**
   * Update last sync time for patient
   */
  private async updateLastSyncTime(patientId: string): Promise<void> {
    try {
      await supabase
        .from('patients')
        .update({ last_health_sync: new Date().toISOString() })
        .eq('id', patientId)
    } catch (error) {
      console.error('Error updating last sync time:', error)
    }
  }
}

// Export singleton instance
export const healthMetricsService = new HealthMetricsService()