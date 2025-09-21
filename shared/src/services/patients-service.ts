import { supabase } from '../config/supabase.js'

export interface EligibilityFormData {
  email: string
  treatmentType: 'glp1' | 'diabetes' | 'weight-management' | 'other'
  firstName: string
  lastName: string
  age: number
  height: {
    feet: number
    inches: number
  }
  weight: number // in pounds
  medicalHistory?: string[]
  currentMedications?: string[]
  insuranceProvider?: string
  state: string
  zipCode: string
}

export interface PatientProfile {
  id: string
  user_id: string
  email: string
  first_name: string
  last_name: string
  age?: number
  height_inches?: number
  weight_pounds?: number
  treatment_type?: string
  medical_history?: string[]
  current_medications?: string[]
  insurance_provider?: string
  state?: string
  zip_code?: string
  eligibility_status?: 'pending' | 'approved' | 'denied' | 'needs_review'
  onboarding_completed?: boolean
  created_at: string
  updated_at: string
}

export interface EligibilityResult {
  eligible: boolean
  reasons?: string[]
  requiresReview?: boolean
  estimatedCost?: number
  nextSteps?: string[]
}

export class PatientsService {
  /**
   * Submit eligibility form and check if patient qualifies
   */
  async submitEligibilityForm(data: EligibilityFormData): Promise<{
    success: boolean
    eligibilityResult?: EligibilityResult
    tempId?: string
    error?: string
  }> {
    try {
      // Calculate BMI for eligibility
      const heightInches = (data.height.feet * 12) + data.height.inches
      const bmi = (data.weight / (heightInches * heightInches)) * 703

      // Basic eligibility logic
      const eligibilityResult = this.calculateEligibility(data, bmi)

      // Store eligibility submission (before account creation)
      const { data: submission, error } = await supabase
        .from('eligibility_submissions')
        .insert({
          email: data.email,
          treatment_type: data.treatmentType,
          first_name: data.firstName,
          last_name: data.lastName,
          age: data.age,
          height_inches: heightInches,
          weight_pounds: data.weight,
          bmi: Math.round(bmi * 10) / 10,
          medical_history: data.medicalHistory,
          current_medications: data.currentMedications,
          insurance_provider: data.insuranceProvider,
          state: data.state,
          zip_code: data.zipCode,
          eligibility_status: eligibilityResult.eligible ? 'approved' : 'pending',
          requires_review: eligibilityResult.requiresReview
        })
        .select()
        .single()

      if (error) {
        console.error('Error submitting eligibility form:', error)
        return { success: false, error: 'Failed to submit eligibility form' }
      }

      return {
        success: true,
        eligibilityResult,
        tempId: submission.id
      }
    } catch (error) {
      console.error('Eligibility submission error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  /**
   * Create patient account after signup (links eligibility to user account)
   */
  async createPatientAccount(userId: string, eligibilityId: string): Promise<{
    success: boolean
    patient?: PatientProfile
    error?: string
  }> {
    try {
      // Get eligibility data
      const { data: eligibility, error: eligibilityError } = await supabase
        .from('eligibility_submissions')
        .select('*')
        .eq('id', eligibilityId)
        .single()

      if (eligibilityError || !eligibility) {
        return { success: false, error: 'Eligibility submission not found' }
      }

      // Create patient record
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .insert({
          user_id: userId,
          email: eligibility.email,
          first_name: eligibility.first_name,
          last_name: eligibility.last_name,
          age: eligibility.age,
          height_inches: eligibility.height_inches,
          weight_pounds: eligibility.weight_pounds,
          treatment_type: eligibility.treatment_type,
          medical_history: eligibility.medical_history,
          current_medications: eligibility.current_medications,
          insurance_provider: eligibility.insurance_provider,
          state: eligibility.state,
          zip_code: eligibility.zip_code,
          eligibility_status: eligibility.eligibility_status,
          onboarding_completed: false
        })
        .select()
        .single()

      if (patientError) {
        console.error('Error creating patient account:', patientError)
        return { success: false, error: 'Failed to create patient account' }
      }

      // Mark eligibility as linked
      await supabase
        .from('eligibility_submissions')
        .update({ linked_to_user: userId, linked_at: new Date().toISOString() })
        .eq('id', eligibilityId)

      return { success: true, patient }
    } catch (error) {
      console.error('Patient account creation error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  /**
   * Get patient profile by user ID
   */
  async getPatientProfile(userId: string): Promise<{
    success: boolean
    patient?: PatientProfile
    error?: string
  }> {
    try {
      const { data: patient, error } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        console.error('Error fetching patient profile:', error)
        return { success: false, error: 'Failed to fetch patient profile' }
      }

      return { success: true, patient }
    } catch (error) {
      console.error('Patient profile fetch error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  /**
   * Update patient profile
   */
  async updatePatientProfile(userId: string, updates: Partial<PatientProfile>): Promise<{
    success: boolean
    patient?: PatientProfile
    error?: string
  }> {
    try {
      const { data: patient, error } = await supabase
        .from('patients')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        console.error('Error updating patient profile:', error)
        return { success: false, error: 'Failed to update patient profile' }
      }

      return { success: true, patient }
    } catch (error) {
      console.error('Patient profile update error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  /**
   * Complete onboarding process
   */
  async completeOnboarding(userId: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const { error } = await supabase
        .from('patients')
        .update({ 
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (error) {
        console.error('Error completing onboarding:', error)
        return { success: false, error: 'Failed to complete onboarding' }
      }

      return { success: true }
    } catch (error) {
      console.error('Onboarding completion error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  /**
   * Calculate eligibility based on form data
   */
  private calculateEligibility(data: EligibilityFormData, bmi: number): EligibilityResult {
    const reasons: string[] = []
    let eligible = true
    let requiresReview = false
    let estimatedCost = 0

    // Age requirements
    if (data.age < 18) {
      eligible = false
      reasons.push('Must be 18 or older')
    } else if (data.age > 65) {
      requiresReview = true
      reasons.push('Age over 65 requires medical review')
    }

    // BMI requirements for weight management
    if (data.treatmentType === 'weight-management' || data.treatmentType === 'glp1') {
      if (bmi < 27) {
        eligible = false
        reasons.push('BMI must be 27 or higher for weight management programs')
      } else if (bmi >= 27 && bmi < 30) {
        requiresReview = true
        reasons.push('BMI 27-30 may require additional medical evaluation')
      }
    }

    // State coverage (example logic)
    const coveredStates = ['CA', 'NY', 'TX', 'FL', 'WA', 'OR', 'NV', 'AZ']
    if (!coveredStates.includes(data.state)) {
      eligible = false
      reasons.push('Service not currently available in your state')
    }

    // Medication interactions
    const contraindicatedMeds = ['insulin', 'warfarin', 'digoxin']
    if (data.currentMedications?.some(med => 
      contraindicatedMeds.some(contra => med.toLowerCase().includes(contra))
    )) {
      requiresReview = true
      reasons.push('Current medications require medical review')
    }

    // Estimate cost based on treatment type
    const treatmentCosts = {
      'glp1': 299,
      'weight-management': 199,
      'diabetes': 149,
      'other': 99
    }
    estimatedCost = treatmentCosts[data.treatmentType] || 99

    // If requires review, they're potentially eligible pending review
    if (requiresReview && eligible) {
      reasons.push('Potentially eligible pending medical review')
    }

    const nextSteps = eligible ? [
      'Create your account to continue',
      'Complete medical questionnaire',
      'Schedule consultation with provider'
    ] : [
      'Unfortunately, you do not qualify at this time',
      'Contact support for more information'
    ]

    return {
      eligible: eligible || requiresReview,
      reasons,
      requiresReview,
      estimatedCost,
      nextSteps
    }
  }
}

// Export singleton instance
export const patientsService = new PatientsService()