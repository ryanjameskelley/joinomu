import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '@joinomu/shared'

// Import all onboarding components
import { 
  PathEntry, 
  WeightLossOnboardingEntry, 
  WeightLossMedicationPreference, 
  Transition,
  StateSelection,
  DateOfBirth,
  WeightLossMotivations,
  AccountCreation,
  HeightWeight
} from '@joinomu/ui'

// Eligibility service for database integration
import { eligibilityService } from '../services/eligibility-service'

// Define the onboarding flow steps
type OnboardingStep = 
  | 'path-entry'
  | 'weightloss-entry' 
  | 'preference'
  | 'transition-yes'
  | 'transition-no'
  | 'state'
  | 'dateofbirth'
  | 'motivations'
  | 'account'
  | 'transition-health'
  | 'height-weight'
  | 'activity'
  | 'eating-disorders'
  | 'mental-health'
  | 'self-harm'
  | 'diagnosed-conditions'
  | 'chronic-diseases'
  | 'family-medical'
  | 'family-health'
  | 'medication-history'
  | 'procedures'
  | 'supplements'
  | 'allergies'
  | 'drinking'
  | 'drugs'
  | 'smoking'
  | 'heart-rate'
  | 'gastrointestinal'
  | 'side-effects'
  | 'side-effect-guidance'
  | 'challenges'
  | 'challenges-elaborate'
  | 'program-adherence'
  | 'program-consistency'
  | 'gi-dosing'
  | 'energy-dosing'
  | 'muscle-loss-dosing'
  | 'additional'
  | 'recommendations'
  | 'how-medication-helps'
  | 'recommendation-transition'
  | 'complete'

interface OnboardingState {
  currentStep: OnboardingStep
  submissionId: string | null
  treatmentTypeId: string | null
  responses: Record<string, any>
  progress: number
  selectedPath: string[]
  weightLossGoal: string
  motivations: string[]
  heightFeet: string
  heightInches: string
  weight: string
  calculatedBMI: number | null
  accountData: {
    email: string
    password: string
    firstName: string
    lastName: string
  }
}

const initialState: OnboardingState = {
  currentStep: 'path-entry',
  submissionId: null,
  treatmentTypeId: null,
  responses: {},
  progress: 0,
  selectedPath: [],
  weightLossGoal: '',
  motivations: [],
  heightFeet: '',
  heightInches: '',
  weight: '',
  calculatedBMI: null,
  accountData: {
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  }
}

export function PatientOnboardingFlow() {
  const navigate = useNavigate()
  const [state, setState] = useState<OnboardingState>(initialState)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Initialize eligibility submission when flow starts
  useEffect(() => {
    initializeSubmission()
  }, [])

  const initializeSubmission = async () => {
    try {
      // Get weight loss treatment type ID
      const treatmentType = await eligibilityService.getTreatmentType('weight_loss')
      if (!treatmentType) throw new Error('Weight loss treatment type not found')

      // Create new eligibility submission
      const submission = await eligibilityService.createSubmission(treatmentType.id)
      
      setState(prev => ({
        ...prev,
        submissionId: submission.id,
        treatmentTypeId: treatmentType.id
      }))
    } catch (error: any) {
      setError(error.message || 'Failed to initialize onboarding')
    }
  }

  const calculateBMI = (feet: string, inches: string, weight: string): number | null => {
    if (!feet || !inches || !weight) return null
    
    const totalInches = parseInt(feet) * 12 + parseInt(inches)
    const weightNum = parseFloat(weight)
    const bmi = (weightNum / (totalInches * totalInches)) * 703
    
    return Math.round(bmi * 10) / 10
  }

  const getStepProgress = (step: OnboardingStep): number => {
    const steps: OnboardingStep[] = [
      'path-entry', 'weightloss-entry', 'preference', 'transition-yes', 'state',
      'dateofbirth', 'motivations', 'account', 'transition-health', 'height-weight',
      'activity', 'eating-disorders', 'mental-health', 'self-harm', 'diagnosed-conditions',
      'chronic-diseases', 'family-medical', 'family-health', 'medication-history',
      'procedures', 'supplements', 'allergies', 'drinking', 'drugs', 'smoking',
      'heart-rate', 'gastrointestinal', 'side-effects', 'side-effect-guidance',
      'challenges', 'challenges-elaborate', 'program-adherence', 'program-consistency',
      'gi-dosing', 'energy-dosing', 'muscle-loss-dosing', 'additional',
      'recommendations', 'recommendation-transition', 'complete'
    ]
    
    const currentIndex = steps.indexOf(step)
    return Math.round((currentIndex / (steps.length - 1)) * 100)
  }

  const saveResponse = async (questionKey: string, responseValue: any) => {
    if (!state.submissionId) return

    try {
      await eligibilityService.saveResponse(
        state.submissionId,
        questionKey,
        responseValue
      )
      
      setState(prev => ({
        ...prev,
        responses: {
          ...prev.responses,
          [questionKey]: responseValue
        }
      }))
    } catch (error: any) {
      console.error('Failed to save response:', error)
    }
  }

  const handleNextStep = async (data?: any) => {
    const currentStep = state.currentStep
    let nextStep: OnboardingStep

    // Handle step-specific logic and save responses
    switch (currentStep) {
      case 'path-entry':
        if (data.selectedPath?.includes('weight_loss')) {
          await saveResponse('treatment_preference', data.selectedPath)
          nextStep = 'weightloss-entry'
        } else {
          // Handle other paths in the future
          nextStep = 'weightloss-entry'
        }
        break

      case 'weightloss-entry':
        await saveResponse('weight_loss_goals', data.selectedGoal)
        setState(prev => ({ ...prev, weightLossGoal: data.selectedGoal }))
        nextStep = 'preference'
        break

      case 'preference':
        await saveResponse('previous_glp1', data.selectedPreference)
        nextStep = data.selectedPreference === 'yes' ? 'transition-yes' : 'transition-no'
        break

      case 'transition-yes':
      case 'transition-no':
        nextStep = 'state'
        break

      case 'state':
        await saveResponse('state', data.selectedState)
        nextStep = 'dateofbirth'
        break

      case 'dateofbirth':
        await saveResponse('date_of_birth', data.dateOfBirth)
        await saveResponse('gender', data.gender)
        nextStep = 'motivations'
        break

      case 'motivations':
        await saveResponse('motivations', data.selectedMotivations)
        setState(prev => ({ ...prev, motivations: data.selectedMotivations }))
        nextStep = 'account'
        break

      case 'account':
        setState(prev => ({
          ...prev,
          accountData: {
            email: data.email,
            password: data.password,
            firstName: data.firstName || '',
            lastName: data.lastName || ''
          }
        }))
        nextStep = 'transition-health'
        break

      case 'transition-health':
        nextStep = 'height-weight'
        break

      case 'height-weight':
        await saveResponse('height_feet', data.heightFeet)
        await saveResponse('height_inches', data.heightInches)
        await saveResponse('weight', data.weight)
        
        const bmi = calculateBMI(data.heightFeet, data.heightInches, data.weight)
        setState(prev => ({
          ...prev,
          heightFeet: data.heightFeet,
          heightInches: data.heightInches,
          weight: data.weight,
          calculatedBMI: bmi
        }))
        
        if (bmi) {
          await saveResponse('bmi', bmi.toString())
        }
        
        nextStep = 'activity'
        break

      case 'activity':
        await saveResponse('activity_level', data.activityLevel)
        nextStep = 'eating-disorders'
        break

      // Continue with all other steps...
      default:
        nextStep = 'complete'
    }

    // Update progress and move to next step
    const newProgress = getStepProgress(nextStep)
    setState(prev => ({
      ...prev,
      currentStep: nextStep,
      progress: newProgress
    }))

    // Handle completion
    if (nextStep === 'complete') {
      await completeOnboarding()
    }
  }

  const completeOnboarding = async () => {
    setLoading(true)
    try {
      // Create account
      const { data: authData, error: signUpError } = await authService.signUp({
        email: state.accountData.email,
        password: state.accountData.password,
        firstName: state.accountData.firstName,
        lastName: state.accountData.lastName,
        role: 'patient'
      })

      if (signUpError) throw signUpError

      // Mark submission as completed
      if (state.submissionId) {
        await eligibilityService.completeSubmission(state.submissionId)
      }

      // Navigate to dashboard
      navigate('/patient/dashboard')
    } catch (error: any) {
      setError(error.message || 'Failed to complete onboarding')
    }
    setLoading(false)
  }

  const renderCurrentStep = () => {
    const commonProps = {
      progress: state.progress,
      onContinue: handleNextStep,
      onSignInClick: () => navigate('/patient/login')
    }

    switch (state.currentStep) {
      case 'path-entry':
        return (
          <PathEntry
            {...commonProps}
            onPathSelect={(paths) => handleNextStep({ selectedPath: paths })}
          />
        )

      case 'weightloss-entry':
        return (
          <WeightLossOnboardingEntry
            {...commonProps}
            onGoalSelect={(goal) => handleNextStep({ selectedGoal: goal })}
          />
        )

      case 'preference':
        return (
          <WeightLossMedicationPreference
            {...commonProps}
            onPreferenceSelect={(pref) => handleNextStep({ selectedPreference: pref })}
          />
        )

      case 'height-weight':
        return (
          <HeightWeight
            {...commonProps}
            onHeightFeetChange={(feet) => setState(prev => ({ ...prev, heightFeet: feet }))}
            onHeightInchesChange={(inches) => setState(prev => ({ ...prev, heightInches: inches }))}
            onWeightChange={(weight) => setState(prev => ({ ...prev, weight }))}
            onContinue={() => handleNextStep({
              heightFeet: state.heightFeet,
              heightInches: state.heightInches,
              weight: state.weight
            })}
          />
        )

      case 'account':
        return (
          <AccountCreation
            {...commonProps}
            selectedGoal={state.weightLossGoal}
            selectedMotivations={state.motivations}
            onEmailChange={(email) => setState(prev => ({ 
              ...prev, 
              accountData: { ...prev.accountData, email }
            }))}
            onPasswordChange={(password) => setState(prev => ({ 
              ...prev, 
              accountData: { ...prev.accountData, password }
            }))}
            onContinue={() => handleNextStep(state.accountData)}
          />
        )

      // Add all other steps here...
      
      default:
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Step: {state.currentStep}</h2>
              <p className="text-muted-foreground mb-4">This step is not yet implemented</p>
              <button 
                onClick={() => handleNextStep()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded"
              >
                Continue (Placeholder)
              </button>
            </div>
          </div>
        )
    }
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-4">Error</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {renderCurrentStep()}
    </div>
  )
}