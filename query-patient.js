#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function queryPatientData() {
  try {
    const patientId = '08c4dae6-04e0-4f2b-906d-738bf72dba2f'
    
    const { data, error } = await supabase
      .from('patients')
      .select(`
        id,
        profile_id,
        date_of_birth,
        phone,
        has_completed_intake,
        treatment_preferences,
        weight_loss_goals,
        medication_preference,
        transition_answer,
        selected_state,
        gender,
        motivations,
        height_feet,
        height_inches,
        weight,
        activity_level,
        eating_disorders,
        mental_health,
        diagnosed_conditions,
        chronic_diseases,
        family_medical_history,
        medication_history,
        allergies,
        drinking,
        drugs,
        smoking,
        heart_rate,
        gastrointestinal,
        challenges,
        program_adherence,
        bmi,
        medication_qualified,
        onboarding_completed_at,
        current_onboarding_step,
        created_at,
        updated_at
      `)
      .eq('id', patientId)
      .single()

    if (error) {
      console.error('❌ Error querying patient:', error)
      return
    }

    if (!data) {
      console.log('❌ No patient found with ID:', patientId)
      return
    }

    console.log('\n🔍 Patient Data Analysis for ID:', patientId)
    console.log('='.repeat(60))
    
    // Get profile data for name/email
    let profileData = null
    if (data.profile_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', data.profile_id)
        .single()
      profileData = profile
    }
    
    // Basic info
    console.log('\n📋 Basic Information:')
    console.log(`Name: ${profileData?.first_name || 'NULL'} ${profileData?.last_name || 'NULL'}`)
    console.log(`Email: ${profileData?.email || 'NULL'}`)
    console.log(`Profile ID: ${data.profile_id || 'NULL'}`)
    console.log(`DOB: ${data.date_of_birth || 'NULL'}`)
    console.log(`Phone: ${data.phone || 'NULL'}`)
    console.log(`Created: ${data.created_at || 'NULL'}`)
    console.log(`Updated: ${data.updated_at || 'NULL'}`)
    
    // Onboarding status
    console.log('\n📊 Onboarding Status:')
    console.log(`Completed: ${data.onboarding_completed_at || 'NULL'}`)
    console.log(`Current Step: ${data.current_onboarding_step || 'NULL'}`)
    
    // Count null/empty fields
    let nullFields = []
    let filledFields = []
    
    const fieldsToCheck = [
      'date_of_birth', 'phone', 'has_completed_intake',
      'treatment_preferences', 'weight_loss_goals', 'medication_preference', 
      'transition_answer', 'selected_state', 'gender', 'motivations',
      'height_feet', 'height_inches', 'weight', 'activity_level',
      'eating_disorders', 'mental_health', 'diagnosed_conditions',
      'chronic_diseases', 'family_medical_history', 'medication_history',
      'allergies', 'drinking', 'drugs', 'smoking', 'heart_rate',
      'gastrointestinal', 'challenges', 'program_adherence', 'bmi',
      'medication_qualified'
    ]
    
    fieldsToCheck.forEach(field => {
      const value = data[field]
      if (value === null || value === undefined || value === '' || 
          (Array.isArray(value) && value.length === 0)) {
        nullFields.push(field)
      } else {
        filledFields.push({ field, value })
      }
    })
    
    console.log('\n❌ NULL/Empty Fields (' + nullFields.length + ' total):')
    nullFields.forEach(field => console.log(`  - ${field}`))
    
    console.log('\n✅ Filled Fields (' + filledFields.length + ' total):')
    filledFields.forEach(({ field, value }) => {
      let displayValue = value
      if (Array.isArray(value)) {
        displayValue = `[${value.join(', ')}]`
      }
      console.log(`  - ${field}: ${displayValue}`)
    })
    
    // Analysis
    console.log('\n🧐 Analysis:')
    console.log(`Total fields checked: ${fieldsToCheck.length}`)
    console.log(`Filled fields: ${filledFields.length} (${Math.round(filledFields.length / fieldsToCheck.length * 100)}%)`)
    console.log(`Empty fields: ${nullFields.length} (${Math.round(nullFields.length / fieldsToCheck.length * 100)}%)`)
    
    if (nullFields.length > filledFields.length) {
      console.log('\n⚠️  More than half the fields are empty - this suggests a systemic issue with data persistence during onboarding.')
    }
    
  } catch (err) {
    console.error('❌ Script error:', err)
  }
}

queryPatientData()