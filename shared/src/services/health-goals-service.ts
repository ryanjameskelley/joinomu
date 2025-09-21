import { supabase } from '../config/supabase.js'
import { 
  HealthGoal, 
  CreateHealthGoalRequest, 
  GoalType,
  HealthMetricType 
} from '../types/database.js'
import { ApiUtils, Logger } from './api-utils.js'
import { healthMetricsService } from './health-metrics-service.js'

Logger.setContext('HealthGoalsService')

export interface GoalProgress {
  goalId: string
  progress: number // 0-1 (percentage complete)
  currentValue: number
  targetValue: number
  remainingDays: number
  onTrack: boolean
  projectedCompletion?: string
}

export interface GoalInsight {
  goalId: string
  type: 'success' | 'warning' | 'info' | 'achievement'
  title: string
  message: string
  actionable?: string
}

export class HealthGoalsService {
  /**
   * Create a new health goal for a patient
   */
  async createGoal(
    patientId: string,
    goalRequest: CreateHealthGoalRequest,
    createdBy?: string
  ): Promise<{
    success: boolean
    goal?: HealthGoal
    error?: string
  }> {
    try {
      // Validate goal type
      const validGoalTypes: GoalType[] = [
        'weight_loss', 'weight_gain', 'steps_daily', 'exercise_minutes',
        'sleep_duration', 'water_intake', 'medication_adherence',
        'blood_pressure_control', 'blood_glucose_control', 'custom'
      ]

      if (!validGoalTypes.includes(goalRequest.goal_type as GoalType)) {
        return {
          success: false,
          error: `Invalid goal type: ${goalRequest.goal_type}`
        }
      }

      // Validate dates
      const startDate = new Date(goalRequest.start_date)
      const targetDate = new Date(goalRequest.target_date)
      
      if (targetDate <= startDate) {
        return {
          success: false,
          error: 'Target date must be after start date'
        }
      }

      // Check for existing active goal of same type
      const { data: existingGoal } = await supabase
        .from('health_goals')
        .select('id')
        .eq('patient_id', patientId)
        .eq('goal_type', goalRequest.goal_type)
        .eq('status', 'active')
        .single()

      if (existingGoal) {
        return {
          success: false,
          error: `An active ${goalRequest.goal_type} goal already exists`
        }
      }

      // Get current value based on goal type
      const currentValue = await this.getCurrentValue(patientId, goalRequest.goal_type as GoalType)

      // Insert new goal
      const { data: goal, error } = await supabase
        .from('health_goals')
        .insert({
          patient_id: patientId,
          goal_type: goalRequest.goal_type,
          target_value: goalRequest.target_value,
          target_unit: goalRequest.target_unit,
          current_value: currentValue,
          start_date: goalRequest.start_date,
          target_date: goalRequest.target_date,
          status: 'active',
          notes: goalRequest.notes,
          created_by: createdBy
        })
        .select()
        .single()

      if (error) {
        Logger.error('Failed to create goal', error, { patientId, goalRequest })
        return {
          success: false,
          error: ApiUtils.handleSupabaseError(error).error
        }
      }

      Logger.info('Goal created successfully', { goalId: goal.id, patientId })
      return { success: true, goal }
    } catch (error) {
      Logger.error('Goal creation error', error)
      return {
        success: false,
        error: 'Failed to create goal'
      }
    }
  }

  /**
   * Get all goals for a patient
   */
  async getGoals(
    patientId: string,
    status?: 'active' | 'completed' | 'paused' | 'cancelled'
  ): Promise<{
    success: boolean
    goals?: HealthGoal[]
    error?: string
  }> {
    try {
      let query = supabase
        .from('health_goals')
        .select('*')
        .eq('patient_id', patientId)

      if (status) {
        query = query.eq('status', status)
      }

      const { data: goals, error } = await query
        .order('created_at', { ascending: false })

      if (error) {
        Logger.error('Failed to fetch goals', error, { patientId })
        return {
          success: false,
          error: ApiUtils.handleSupabaseError(error).error
        }
      }

      return { success: true, goals: goals || [] }
    } catch (error) {
      Logger.error('Goals fetch error', error)
      return {
        success: false,
        error: 'Failed to fetch goals'
      }
    }
  }

  /**
   * Update goal progress
   */
  async updateGoalProgress(goalId: string): Promise<{
    success: boolean
    progress?: GoalProgress
    error?: string
  }> {
    try {
      // Get goal details
      const { data: goal, error: goalError } = await supabase
        .from('health_goals')
        .select('*')
        .eq('id', goalId)
        .single()

      if (goalError || !goal) {
        return {
          success: false,
          error: 'Goal not found'
        }
      }

      // Get current value
      const currentValue = await this.getCurrentValue(goal.patient_id, goal.goal_type as GoalType)

      // Calculate progress
      const progress = this.calculateProgress(
        goal.current_value,
        currentValue,
        goal.target_value,
        goal.goal_type as GoalType
      )

      // Update current value in database
      const { error: updateError } = await supabase
        .from('health_goals')
        .update({
          current_value: currentValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', goalId)

      if (updateError) {
        Logger.error('Failed to update goal progress', updateError, { goalId })
        return {
          success: false,
          error: 'Failed to update progress'
        }
      }

      // Calculate remaining days
      const targetDate = new Date(goal.target_date)
      const today = new Date()
      const remainingDays = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      // Determine if on track
      const totalDays = Math.ceil((targetDate.getTime() - new Date(goal.start_date).getTime()) / (1000 * 60 * 60 * 24))
      const elapsedDays = totalDays - remainingDays
      const expectedProgress = elapsedDays / totalDays
      const onTrack = progress >= expectedProgress * 0.8 // 80% of expected progress

      const goalProgress: GoalProgress = {
        goalId,
        progress,
        currentValue,
        targetValue: goal.target_value,
        remainingDays: Math.max(0, remainingDays),
        onTrack
      }

      // Check if goal is completed
      if (progress >= 1.0 && goal.status === 'active') {
        await this.completeGoal(goalId)
      }

      Logger.info('Goal progress updated', { goalId, progress })
      return { success: true, progress: goalProgress }
    } catch (error) {
      Logger.error('Goal progress update error', error)
      return {
        success: false,
        error: 'Failed to update goal progress'
      }
    }
  }

  /**
   * Update goal status
   */
  async updateGoalStatus(
    goalId: string,
    status: 'active' | 'completed' | 'paused' | 'cancelled'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('health_goals')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', goalId)

      if (error) {
        Logger.error('Failed to update goal status', error, { goalId })
        return {
          success: false,
          error: ApiUtils.handleSupabaseError(error).error
        }
      }

      Logger.info('Goal status updated', { goalId, status })
      return { success: true }
    } catch (error) {
      Logger.error('Goal status update error', error)
      return {
        success: false,
        error: 'Failed to update goal status'
      }
    }
  }

  /**
   * Get goal insights for a patient
   */
  async getGoalInsights(patientId: string): Promise<{
    success: boolean
    insights?: GoalInsight[]
    error?: string
  }> {
    try {
      const { data: goals } = await supabase
        .from('health_goals')
        .select('*')
        .eq('patient_id', patientId)
        .eq('status', 'active')

      if (!goals) {
        return { success: true, insights: [] }
      }

      const insights: GoalInsight[] = []

      for (const goal of goals) {
        const progressResult = await this.updateGoalProgress(goal.id)
        if (progressResult.success && progressResult.progress) {
          const progress = progressResult.progress
          
          if (progress.progress >= 1.0) {
            insights.push({
              goalId: goal.id,
              type: 'achievement',
              title: 'Goal Achieved! 🎉',
              message: `You've reached your ${goal.goal_type} goal!`,
              actionable: 'Set a new challenging goal to continue your progress'
            })
          } else if (progress.progress >= 0.8) {
            insights.push({
              goalId: goal.id,
              type: 'success',
              title: 'Almost There!',
              message: `You're ${Math.round(progress.progress * 100)}% complete with your ${goal.goal_type} goal`,
              actionable: 'Keep up the great work!'
            })
          } else if (!progress.onTrack && progress.remainingDays > 0) {
            insights.push({
              goalId: goal.id,
              type: 'warning',
              title: 'Goal Needs Attention',
              message: `Your ${goal.goal_type} goal is behind schedule`,
              actionable: `Increase your daily target to get back on track`
            })
          } else if (progress.remainingDays <= 7) {
            insights.push({
              goalId: goal.id,
              type: 'info',
              title: 'Goal Deadline Approaching',
              message: `${progress.remainingDays} days left to reach your ${goal.goal_type} goal`,
              actionable: 'Push harder in these final days!'
            })
          }
        }
      }

      return { success: true, insights }
    } catch (error) {
      Logger.error('Goal insights error', error)
      return {
        success: false,
        error: 'Failed to get goal insights'
      }
    }
  }

  /**
   * Complete a goal
   */
  private async completeGoal(goalId: string): Promise<void> {
    try {
      await supabase
        .from('health_goals')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', goalId)

      Logger.info('Goal completed', { goalId })
    } catch (error) {
      Logger.error('Goal completion error', error)
    }
  }

  /**
   * Get current value for a goal type
   */
  private async getCurrentValue(patientId: string, goalType: GoalType): Promise<number> {
    try {
      const metricTypeMap: Record<GoalType, HealthMetricType | null> = {
        'weight_loss': 'weight',
        'weight_gain': 'weight',
        'steps_daily': 'steps',
        'exercise_minutes': 'exercise_time',
        'sleep_duration': 'sleep_duration',
        'water_intake': 'water_intake',
        'blood_pressure_control': 'blood_pressure_systolic',
        'blood_glucose_control': 'blood_glucose',
        'medication_adherence': 'medication_adherence',
        'custom': null
      }

      const metricType = metricTypeMap[goalType]
      if (!metricType) return 0

      // Get most recent metric value
      const result = await healthMetricsService.getHealthMetrics({
        patientId,
        metricTypes: [metricType],
        limit: 1
      })

      if (result.success && result.metrics && result.metrics.length > 0) {
        return result.metrics[0].value
      }

      return 0
    } catch (error) {
      Logger.error('Get current value error', error)
      return 0
    }
  }

  /**
   * Calculate progress based on goal type
   */
  private calculateProgress(
    startValue: number,
    currentValue: number,
    targetValue: number,
    goalType: GoalType
  ): number {
    if (goalType === 'weight_loss') {
      // For weight loss, progress is based on amount lost
      const weightLost = startValue - currentValue
      const targetLoss = startValue - targetValue
      return Math.min(1, Math.max(0, weightLost / targetLoss))
    } else if (goalType === 'weight_gain') {
      // For weight gain, progress is based on amount gained
      const weightGained = currentValue - startValue
      const targetGain = targetValue - startValue
      return Math.min(1, Math.max(0, weightGained / targetGain))
    } else {
      // For other goals, simple ratio
      return Math.min(1, Math.max(0, currentValue / targetValue))
    }
  }
}

// Export singleton instance
export const healthGoalsService = new HealthGoalsService()