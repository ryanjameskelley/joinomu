import { supabase } from '../config/supabase.js'
import { createClient } from '@supabase/supabase-js'

// Create a service role client for admin operations
const serviceSupabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
)

export interface HealthMetricData {
  patientId: string
  metricType: 'weight' | 'heart_rate' | 'blood_pressure' | 'steps' | 'sleep' | 'blood_glucose' | 'exercise_minutes' | 'calories' | 'protein' | 'sugar' | 'water'
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
    console.log('🔍 HealthMetricsService: Starting getHealthMetrics with query:', query)
    try {
      console.log('🔍 HealthMetricsService: Building database query using SERVICE ROLE...')
      let dbQuery = serviceSupabase
        .from('patient_health_metrics')
        .select('*')
        .eq('patient_id', query.patientId)
      
      console.log('🔍 HealthMetricsService: Base query created for patient_id:', query.patientId)

      // Apply filters
      if (query.metricTypes && query.metricTypes.length > 0) {
        console.log('🔍 HealthMetricsService: Filtering by metric types:', query.metricTypes)
        dbQuery = dbQuery.in('metric_type', query.metricTypes)
      }
      if (query.startDate) {
        console.log('🔍 HealthMetricsService: Filtering by start date:', query.startDate)
        dbQuery = dbQuery.gte('recorded_at', query.startDate)
      }
      if (query.endDate) {
        console.log('🔍 HealthMetricsService: Filtering by end date:', query.endDate)
        dbQuery = dbQuery.lte('recorded_at', query.endDate)
      }
      if (query.syncedFrom) {
        console.log('🔍 HealthMetricsService: Filtering by synced_from:', query.syncedFrom)
        dbQuery = dbQuery.eq('synced_from', query.syncedFrom)
      }

      // Order and limit
      const limit = query.limit || 100
      console.log('🔍 HealthMetricsService: Applying order and limit:', limit)
      dbQuery = dbQuery
        .order('recorded_at', { ascending: false })
        .limit(limit)

      console.log('🔍 HealthMetricsService: About to execute database query...')
      const { data: metrics, error } = await dbQuery
      console.log('🔍 HealthMetricsService: Database query completed. Error:', error, 'Records found:', metrics?.length || 0)

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
   * Add manual health metric entry (upsert to prevent duplicates) using direct fetch API
   */
  async addManualEntry(metric: HealthMetricData): Promise<{
    success: boolean
    error?: string
  }> {
    console.log('🔍 HealthMetricsService: Adding manual entry with direct fetch API:', metric)
    try {
      // Get the date part only (YYYY-MM-DD) for duplicate checking
      const recordedDate = metric.recordedAt.split('T')[0]
      const startOfDay = `${recordedDate}T00:00:00.000Z`
      const endOfDay = `${recordedDate}T23:59:59.999Z`

      console.log('🔍 HealthMetricsService: Checking for existing entry on date:', recordedDate)

      // Check for existing entry using direct fetch API
      const checkParams = new URLSearchParams({
        'patient_id': `eq.${metric.patientId}`,
        'metric_type': `eq.${metric.metricType}`,
        'recorded_at': `gte.${startOfDay}`,
        'select': 'id'
      })
      checkParams.append('recorded_at', `lte.${endOfDay}`)

      const checkUrl = `http://127.0.0.1:54321/rest/v1/patient_health_metrics?${checkParams.toString()}`
      console.log('🔍 HealthMetricsService: Check existing URL:', checkUrl)

      const checkResponse = await fetch(checkUrl, {
        method: 'GET',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
          'Content-Type': 'application/json'
        }
      })

      console.log('🔍 HealthMetricsService: Check response status:', checkResponse.status)

      if (!checkResponse.ok) {
        console.error('❌ HealthMetricsService: Check existing failed:', checkResponse.status)
        return { success: false, error: `Failed to check existing entries: ${checkResponse.status}` }
      }

      const existing = await checkResponse.json()
      console.log('🔍 HealthMetricsService: Existing entries found:', existing?.length || 0)

      if (existing && existing.length > 0) {
        // Update existing entry using direct fetch API
        console.log('🔍 HealthMetricsService: Updating existing entry:', existing[0].id)
        
        const updateData = {
          value: metric.value,
          unit: metric.unit,
          recorded_at: metric.recordedAt,
          synced_from: 'manual',
          metadata: metric.metadata,
          updated_at: new Date().toISOString()
        }

        const updateResponse = await fetch(`http://127.0.0.1:54321/rest/v1/patient_health_metrics?id=eq.${existing[0].id}`, {
          method: 'PATCH',
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateData)
        })

        console.log('🔍 HealthMetricsService: Update response status:', updateResponse.status)

        if (!updateResponse.ok) {
          const errorText = await updateResponse.text()
          console.error('❌ HealthMetricsService: Update failed:', errorText)
          return { success: false, error: `Failed to update health metric: ${updateResponse.status}` }
        }

        console.log('✅ HealthMetricsService: Successfully updated existing entry')
      } else {
        // Insert new entry using direct fetch API
        console.log('🔍 HealthMetricsService: Inserting new entry')
        
        const insertData = {
          patient_id: metric.patientId,
          metric_type: metric.metricType,
          value: metric.value,
          unit: metric.unit,
          recorded_at: metric.recordedAt,
          synced_from: 'manual',
          metadata: metric.metadata
        }

        const insertResponse = await fetch('http://127.0.0.1:54321/rest/v1/patient_health_metrics', {
          method: 'POST',
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(insertData)
        })

        console.log('🔍 HealthMetricsService: Insert response status:', insertResponse.status)

        if (!insertResponse.ok) {
          const errorText = await insertResponse.text()
          console.error('❌ HealthMetricsService: Insert failed:', errorText)
          return { success: false, error: `Failed to add health metric: ${insertResponse.status}` }
        }

        console.log('✅ HealthMetricsService: Successfully inserted new entry')
      }

      return { success: true }
    } catch (error) {
      console.error('❌ HealthMetricsService: Manual entry error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  /**
   * Add multiple health metrics in a batch operation
   */
  async addBatchEntries(metrics: HealthMetricData[]): Promise<{
    success: boolean
    saved: number
    errors: string[]
  }> {
    try {
      let saved = 0
      const errors: string[] = []

      for (const metric of metrics) {
        try {
          const result = await this.addManualEntry(metric)
          if (result.success) {
            saved++
          } else {
            errors.push(`Failed to save ${metric.metricType}: ${result.error}`)
          }
        } catch (error) {
          errors.push(`Error saving ${metric.metricType}: ${error}`)
        }
      }

      return { 
        success: saved > 0, 
        saved, 
        errors 
      }
    } catch (error) {
      console.error('Batch entry error:', error)
      return { 
        success: false, 
        saved: 0, 
        errors: ['Failed to process batch metrics'] 
      }
    }
  }

  /**
   * Check which metrics have been entered for a specific date
   */
  async getMetricsForDate(patientId: string, date: string): Promise<{
    success: boolean
    metrics?: Record<string, HealthMetricData>
    error?: string
  }> {
    try {
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)

      const { data: metrics, error } = await supabase
        .from('patient_health_metrics')
        .select('*')
        .eq('patient_id', patientId)
        .gte('recorded_at', startOfDay.toISOString())
        .lte('recorded_at', endOfDay.toISOString())

      if (error) {
        console.error('Error fetching metrics for date:', error)
        return { success: false, error: 'Failed to fetch metrics for date' }
      }

      // Convert to record format keyed by metric type
      const metricsRecord: Record<string, HealthMetricData> = {}
      ;(metrics || []).forEach(metric => {
        metricsRecord[metric.metric_type] = {
          patientId: metric.patient_id,
          metricType: metric.metric_type,
          value: metric.value,
          unit: metric.unit,
          recordedAt: metric.recorded_at,
          syncedFrom: metric.synced_from,
          metadata: metric.metadata
        }
      })

      return { success: true, metrics: metricsRecord }
    } catch (error) {
      console.error('Metrics for date error:', error)
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