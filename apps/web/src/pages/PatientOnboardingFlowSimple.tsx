import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  PathEntry, 
  WeightLossOnboardingEntry, 
  WeightLossMedicationPreference,
  Transition,
  StateSelection,
  DateOfBirth,
  WeightLossMotivations,
  AccountCreation,
  HeightWeight,
  ActivityLevelSelection,
  EatingDisordersScreening,
  MentalHealthScreening,
  DiagnosedConditionsScreening,
  MedicationHistoryScreening,
  alcoholFrequencyOptions,
  recreationalDrugOptions,
  yesNoOptions,
  heartRateOptions,
  gastrointestinalSymptomsOptions,
  sideEffectsOptions,
  treatmentPlanOptions,
  weightLossChallengesOptions,
  weightLossProgramStoppedOptions,
  weightLossProgramEasierOptions,
  yesNoNotSureOptions,
  SideEffectGuidance,
  WeightLossChallenges,
  SideEffectDosing,
  AdditionalInformation,
  MedicationRecommendation
} from '@joinomu/ui'
import { patientOnboardingService } from '../services/patient-onboarding-service'
import { authService, supabase } from '@joinomu/shared'

const familyMedicalHistoryConditions = [
  { value: 'medullary-thyroid-cancer', label: 'Medullary thyroid cancer' },
  { value: 'multiple-endocrine-neoplasia', label: 'Multiple endocrine neoplasia type-2' },
  { value: 'pancreatitis', label: 'Pancreatitis' },
  { value: 'gastroparesis', label: 'Gastroparesis (delayed stomach emptying)' },
  { value: 'diabetes-type-2', label: 'Diabetes type 2' },
  { value: 'long-qt-syndrome', label: 'Long QT syndrome' },
  { value: 'none', label: 'No, none of these' }
]

type OnboardingStep = 
  | 'path' | 'weight-goal' | 'medication-preference' | 'transition' | 'state' | 'date-of-birth' | 'motivations' | 'account' 
  | 'health-history-transition' | 'height-weight' | 'activity-level' | 'eating-disorders' | 'mental-health' | 'self-harm-screening'
  | 'diagnosed-conditions' | 'chronic-diseases' | 'family-medical-history' | 'family-health' | 'medication-history' 
  | 'procedures' | 'supplements' | 'allergies' | 'drinking' | 'drugs' | 'smoking' | 'heart-rate' | 'gastrointestinal' 
  | 'side-effects' | 'side-effect-guidance' | 'challenges' | 'challenges-elaborate' | 'program-adherence' 
  | 'program-consistency' | 'gastrointestinal-dosing' | 'energy-dosing' | 'muscle-loss-dosing' | 'additional' 
  | 'recommendations' | 'recommendation-transition' | 'complete'

interface OnboardingState {
  currentStep: OnboardingStep
  selectedPath: string[]
  weightLossGoal: string
  medicationPreference: string
  transitionAnswer: string
  selectedState: string
  dateOfBirth: string
  gender: string
  motivations: string[]
  accountData: {
    email: string
    password: string
  }
  // Extended health assessment data
  heightFeet: string
  heightInches: string
  weight: string
  activityLevel: string
  eatingDisorders: string[]
  mentalHealth: string[]
  selfHarmScreening: string[]
  diagnosedConditions: string[]
  chronicDiseases: string
  familyMedicalHistory: string[]
  familyHealth: string
  medicationHistory: string[]
  procedures: string
  supplements: string
  allergies: string
  drinking: string
  drugs: string[]
  smoking: string
  heartRate: string
  gastrointestinal: string[]
  sideEffects: string[]
  sideEffectGuidance: string[]
  challenges: string[]
  challengesElaborate: string
  programAdherence: string[]
  programConsistency: string[]
  gastrointestinalDosing: string
  energyDosing: string
  muscleLossDosing: string
  additionalInfo: string
}

export function PatientOnboardingFlowSimple() {
  const navigate = useNavigate()
  const [state, setState] = useState<OnboardingState>({
    currentStep: 'path',
    selectedPath: [],
    weightLossGoal: '',
    medicationPreference: '',
    transitionAnswer: '',
    selectedState: '',
    dateOfBirth: '',
    gender: '',
    motivations: [],
    accountData: { email: '', password: '' },
    // Extended health assessment defaults
    heightFeet: '',
    heightInches: '',
    weight: '',
    activityLevel: '',
    eatingDisorders: [],
    mentalHealth: [],
    selfHarmScreening: [],
    diagnosedConditions: [],
    chronicDiseases: '',
    familyMedicalHistory: [],
    familyHealth: '',
    medicationHistory: [],
    procedures: '',
    supplements: '',
    allergies: '',
    drinking: '',
    drugs: [],
    smoking: '',
    heartRate: '',
    gastrointestinal: [],
    sideEffects: [],
    sideEffectGuidance: [],
    challenges: [],
    challengesElaborate: '',
    programAdherence: [],
    programConsistency: [],
    gastrointestinalDosing: '',
    energyDosing: '',
    muscleLossDosing: '',
    additionalInfo: ''
  })

  // Comprehensive data mapping function for all onboarding fields
  const mapOnboardingValue = (questionKey: string, value: any): any => {
    console.log(`🔄 Mapping ${questionKey}:`, { originalValue: value })
    
    switch (questionKey) {
      case 'treatment_preferences':
        // Ensure array format for treatment preferences
        const preferences = Array.isArray(value) ? value : [value]
        return preferences.filter(Boolean)
      
      case 'weight_loss_goals':
        // Map UI weight goal values to database format
        const goalMapping: Record<string, string> = {
          '1-15': 'Losing 1-15 lbs',
          '16-50': 'Losing 16-50 lbs', 
          '51+': 'Losing 51+ lbs',
          'not-sure': 'Not sure, I just need to lose weight'
        }
        return goalMapping[value] || value
      
      case 'medication_preference':
        // Ensure consistent medication preference format
        return value || ''
      
      case 'transition_answer':
        // Ensure string format for transition answer
        return String(value || '')
      
      case 'selected_state':
        // Ensure state is properly formatted
        return String(value || '')
      
      case 'date_of_birth':
        // Ensure date format (YYYY-MM-DD)
        if (!value) return null
        try {
          const date = new Date(value)
          return date.toISOString().split('T')[0]
        } catch {
          return null
        }
      
      case 'gender':
        // Ensure gender is properly formatted
        return String(value || '')
      
      case 'motivations':
        // Ensure array format for motivations
        const motivationsList = Array.isArray(value) ? value : [value]
        return motivationsList.filter(Boolean)
      
      case 'activity_level':
        // Ensure activity level is properly formatted as string
        return String(value || '')
      
      case 'eating_disorders':
        // Ensure array format for eating disorders
        const eatingDisordersList = Array.isArray(value) ? value : [value]
        return eatingDisordersList.filter(Boolean)
      
      case 'chronic_diseases':
        // Ensure array format for chronic diseases
        if (Array.isArray(value)) {
          return value.filter(Boolean)
        }
        return value ? [value] : []
      
      case 'family_health':
        // Ensure array format for family health
        if (Array.isArray(value)) {
          return value.filter(Boolean)
        }
        return value ? [value] : []
      
      case 'medication_history':
        // Ensure array format for medication history
        const medicationHistoryList = Array.isArray(value) ? value : [value]
        return medicationHistoryList.filter(Boolean)
      
      case 'procedures':
        // Ensure array format for procedures
        if (Array.isArray(value)) {
          return value.filter(Boolean)
        }
        return value ? [value] : []
      
      case 'supplements':
        // Ensure array format for supplements
        if (Array.isArray(value)) {
          return value.filter(Boolean)
        }
        return value ? [value] : []
      
      case 'drinking':
        // Ensure string format for drinking
        return String(value || '')
      
      case 'drugs':
        // Ensure array format for drugs
        const drugsList = Array.isArray(value) ? value : [value]
        return drugsList.filter(Boolean)
      
      case 'smoking':
        // Ensure string format for smoking
        return String(value || '')
      
      case 'heart_rate':
        // Ensure string format for heart rate
        return String(value || '')
      
      case 'gastrointestinal':
        // Ensure array format for gastrointestinal symptoms
        const gastrointestinalList = Array.isArray(value) ? value : [value]
        return gastrointestinalList.filter(Boolean)
      
      default:
        // Default handling for other fields
        if (Array.isArray(value)) {
          return value.filter(Boolean)
        }
        return value
    }
  }

  const saveResponse = async (questionKey: string, responseValue: any) => {
    try {
      // Map the value using our comprehensive mapping function
      const mappedValue = mapOnboardingValue(questionKey, responseValue)
      
      console.log(`💾 Saving ${questionKey}:`, { 
        originalValue: responseValue, 
        mappedValue,
        type: typeof mappedValue 
      })
      
      // Try to save directly to database if user is logged in, otherwise store temporarily
      await patientOnboardingService.saveResponseToDatabase(questionKey, mappedValue)
      
      console.log(`✅ Successfully saved ${questionKey}`)
    } catch (error) {
      console.error(`❌ Failed to save ${questionKey}:`, error)
      // Still attempt to store temporarily on error
      try {
        const mappedValue = mapOnboardingValue(questionKey, responseValue)
        patientOnboardingService.storeTemporaryData(questionKey, mappedValue)
        console.log(`💾 Stored ${questionKey} temporarily as fallback`)
      } catch (fallbackError) {
        console.error(`❌ Even temporary storage failed for ${questionKey}:`, fallbackError)
      }
    }
  }

  const calculateBMI = (feet: string, inches: string, weight: string): number | null => {
    if (!feet || !inches || !weight) return null
    const totalInches = parseInt(feet) * 12 + parseInt(inches)
    const weightNum = parseFloat(weight)
    return Math.round(((weightNum / (totalInches * totalInches)) * 703) * 10) / 10
  }

  const getProgress = (): number => {
    const allSteps = [
      'path', 'weight-goal', 'medication-preference', 'transition', 'state', 'date-of-birth', 'motivations', 'account',
      'health-history-transition', 'height-weight', 'activity-level', 'eating-disorders', 'mental-health', 'self-harm-screening',
      'diagnosed-conditions', 'chronic-diseases', 'family-medical-history', 'family-health', 'medication-history',
      'procedures', 'supplements', 'allergies', 'drinking', 'drugs', 'smoking', 'heart-rate', 'gastrointestinal',
      'side-effects', 'side-effect-guidance', 'challenges', 'challenges-elaborate', 'program-adherence',
      'program-consistency', 'gastrointestinal-dosing', 'energy-dosing', 'muscle-loss-dosing', 'additional',
      'recommendations', 'recommendation-transition', 'complete'
    ]
    const currentIndex = allSteps.indexOf(state.currentStep)
    return Math.round((currentIndex / (allSteps.length - 1)) * 100)
  }

  const handleNextStep = async (data?: any) => {
    const { currentStep } = state

    switch (currentStep) {
      case 'path':
        console.log('🛤️ Processing path step:', { selectedPath: state.selectedPath, data })
        
        const pathData = data?.selectedAreas || state.selectedPath
        if (pathData?.includes('weight-loss')) {
          console.log('🎯 Weight loss path selected, saving treatment preferences')
          await saveResponse('treatment_preferences', pathData)
          setState(prev => ({ 
            ...prev, 
            selectedPath: pathData,
            currentStep: 'weight-goal' 
          }))
        } else {
          console.log('⚠️ No weight-loss path selected:', pathData)
        }
        break

      case 'weight-goal':
        console.log('🎯 Processing weight-goal step:', { data, stateValue: state.weightLossGoal })
        
        const goalValue = data?.selectedGoal || state.weightLossGoal
        
        if (!goalValue) {
          console.error('❌ No weight loss goal value provided!')
          return
        }
        
        console.log('💡 Weight Loss Goal Processing:', { 
          originalValue: goalValue, 
          dataParam: data,
          stateValue: state.weightLossGoal
        })
        
        await saveResponse('weight_loss_goals', goalValue)
        setState(prev => ({ 
          ...prev, 
          weightLossGoal: goalValue,
          currentStep: 'medication-preference' 
        }))
        break

      case 'medication-preference':
        console.log('💊 Processing medication-preference step:', { data, stateValue: state.medicationPreference })
        
        const medicationPref = data?.preference || state.medicationPreference
        
        if (!medicationPref) {
          console.error('❌ No medication preference value provided!')
          return
        }
        
        await saveResponse('medication_preference', medicationPref)
        setState(prev => ({ 
          ...prev, 
          medicationPreference: medicationPref,
          currentStep: 'transition' 
        }))
        break

      case 'transition':
        console.log('🔄 Processing transition step - continue to next step')
        
        // Transition step is just informational, no data to collect
        // Just move to the next step
        setState(prev => ({ 
          ...prev, 
          currentStep: 'state' 
        }))
        break

      case 'state':
        console.log('🗺️ Processing state step:', { data, stateValue: state.selectedState })
        
        const stateSelection = data?.state || state.selectedState
        
        if (!stateSelection) {
          console.error('❌ No state selection value provided!')
          return
        }
        
        await saveResponse('selected_state', stateSelection)
        setState(prev => ({ 
          ...prev, 
          selectedState: stateSelection,
          currentStep: 'date-of-birth' 
        }))
        break

      case 'date-of-birth':
        console.log('📅 Processing date-of-birth step:', { data, dateOfBirth: state.dateOfBirth, gender: state.gender })
        
        const dobValue = data?.dateOfBirth || state.dateOfBirth
        const genderValue = data?.gender || state.gender
        
        if (!dobValue) {
          console.error('❌ No date of birth value provided!')
          return
        }
        
        if (!genderValue) {
          console.error('❌ No gender value provided!')
          return
        }
        
        await saveResponse('date_of_birth', dobValue)
        await saveResponse('gender', genderValue)
        setState(prev => ({ 
          ...prev, 
          dateOfBirth: dobValue,
          gender: genderValue,
          currentStep: 'motivations' 
        }))
        break

      case 'motivations':
        console.log('💪 Processing motivations step:', { data, stateValue: state.motivations })
        
        const motivationsValue = data?.motivations || state.motivations
        
        if (!motivationsValue || (Array.isArray(motivationsValue) && motivationsValue.length === 0)) {
          console.error('❌ No motivations value provided!')
          return
        }
        
        await saveResponse('motivations', motivationsValue)
        setState(prev => ({ 
          ...prev, 
          motivations: motivationsValue,
          currentStep: 'account' 
        }))
        break

      case 'account':
        try {
          console.log('Creating patient account and saving onboarding data...')
          
          // Create the patient account
          const signupResult = await authService.signUp({
            email: state.accountData.email,
            password: state.accountData.password,
            firstName: 'Patient', // Default for now
            lastName: 'User',     // Default for now
            role: 'patient'
          })

          if (signupResult.error) {
            console.error('❌ Failed to create account:', signupResult.error)
            alert('Failed to create account. Please try again.')
            return
          }

          console.log('✅ Account created successfully')
          
          // Save onboarding data to patient record if we have a user ID
          if (signupResult.data?.user?.id) {
            try {
              // Find the patient record created by the auth trigger
              const { data: patients, error: findError } = await supabase
                .from('patients')
                .select('id')
                .eq('profile_id', signupResult.data.user.id)
                .single()

              if (findError || !patients) {
                console.error('❌ Failed to find patient record:', findError)
                throw new Error('Patient record not found')
              }

              // Get all temporary onboarding data
              const tempData = patientOnboardingService.getTemporaryData()
              
              // Calculate BMI for completed data
              const bmi = calculateBMI(state.heightFeet, state.heightInches, state.weight)
              
              // Combine with current state data
              const allOnboardingData = {
                ...tempData,
                date_of_birth: state.dateOfBirth,
                gender: state.gender,
                motivations: state.motivations,
                // Add BMI if height/weight are available
                ...(bmi && { bmi }),
                // Add current onboarding step for resuming
                current_onboarding_step: 'health-history-transition'
              }

              // Save all pre-account onboarding responses to patient record
              const { error: saveError } = await supabase
                .from('patients')
                .update(allOnboardingData)
                .eq('id', patients.id)

              if (saveError) {
                console.error('❌ Failed to save onboarding data:', saveError)
                throw saveError
              }

              console.log('✅ Pre-account onboarding data saved to patient record:', patients.id)
              console.log('Saved data:', allOnboardingData)
              
              // Clear temporary data after saving
              patientOnboardingService.clearTemporaryData()
            } catch (error) {
              console.error('❌ Failed to save onboarding data:', error)
              // Continue anyway since account was created
            }
          }
          
          // Continue to extended health assessment
          setState(prev => ({ ...prev, currentStep: 'health-history-transition' }))
        } catch (error) {
          console.error('❌ Account creation failed:', error)
          alert('Failed to create account. Please try again.')
        }
        break

      case 'health-history-transition':
        setState(prev => ({ ...prev, currentStep: 'height-weight' }))
        break

      case 'height-weight':
        await saveResponse('height_feet', data?.heightFeet || state.heightFeet)
        await saveResponse('height_inches', data?.heightInches || state.heightInches)
        await saveResponse('weight', data?.weight || state.weight)
        setState(prev => ({
          ...prev,
          heightFeet: data?.heightFeet || state.heightFeet,
          heightInches: data?.heightInches || state.heightInches,
          weight: data?.weight || state.weight,
          currentStep: 'activity-level'
        }))
        break

      case 'activity-level':
        await saveResponse('activity_level', data?.activityLevel || state.activityLevel)
        setState(prev => ({
          ...prev,
          activityLevel: data?.activityLevel || state.activityLevel,
          currentStep: 'eating-disorders'
        }))
        break

      case 'eating-disorders':
        await saveResponse('eating_disorders', data?.eatingDisorders || state.eatingDisorders)
        setState(prev => ({
          ...prev,
          eatingDisorders: data?.eatingDisorders || state.eatingDisorders,
          currentStep: 'mental-health'
        }))
        break

      case 'mental-health':
        await saveResponse('mental_health', data?.mentalHealth || state.mentalHealth)
        setState(prev => ({
          ...prev,
          mentalHealth: data?.mentalHealth || state.mentalHealth,
          currentStep: 'self-harm-screening'
        }))
        break

      case 'self-harm-screening':
        await saveResponse('self_harm_screening', data?.selfHarmScreening || state.selfHarmScreening)
        setState(prev => ({
          ...prev,
          selfHarmScreening: data?.selfHarmScreening || state.selfHarmScreening,
          currentStep: 'diagnosed-conditions'
        }))
        break

      case 'diagnosed-conditions':
        await saveResponse('diagnosed_conditions', data?.diagnosedConditions || state.diagnosedConditions)
        setState(prev => ({
          ...prev,
          diagnosedConditions: data?.diagnosedConditions || state.diagnosedConditions,
          currentStep: 'chronic-diseases'
        }))
        break

      case 'chronic-diseases':
        await saveResponse('chronic_diseases', data?.chronicDiseases || state.chronicDiseases)
        setState(prev => ({
          ...prev,
          chronicDiseases: data?.chronicDiseases || state.chronicDiseases,
          currentStep: 'family-medical-history'
        }))
        break

      case 'family-medical-history':
        await saveResponse('family_medical_history', data?.familyMedicalHistory || state.familyMedicalHistory)
        setState(prev => ({
          ...prev,
          familyMedicalHistory: data?.familyMedicalHistory || state.familyMedicalHistory,
          currentStep: 'family-health'
        }))
        break

      case 'family-health':
        await saveResponse('family_health', data?.familyHealth || state.familyHealth)
        setState(prev => ({
          ...prev,
          familyHealth: data?.familyHealth || state.familyHealth,
          currentStep: 'medication-history'
        }))
        break

      case 'medication-history':
        await saveResponse('medication_history', data?.medicationHistory || state.medicationHistory)
        setState(prev => ({
          ...prev,
          medicationHistory: data?.medicationHistory || state.medicationHistory,
          currentStep: 'procedures'
        }))
        break

      case 'procedures':
        await saveResponse('procedures', data?.procedures || state.procedures)
        setState(prev => ({
          ...prev,
          procedures: data?.procedures || state.procedures,
          currentStep: 'supplements'
        }))
        break

      case 'supplements':
        await saveResponse('supplements', data?.supplements || state.supplements)
        setState(prev => ({
          ...prev,
          supplements: data?.supplements || state.supplements,
          currentStep: 'allergies'
        }))
        break

      case 'allergies':
        await saveResponse('allergies', data?.allergies || state.allergies)
        setState(prev => ({
          ...prev,
          allergies: data?.allergies || state.allergies,
          currentStep: 'drinking'
        }))
        break

      case 'drinking':
        await saveResponse('drinking', data?.drinking || state.drinking)
        setState(prev => ({
          ...prev,
          drinking: data?.drinking || state.drinking,
          currentStep: 'drugs'
        }))
        break

      case 'drugs':
        await saveResponse('drugs', data?.drugs || state.drugs)
        setState(prev => ({
          ...prev,
          drugs: data?.drugs || state.drugs,
          currentStep: 'smoking'
        }))
        break

      case 'smoking':
        await saveResponse('smoking', data?.smoking || state.smoking)
        setState(prev => ({
          ...prev,
          smoking: data?.smoking || state.smoking,
          currentStep: 'heart-rate'
        }))
        break

      case 'heart-rate':
        await saveResponse('heart_rate', data?.heartRate || state.heartRate)
        setState(prev => ({
          ...prev,
          heartRate: data?.heartRate || state.heartRate,
          currentStep: 'gastrointestinal'
        }))
        break

      case 'gastrointestinal':
        await saveResponse('gastrointestinal', data?.gastrointestinal || state.gastrointestinal)
        setState(prev => ({
          ...prev,
          gastrointestinal: data?.gastrointestinal || state.gastrointestinal,
          currentStep: 'side-effects'
        }))
        break

      case 'side-effects':
        await saveResponse('side_effects', data?.sideEffects || state.sideEffects)
        setState(prev => ({
          ...prev,
          sideEffects: data?.sideEffects || state.sideEffects,
          currentStep: 'side-effect-guidance'
        }))
        break

      case 'side-effect-guidance':
        await saveResponse('side_effect_guidance', data?.sideEffectGuidance || state.sideEffectGuidance)
        setState(prev => ({
          ...prev,
          sideEffectGuidance: data?.sideEffectGuidance || state.sideEffectGuidance,
          currentStep: 'challenges'
        }))
        break

      case 'challenges':
        await saveResponse('challenges', data?.challenges || state.challenges)
        setState(prev => ({
          ...prev,
          challenges: data?.challenges || state.challenges,
          currentStep: 'challenges-elaborate'
        }))
        break

      case 'challenges-elaborate':
        await saveResponse('challenges_elaborate', data?.challengesElaborate || state.challengesElaborate)
        setState(prev => ({
          ...prev,
          challengesElaborate: data?.challengesElaborate || state.challengesElaborate,
          currentStep: 'program-adherence'
        }))
        break

      case 'program-adherence':
        await saveResponse('program_adherence', data?.programAdherence || state.programAdherence)
        setState(prev => ({
          ...prev,
          programAdherence: data?.programAdherence || state.programAdherence,
          currentStep: 'program-consistency'
        }))
        break

      case 'program-consistency':
        await saveResponse('program_consistency', data?.programConsistency || state.programConsistency)
        setState(prev => ({
          ...prev,
          programConsistency: data?.programConsistency || state.programConsistency,
          currentStep: 'gastrointestinal-dosing'
        }))
        break

      case 'gastrointestinal-dosing':
        await saveResponse('gastrointestinal_dosing', data?.gastrointestinalDosing || state.gastrointestinalDosing)
        setState(prev => ({
          ...prev,
          gastrointestinalDosing: data?.gastrointestinalDosing || state.gastrointestinalDosing,
          currentStep: 'energy-dosing'
        }))
        break

      case 'energy-dosing':
        await saveResponse('energy_dosing', data?.energyDosing || state.energyDosing)
        setState(prev => ({
          ...prev,
          energyDosing: data?.energyDosing || state.energyDosing,
          currentStep: 'muscle-loss-dosing'
        }))
        break

      case 'muscle-loss-dosing':
        await saveResponse('muscle_loss_dosing', data?.muscleLossDosing || state.muscleLossDosing)
        setState(prev => ({
          ...prev,
          muscleLossDosing: data?.muscleLossDosing || state.muscleLossDosing,
          currentStep: 'additional'
        }))
        break

      case 'additional':
        await saveResponse('additional_info', data?.additionalInfo || state.additionalInfo)
        setState(prev => ({
          ...prev,
          additionalInfo: data?.additionalInfo || state.additionalInfo,
          currentStep: 'recommendations'
        }))
        break

      case 'recommendations':
        setState(prev => ({ ...prev, currentStep: 'recommendation-transition' }))
        break


      case 'recommendation-transition':
        // Calculate and save BMI before completing onboarding
        const finalBmi = calculateBMI(state.heightFeet, state.heightInches, state.weight)
        if (finalBmi) {
          await saveResponse('bmi', finalBmi)
        }
        
        // Mark onboarding as completed with timestamp
        await saveResponse('onboarding_completed_at', new Date().toISOString())
        await saveResponse('has_completed_intake', true)
        
        navigate('/patient/dashboard')
        break
    }
  }

  const renderCurrentStep = () => {
    const progress = getProgress()

    switch (state.currentStep) {
      case 'path':
        return (
          <PathEntry
            progress={progress}
            onAreasSelect={(paths) => setState(prev => ({ ...prev, selectedPath: paths }))}
            onContinue={() => handleNextStep()}
            onSignInClick={() => navigate('/patient/login')}
          />
        )

      case 'weight-goal':
        return (
          <WeightLossOnboardingEntry
            progress={progress}
            onGoalSelect={(goal) => handleNextStep({ selectedGoal: goal })}
            onSignInClick={() => navigate('/patient/login')}
          />
        )

      case 'medication-preference':
        return (
          <WeightLossMedicationPreference
            progress={progress}
            onPreferenceSelect={(preference) => handleNextStep({ preference })}
            onSignInClick={() => navigate('/patient/login')}
          />
        )

      case 'transition':
        const transitionMessage = state.medicationPreference === 'yes-specific' 
          ? "Great, you came prepared!\nLet's keep going to find which treatment option matches your goals and health history."
          : "Great, we'll find the perfect treatment for you.\nLet's start with some questions about your health history and goals."
        
        return (
          <Transition
            message={transitionMessage}
            onContinue={() => handleNextStep()}
          />
        )

      case 'state':
        return (
          <StateSelection
            progress={progress}
            onStateSelect={(selectedState) => setState(prev => ({ ...prev, selectedState }))}
            onContinue={() => handleNextStep()}
            onSignInClick={() => navigate('/patient/login')}
          />
        )

      case 'date-of-birth':
        return (
          <DateOfBirth
            progress={progress}
            onDateOfBirthChange={(dateOfBirth) => setState(prev => ({ ...prev, dateOfBirth }))}
            onGenderChange={(gender) => setState(prev => ({ ...prev, gender }))}
            onContinue={() => handleNextStep()}
            onSignInClick={() => navigate('/patient/login')}
          />
        )

      case 'motivations':
        return (
          <WeightLossMotivations
            progress={progress}
            onMotivationsSelect={(motivations) => setState(prev => ({ ...prev, motivations }))}
            onContinue={() => handleNextStep()}
            onSignInClick={() => navigate('/patient/login')}
          />
        )

      case 'account':
        return (
          <AccountCreation
            progress={progress}
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
            onContinue={() => handleNextStep()}
            onSignInClick={() => navigate('/patient/login')}
          />
        )

      case 'health-history-transition':
        return (
          <Transition
            message={`Congratulations! Your health assessment is complete 🎉
Welcome to your personalized weight loss journey.`}
            onContinue={() => handleNextStep()}
          />
        )

      case 'height-weight':
        return (
          <HeightWeight
            progress={progress}
            heightFeet={state.heightFeet}
            heightInches={state.heightInches}
            weight={state.weight}
            onHeightFeetChange={(feet) => setState(prev => ({ ...prev, heightFeet: feet }))}
            onHeightInchesChange={(inches) => setState(prev => ({ ...prev, heightInches: inches }))}
            onWeightChange={(weight) => setState(prev => ({ ...prev, weight }))}
            onContinue={() => handleNextStep()}
            onSignInClick={() => navigate('/patient/login')}
          />
        )

      case 'activity-level':
        return (
          <ActivityLevelSelection
            progress={progress}
            selectedLevel={state.activityLevel}
            onLevelSelect={(level) => setState(prev => ({ ...prev, activityLevel: level }))}
            onContinue={() => handleNextStep()}
            onSignInClick={() => navigate('/patient/login')}
          />
        )

      case 'eating-disorders':
        return (
          <EatingDisordersScreening
            progress={progress}
            selectedSymptoms={state.eatingDisorders}
            onSymptomsSelect={(symptoms) => setState(prev => ({ ...prev, eatingDisorders: symptoms }))}
            onContinue={() => handleNextStep()}
            onSignInClick={() => navigate('/patient/login')}
          />
        )

      case 'mental-health':
        return (
          <MentalHealthScreening
            progress={progress}
            selectedOption={state.mentalHealth[0] || ''}
            onMentalHealthSelect={(option) => setState(prev => ({ ...prev, mentalHealth: [option] }))}
            onContinue={() => handleNextStep()}
            onSignInClick={() => navigate('/patient/login')}
          />
        )

      case 'self-harm-screening':
        return (
          <MentalHealthScreening
            progress={progress}
            title="Do you currently have any desire to harm yourself or others?"
            description="We ask so your provider can have a complete understanding of your current health and determine which treatment might be correct for you."
            selectedOption={state.selfHarmScreening[0] || ''}
            onMentalHealthSelect={(option) => setState(prev => ({ ...prev, selfHarmScreening: [option] }))}
            onContinue={() => handleNextStep()}
            onSignInClick={() => navigate('/patient/login')}
          />
        )

      case 'diagnosed-conditions':
        return (
          <DiagnosedConditionsScreening
            progress={progress}
            selectedConditions={state.diagnosedConditions}
            onConditionsSelect={(conditions) => setState(prev => ({ ...prev, diagnosedConditions: conditions }))}
            onContinue={() => handleNextStep()}
            onSignInClick={() => navigate('/patient/login')}
          />
        )

      case 'chronic-diseases':
        return (
          <MentalHealthScreening
            progress={progress}
            title="Do you have any medical conditions or chronic diseases?"
            description="This helps your provider get a complete understanding of your medical history. Include any conditions impacting your blood pressure, heart, kidneys (including kidney stones) or liver, and any diseases such as diabetes, high cholesterol, stroke, cancer, or gout."
            selectedOption={state.chronicDiseases}
            onMentalHealthSelect={(option) => setState(prev => ({ ...prev, chronicDiseases: option }))}
            onContinue={() => handleNextStep()}
            onSignInClick={() => navigate('/patient/login')}
          />
        )

      case 'family-medical-history':
        return (
          <DiagnosedConditionsScreening
            progress={progress}
            title="Have you or a family member ever been diagnosed with any of the following conditions?"
            description="Some conditions can determine which treatments are right for you"
            conditions={familyMedicalHistoryConditions}
            selectedConditions={state.familyMedicalHistory}
            onConditionsSelect={(conditions) => setState(prev => ({ ...prev, familyMedicalHistory: conditions }))}
            onContinue={() => handleNextStep()}
            onSignInClick={() => navigate('/patient/login')}
          />
        )

      case 'family-health':
        return (
          <MentalHealthScreening
            progress={progress}
            title="Has a close family member under the age of 40 passed away unexpectedly?"
            description="Close family members can be a parent, sibling or child. We ask so your provider can determine the appropriate treatment for you."
            selectedOption={state.familyHealth}
            onMentalHealthSelect={(option) => setState(prev => ({ ...prev, familyHealth: option }))}
            onContinue={() => handleNextStep()}
            onSignInClick={() => navigate('/patient/login')}
          />
        )

      case 'medication-history':
        return (
          <MedicationHistoryScreening
            progress={progress}
            selectedOptions={state.medicationHistory}
            onOptionsSelect={(options) => setState(prev => ({ ...prev, medicationHistory: options }))}
            onContinue={() => handleNextStep()}
            onSignInClick={() => navigate('/patient/login')}
          />
        )

      case 'procedures':
        return (
          <MentalHealthScreening
            progress={progress}
            title="Have you had any surgeries or medical procedures?"
            description="This helps your caregiver get a complete understanding of your medical history so they can recommend the best treatment for you."
            selectedOption={state.procedures}
            onMentalHealthSelect={(option) => setState(prev => ({ ...prev, procedures: option }))}
            onContinue={() => handleNextStep()}
            onSignInClick={() => navigate('/patient/login')}
          />
        )

      case 'supplements':
        return (
          <MentalHealthScreening
            progress={progress}
            title="Do you currently take any medications or supplements?"
            selectedOption={state.supplements}
            onMentalHealthSelect={(option) => setState(prev => ({ ...prev, supplements: option }))}
            onContinue={() => handleNextStep()}
            onSignInClick={() => navigate('/patient/login')}
          />
        )

      case 'allergies':
        return (
          <MentalHealthScreening
            progress={progress}
            title="Do you have any allergies?"
            description="Include any allergies to food, dyes, prescriptions or over the counter medications, herbs, vitamins, supplements, or anything else."
            selectedOption={state.allergies}
            onMentalHealthSelect={(option) => setState(prev => ({ ...prev, allergies: option }))}
            onContinue={() => handleNextStep()}
            onSignInClick={() => navigate('/patient/login')}
          />
        )

      case 'drinking':
        return (
          <MedicationHistoryScreening
            progress={progress}
            title="How often do you consume 5 or more alcoholic drinks in one occasion?"
            description="Sometimes alcohol can impact effectiveness of certain medications and it's important for your provider to know to give you the best guidance."
            selectedOptions={state.drinking ? [state.drinking] : []}
            onOptionsSelect={(options) => setState(prev => ({ ...prev, drinking: options[0] || '' }))}
            onContinue={() => handleNextStep()}
            onSignInClick={() => navigate('/patient/login')}
            options={alcoholFrequencyOptions}
          />
        )

      case 'drugs':
        return (
          <MedicationHistoryScreening
            progress={progress}
            title="Have you taken any of the following recreational drugs in the past 6 months?"
            description="We ask so your provider can have a complete understanding of your current health and determine which treatment might be right for you."
            selectedOptions={state.drugs}
            onOptionsSelect={(options) => setState(prev => ({ ...prev, drugs: options }))}
            onContinue={() => handleNextStep()}
            onSignInClick={() => navigate('/patient/login')}
            options={recreationalDrugOptions}
          />
        )

      case 'smoking':
        return (
          <MedicationHistoryScreening
            progress={progress}
            title="Are you currently using any nicotine replacement products to help you stop smoking?"
            description="We ask to make sure there aren't any interactions with potential treatments."
            selectedOptions={state.smoking ? [state.smoking] : []}
            onOptionsSelect={(options) => setState(prev => ({ ...prev, smoking: options[0] || '' }))}
            onContinue={() => handleNextStep()}
            onSignInClick={() => navigate('/patient/login')}
            options={yesNoOptions}
          />
        )

      case 'heart-rate':
        return (
          <MedicationHistoryScreening
            progress={progress}
            title="What is your average resting heart rate?"
            description="You can find your average resting heart rate manually or by owning a wearable like an Apple Watch or an Oura Ring."
            selectedOptions={state.heartRate ? [state.heartRate] : []}
            onOptionsSelect={(options) => setState(prev => ({ ...prev, heartRate: options[0] || '' }))}
            onContinue={() => handleNextStep()}
            onSignInClick={() => navigate('/patient/login')}
            options={heartRateOptions}
          />
        )

      case 'gastrointestinal':
        return (
          <MedicationHistoryScreening
            progress={progress}
            title="Do you ever experience any of these gastrointestinal symptoms?"
            description="A licensed provider may be able to help you manage side effects with a personalized treatment plan."
            selectedOptions={state.gastrointestinal}
            onOptionsSelect={(options) => setState(prev => ({ ...prev, gastrointestinal: options }))}
            onContinue={() => handleNextStep()}
            onSignInClick={() => navigate('/patient/login')}
            options={gastrointestinalSymptomsOptions}
          />
        )

      case 'side-effects':
        return (
          <MedicationHistoryScreening
            progress={progress}
            title="Do you tend to experience any of these side effects when you start new medications or supplements?"
            description="A licensed provider can help you manage side effects with a personalized treatment plan. Select all that apply to you."
            options={sideEffectsOptions}
            multiSelect={true}
            selectedOptions={state.sideEffects}
            onOptionsSelect={(options) => setState(prev => ({ ...prev, sideEffects: options }))}
            onContinue={() => handleNextStep()}
            onSignInClick={() => navigate('/patient/login')}
          />
        )

      case 'side-effect-guidance':
        return (
          <MedicationHistoryScreening
            progress={progress}
            title="Would you be interested in your provider considering a personalized treatment plan that could help manage these side effects"
            description="Select all that apply to you."
            options={treatmentPlanOptions}
            multiSelect={true}
            onOptionsSelect={(options) => setState(prev => ({ ...prev, sideEffectGuidance: options }))}
            onContinue={() => handleNextStep()}
            onSignInClick={() => navigate('/patient/login')}
          />
        )

      case 'challenges':
        return (
          <MedicationHistoryScreening
            progress={progress}
            title="What's the hardest thing about losing weight for you?"
            description="Select all that apply to you."
            options={weightLossChallengesOptions}
            multiSelect={true}
            onOptionsSelect={(challenges) => setState(prev => ({ ...prev, challenges }))}
            onContinue={() => handleNextStep()}
            onSignInClick={() => navigate('/patient/login')}
          />
        )

      case 'challenges-elaborate':
        return (
          <AdditionalInformation
            progress={progress}
            title="Tell us more about the hardest part of losing weight for you"
            placeholder="Tell us more"
            hideCheckbox={true}
            optional={true}
            onTextChange={(text) => setState(prev => ({ ...prev, challengesElaborate: text }))}
            onContinue={() => handleNextStep()}
            onSignInClick={() => navigate('/patient/login')}
          />
        )

      case 'program-adherence':
        return (
          <MedicationHistoryScreening
            progress={progress}
            title="Have you ever stopped a weight loss program before reaching your goal?"
            description=""
            options={weightLossProgramStoppedOptions}
            multiSelect={false}
            onOptionsSelect={(option) => setState(prev => ({ ...prev, programAdherence: [option as string] }))}
            onContinue={() => handleNextStep()}
            onSignInClick={() => navigate('/patient/login')}
          />
        )

      case 'program-consistency':
        return (
          <MedicationHistoryScreening
            progress={progress}
            title="What would make it easier for you to stick with a weight loss program?"
            description="Select all that apply."
            options={weightLossProgramEasierOptions}
            multiSelect={true}
            onOptionsSelect={(options) => setState(prev => ({ ...prev, programConsistency: options as string[] }))}
            onContinue={() => handleNextStep()}
            onSignInClick={() => navigate('/patient/login')}
          />
        )

      case 'gastrointestinal-dosing':
        return (
          <MedicationHistoryScreening
            progress={progress}
            title="Would you be interested in your provider considering a personalized dosage plan that can help manage gastrointestinal side effects like nausea, vomiting, constipation, and diarrhea?"
            description=""
            options={yesNoNotSureOptions}
            multiSelect={false}
            selectedOption={state.gastrointestinalDosing}
            onOptionsSelect={(option) => setState(prev => ({ ...prev, gastrointestinalDosing: option as string }))}
            onContinue={() => handleNextStep()}
            onSignInClick={() => navigate('/patient/login')}
          />
        )

      case 'energy-dosing':
        return (
          <MedicationHistoryScreening
            progress={progress}
            title="Would you be interested in your provider considering a personalized dosage plan that can help manage side effects like fatigue and energy loss?"
            description=""
            options={yesNoNotSureOptions}
            multiSelect={false}
            selectedOption={state.energyDosing}
            onOptionsSelect={(option) => setState(prev => ({ ...prev, energyDosing: option as string }))}
            onContinue={() => handleNextStep()}
            onSignInClick={() => navigate('/patient/login')}
          />
        )

      case 'muscle-loss-dosing':
        return (
          <MedicationHistoryScreening
            progress={progress}
            title="Would you be interested in your provider considering a personalized dosage plan that can help manage side effects like muscle loss?"
            description=""
            options={yesNoNotSureOptions}
            multiSelect={false}
            selectedOption={state.muscleLossDosing}
            onOptionsSelect={(option) => setState(prev => ({ ...prev, muscleLossDosing: option as string }))}
            onContinue={() => handleNextStep()}
            onSignInClick={() => navigate('/patient/login')}
          />
        )

      case 'additional':
        return (
          <AdditionalInformation
            progress={progress}
            additionalInfo={state.additionalInfo}
            onAdditionalInfoChange={(info) => setState(prev => ({ ...prev, additionalInfo: info }))}
            onContinue={() => handleNextStep()}
            onSignInClick={() => navigate('/patient/login')}
          />
        )

      case 'recommendations':
        const bmi = calculateBMI(state.heightFeet, state.heightInches, state.weight)
        return (
          <MedicationRecommendation
            progress={progress}
            heightFeet={state.heightFeet}
            heightInches={state.heightInches}
            weight={state.weight}
            bmi={bmi}
            onContinue={() => handleNextStep()}
          />
        )


      case 'recommendation-transition':
        return (
          <Transition
            message={`Great, all that's left is selecting a plan and the medications you'd like to discuss with your provider and scheduling your first visit.`}
            onContinue={() => handleNextStep()}
          />
        )

      default:
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Onboarding Complete!</h2>
              <p className="text-muted-foreground">Redirecting to dashboard...</p>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen">
      {renderCurrentStep()}
    </div>
  )
}