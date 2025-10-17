import { supabase } from '@joinomu/shared'

export interface OnboardingData {
  // Basic onboarding
  treatment_preferences: string[]
  weight_loss_goals: string
  medication_preference: string
  transition_answer: string
  selected_state: string
  date_of_birth: string
  gender: string
  motivations: string[]
  
  // Extended health assessment
  height_feet: string
  height_inches: string
  weight: string
  activity_level: string
  eating_disorders: string[]
  mental_health: string[]
  self_harm_screening: string[]
  diagnosed_conditions: string[]
  chronic_diseases: string[]
  family_medical_history: string[]
  family_health: string[]
  medication_history: string[]
  procedures: string[]
  supplements: string[]
  allergies: string[]
  drinking: string
  drugs: string[]
  smoking: string
  heart_rate: string
  gastrointestinal: string[]
  side_effects: string[]
  side_effect_guidance: string[]
  challenges: string[]
  challenges_elaborate: string
  program_adherence: string[]
  program_consistency: string[]
  gastrointestinal_dosing: string
  energy_dosing: string
  muscle_loss_dosing: string
  additional_info: string
  
  // Calculated fields
  bmi: number
  medication_qualified: boolean
}

class PatientOnboardingService {
  private tempOnboardingData: Partial<OnboardingData> = {}

  // Store onboarding data temporarily (before patient account is created)
  storeTemporaryData(key: string, value: any) {
    console.log(`📋 Storing temporary onboarding data for ${key}:`, value)
    
    // Store all fields directly using the key name that matches the database column
    if (key in this.tempOnboardingData || this.isValidOnboardingKey(key)) {
      (this.tempOnboardingData as any)[key] = value
    } else {
      console.warn(`⚠️ Unknown onboarding key: ${key}`)
    }
  }

  private isValidOnboardingKey(key: string): boolean {
    const validKeys = [
      'treatment_preferences', 'weight_loss_goals', 'medication_preference', 'transition_answer',
      'selected_state', 'date_of_birth', 'gender', 'motivations', 'height_feet', 'height_inches',
      'weight', 'activity_level', 'eating_disorders', 'mental_health', 'self_harm_screening',
      'diagnosed_conditions', 'chronic_diseases', 'family_medical_history', 'family_health',
      'medication_history', 'procedures', 'supplements', 'allergies', 'drinking', 'drugs',
      'smoking', 'heart_rate', 'gastrointestinal', 'side_effects', 'side_effect_guidance',
      'challenges', 'challenges_elaborate', 'program_adherence', 'program_consistency',
      'gastrointestinal_dosing', 'energy_dosing', 'muscle_loss_dosing', 'additional_info',
      'bmi', 'medication_qualified'
    ]
    return validKeys.includes(key)
  }

  // Get all temporarily stored data
  getTemporaryData(): Partial<OnboardingData> {
    return { ...this.tempOnboardingData }
  }

  // Clear all temporary data
  clearTemporaryData(): void {
    this.tempOnboardingData = {}
    console.log('🧹 Temporary onboarding data cleared')
  }

  // Save single response directly to database (for post-account responses)
  async saveResponseToDatabase(key: string, value: any): Promise<void> {
    try {
      console.log(`🔄 Attempting to save ${key}:`, value)
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.warn(`⚠️ No authenticated user for ${key}, storing temporarily:`, value)
        this.storeTemporaryData(key, value)
        return
      }

      // Find patient record
      const { data: patients, error: findError } = await supabase
        .from('patients')
        .select('id')
        .eq('profile_id', user.id)
        .single()

      if (findError || !patients) {
        console.error('❌ Failed to find patient record:', findError)
        // Fall back to temporary storage
        this.storeTemporaryData(key, value)
        return
      }

      // Save directly to database
      const updateData = { [key]: value }
      const { error: saveError } = await supabase
        .from('patients')
        .update(updateData)
        .eq('id', patients.id)

      if (saveError) {
        console.error('❌ Failed to save response to database:', saveError)
        // Fall back to temporary storage
        this.storeTemporaryData(key, value)
        return
      }

      console.log(`✅ Successfully saved ${key} directly to database:`, value)
      console.log(`🔍 Database update data:`, updateData)
    } catch (error) {
      console.error('❌ Error saving response to database:', error)
      // Fall back to temporary storage
      this.storeTemporaryData(key, value)
    }
  }

  // Save onboarding data to patient record (when patient account is created)
  async saveOnboardingToPatient(patientId: string): Promise<void> {
    try {
      console.log('🔄 Saving temporary onboarding data to patient:', patientId)
      console.log('📋 Temporary data to save:', this.tempOnboardingData)
      
      const updateData = {
        ...this.tempOnboardingData,
        onboarding_completed_at: new Date().toISOString(),
        has_completed_intake: true
      }
      
      const { error } = await supabase
        .from('patients')
        .update(updateData)
        .eq('id', patientId)

      if (error) {
        throw new Error(`Failed to save onboarding data: ${error.message}`)
      }

      console.log('✅ Onboarding data saved to patient record:', patientId)
      console.log('🔍 Data saved:', updateData)
      
      // Clear temporary data after saving
      this.tempOnboardingData = {}
    } catch (error) {
      console.error('❌ Failed to save onboarding to patient:', error)
      throw error
    }
  }

  // Update existing patient's onboarding data
  async updatePatientOnboarding(patientId: string, data: Partial<OnboardingData>): Promise<void> {
    try {
      const { error } = await supabase
        .from('patients')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', patientId)

      if (error) {
        throw new Error(`Failed to update onboarding data: ${error.message}`)
      }

      console.log('✅ Patient onboarding data updated:', patientId)
    } catch (error) {
      console.error('❌ Failed to update patient onboarding:', error)
      throw error
    }
  }

  // Calculate BMI
  calculateBMI(feet: number, inches: number, weightLbs: number): number {
    const totalInches = feet * 12 + inches
    const bmi = (weightLbs / (totalInches * totalInches)) * 703
    return Math.round(bmi * 10) / 10
  }

  // Calculate BMI qualification
  calculateBMIQualification(bmi: number): {
    qualifies: boolean
    message: string
    category: string
  } {
    if (bmi < 18.5) {
      return {
        qualifies: false,
        message: 'BMI is below the recommended range for weight loss medication',
        category: 'underweight'
      }
    } else if (bmi >= 18.5 && bmi < 25) {
      return {
        qualifies: false,
        message: 'BMI is in the normal range. Weight loss medication may not be appropriate',
        category: 'normal'
      }
    } else if (bmi >= 25 && bmi < 27) {
      return {
        qualifies: false,
        message: 'BMI is slightly elevated. Lifestyle changes may be recommended first',
        category: 'overweight'
      }
    } else if (bmi >= 27 && bmi < 30) {
      return {
        qualifies: true,
        message: 'Your BMI qualifies for weight loss medication',
        category: 'overweight_qualified'
      }
    } else if (bmi >= 30) {
      return {
        qualifies: true,
        message: 'Your BMI qualifies for weight loss medication',
        category: 'obese'
      }
    }

    return {
      qualifies: false,
      message: 'Unable to determine BMI qualification',
      category: 'unknown'
    }
  }

  // Get BMI position for visual indicator (18.5 to 40 scale)
  getBMIPosition(bmi: number): number {
    const minBMI = 18.5
    const maxBMI = 40
    const clampedBMI = Math.max(minBMI, Math.min(maxBMI, bmi))
    return ((clampedBMI - minBMI) / (maxBMI - minBMI)) * 100
  }
}

export const patientOnboardingService = new PatientOnboardingService()