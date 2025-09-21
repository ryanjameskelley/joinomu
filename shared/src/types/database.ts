// Database table interfaces
export interface Patient {
  id: string
  user_id: string
  email: string
  first_name: string
  last_name: string
  has_completed_intake?: boolean
  intake_data?: Record<string, any>
  active: boolean  // Added active field for account status
  created_at: string
  updated_at: string
}

export interface Admin {
  id: string
  user_id: string
  email: string
  first_name: string
  last_name: string
  has_completed_intake?: boolean
  intake_data?: Record<string, any>
  active: boolean  // Added active field for account status
  created_at: string
  updated_at: string
}

export interface EligibilitySubmission {
  id: string
  email: string
  treatment_type: string
  first_name: string
  last_name: string
  age: number
  height_inches: number
  weight_pounds: number
  bmi: number
  medical_history?: string[]
  current_medications?: string[]
  insurance_provider?: string
  state: string
  zip_code: string
  eligibility_status: 'pending' | 'approved' | 'denied' | 'needs_review'
  requires_review: boolean
  linked_to_user?: string
  linked_at?: string
  created_at: string
  updated_at: string
}

export interface HealthMetric {
  id: string
  patient_id: string
  metric_type: string
  value: number
  unit?: string
  recorded_at: string
  synced_from?: string
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface WearableDevice {
  id: string
  patient_id: string
  device_type: string
  device_name?: string
  device_identifier?: string
  is_connected: boolean
  last_sync?: string
  sync_frequency: string
  enabled_metrics: string[]
  connection_metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface HealthDataPermission {
  id: string
  patient_id: string
  provider_id?: string
  admin_id?: string
  permission_type: 'view' | 'edit' | 'export'
  metric_types?: string[]
  granted_at: string
  expires_at?: string
  granted_by: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface HealthGoal {
  id: string
  patient_id: string
  goal_type: string
  target_value: number
  target_unit: string
  current_value: number
  start_date: string
  target_date: string
  status: 'active' | 'completed' | 'paused' | 'cancelled'
  notes?: string
  created_by?: string
  created_at: string
  updated_at: string
}

// User role types
export type UserRole = 'patient' | 'admin' | 'provider'

// HealthKit and Wearable Device Types
export type DeviceType = 'apple_watch' | 'fitbit' | 'garmin' | 'samsung_health' | 'google_fit' | 'manual'

export type HealthMetricType = 
  // Vital Signs
  | 'heart_rate' 
  | 'blood_pressure_systolic'
  | 'blood_pressure_diastolic'
  | 'body_temperature'
  | 'respiratory_rate'
  | 'oxygen_saturation'
  
  // Body Measurements
  | 'weight'
  | 'height'
  | 'body_mass_index'
  | 'body_fat_percentage'
  | 'lean_body_mass'
  | 'waist_circumference'
  
  // Activity & Fitness
  | 'steps'
  | 'distance_walked'
  | 'flights_climbed'
  | 'active_energy_burned'
  | 'exercise_time'
  | 'stand_hours'
  | 'vo2_max'
  
  // Sleep
  | 'sleep_duration'
  | 'sleep_efficiency'
  | 'sleep_onset_latency'
  | 'deep_sleep_duration'
  | 'rem_sleep_duration'
  
  // Nutrition & Metabolism
  | 'blood_glucose'
  | 'insulin'
  | 'dietary_energy_consumed'
  | 'water_intake'
  
  // Mental Health
  | 'mood_score'
  | 'stress_level'
  | 'anxiety_level'
  
  // Women's Health
  | 'menstrual_cycle_length'
  | 'ovulation_test_result'
  
  // Respiratory
  | 'peak_expiratory_flow_rate'
  | 'forced_expiratory_volume'
  
  // Custom
  | 'medication_adherence'
  | 'symptom_severity'
  | 'pain_level'

export type GoalType = 
  | 'weight_loss'
  | 'weight_gain'
  | 'steps_daily'
  | 'exercise_minutes'
  | 'sleep_duration'
  | 'water_intake'
  | 'medication_adherence'
  | 'blood_pressure_control'
  | 'blood_glucose_control'
  | 'custom'

export interface HealthMetricUnit {
  metric_type: HealthMetricType
  primary_unit: string
  display_units: string[]
}

export interface ChartDataPoint {
  date: string
  value: number
  unit: string
  source?: string
}

export interface HealthInsight {
  id: string
  patient_id: string
  metric_type: HealthMetricType
  insight_type: 'trend' | 'anomaly' | 'achievement' | 'recommendation'
  title: string
  description: string
  data_range: {
    start_date: string
    end_date: string
  }
  confidence_score: number
  created_at: string
}

// API request/response types
export interface CreatePatientRequest {
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  date_of_birth?: string
}

export interface CreateAdminRequest {
  email: string
  role: string
  first_name?: string
  last_name?: string
}

// Health Data API Types
export interface CreateHealthMetricRequest {
  metric_type: HealthMetricType
  value: number
  unit?: string
  recorded_at?: string
  synced_from?: string
  metadata?: Record<string, any>
}

export interface CreateWearableDeviceRequest {
  device_type: DeviceType
  device_name?: string
  device_identifier?: string
  sync_frequency?: string
  enabled_metrics?: HealthMetricType[]
  connection_metadata?: Record<string, any>
}

export interface CreateHealthGoalRequest {
  goal_type: GoalType
  target_value: number
  target_unit: string
  start_date: string
  target_date: string
  notes?: string
}

export interface GrantHealthPermissionRequest {
  provider_id?: string
  admin_id?: string
  permission_type: 'view' | 'edit' | 'export'
  metric_types?: HealthMetricType[]
  expires_at?: string
}

export interface HealthDataFilters {
  metric_types?: HealthMetricType[]
  start_date?: string
  end_date?: string
  sources?: string[]
  limit?: number
  offset?: number
}

export interface HealthDataSummary {
  patient_id: string
  total_metrics: number
  active_devices: number
  last_sync?: string
  recent_metrics: {
    metric_type: HealthMetricType
    latest_value: number
    unit: string
    recorded_at: string
  }[]
  goals_progress: {
    active_goals: number
    completed_goals: number
    completion_rate: number
  }
}

// Database error types
export interface DatabaseError {
  message: string
  code?: string
  details?: string
  hint?: string
}