import { supabase } from '@joinomu/shared'

export interface TreatmentType {
  id: string
  name: string
  display_name: string
  description: string
  category: string
  active: boolean
}

export interface EligibilityQuestion {
  id: string
  question_key: string
  question_text: string
  question_type: string
  options: any[]
  validation_rules: any
  category: string
}

export interface EligibilitySubmission {
  id: string
  patient_id: string
  treatment_type_id: string
  submission_status: 'in_progress' | 'completed' | 'submitted'
  eligibility_status: 'pending' | 'approved' | 'denied' | 'needs_review'
  eligibility_score: number | null
  created_at: string
  updated_at: string
}

export interface EligibilityResponse {
  id: string
  submission_id: string
  question_id: string
  response_value: any
  response_text: string
  created_at: string
}

class EligibilityService {
  // Get treatment type by name
  async getTreatmentType(name: string): Promise<TreatmentType | null> {
    try {
      const { data, error } = await supabase
        .from('treatment_types')
        .select('*')
        .eq('name', name)
        .eq('active', true)
        .single()

      if (error) {
        console.error('Error fetching treatment type:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Failed to get treatment type:', error)
      return null
    }
  }

  // Get all questions for a treatment type
  async getTreatmentQuestions(treatmentTypeId: string): Promise<EligibilityQuestion[]> {
    try {
      const { data, error } = await supabase
        .from('treatment_eligibility_questions')
        .select(`
          eligibility_questions (
            id,
            question_key,
            question_text,
            question_type,
            options,
            validation_rules,
            category
          )
        `)
        .eq('treatment_type_id', treatmentTypeId)
        .order('order_sequence')

      if (error) {
        console.error('Error fetching treatment questions:', error)
        return []
      }

      return data.map(item => item.eligibility_questions).filter(Boolean)
    } catch (error) {
      console.error('Failed to get treatment questions:', error)
      return []
    }
  }

  // Create new eligibility submission
  async createSubmission(treatmentTypeId: string): Promise<EligibilitySubmission> {
    try {
      // For now, we'll create without patient_id since user isn't created yet
      // This will be updated when account is created
      const { data, error } = await supabase
        .from('patient_eligibility_submissions')
        .insert({
          treatment_type_id: treatmentTypeId,
          submission_status: 'in_progress',
          eligibility_status: 'pending'
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create submission: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('Failed to create submission:', error)
      throw error
    }
  }

  // Save response to question
  async saveResponse(submissionId: string, questionKey: string, responseValue: any): Promise<void> {
    try {
      // First, get the question ID from question_key
      const { data: question, error: questionError } = await supabase
        .from('eligibility_questions')
        .select('id')
        .eq('question_key', questionKey)
        .single()

      if (questionError || !question) {
        console.warn(`Question not found for key: ${questionKey}, creating temporary response`)
        // For development: still save the response even if question doesn't exist in DB
        console.log(`📋 Would save response for ${questionKey}:`, responseValue)
        return
      }

      // Convert response to appropriate format
      const responseText = Array.isArray(responseValue) 
        ? responseValue.join(', ')
        : String(responseValue)

      // Save or update the response
      const { error } = await supabase
        .from('patient_eligibility_responses')
        .upsert({
          submission_id: submissionId,
          question_id: question.id,
          response_value: responseValue,
          response_text: responseText
        }, {
          onConflict: 'submission_id,question_id'
        })

      if (error) {
        throw new Error(`Failed to save response: ${error.message}`)
      }
    } catch (error) {
      console.error('Failed to save response:', error)
      throw error
    }
  }

  // Complete submission
  async completeSubmission(submissionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('patient_eligibility_submissions')
        .update({
          submission_status: 'completed',
          submitted_at: new Date().toISOString()
        })
        .eq('id', submissionId)

      if (error) {
        throw new Error(`Failed to complete submission: ${error.message}`)
      }
    } catch (error) {
      console.error('Failed to complete submission:', error)
      throw error
    }
  }

  // Update submission with patient ID after account creation
  async linkSubmissionToPatient(submissionId: string, patientId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('patient_eligibility_submissions')
        .update({ patient_id: patientId })
        .eq('id', submissionId)

      if (error) {
        throw new Error(`Failed to link submission to patient: ${error.message}`)
      }
    } catch (error) {
      console.error('Failed to link submission to patient:', error)
      throw error
    }
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

export const eligibilityService = new EligibilityService()