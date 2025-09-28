const { createClient } = require('@supabase/supabase-js')

// Local Supabase configuration
const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function checkAssignments() {
  try {
    const newPatientAuthId = 'e6845f2d-7194-45ff-97a0-445c4cd00030'
    const newProviderAuthId = 'ede2c3be-6264-4601-b239-39836f10bc37'
    
    console.log('🔍 Checking patient-provider assignments...\n')
    
    // 1. Check if new patient has assignments
    console.log('1. Checking new patient assignments:')
    const { data: patientAssignments, error: patientError } = await supabase
      .from('patient_assignments')
      .select('*')
      .eq('patient_id', newPatientAuthId)
    
    if (patientError) {
      console.error('❌ Error checking patient assignments:', patientError)
    } else {
      console.log(`   Patient ${newPatientAuthId} has ${patientAssignments.length} assignments:`)
      patientAssignments.forEach(assign => {
        console.log(`   - Provider: ${assign.provider_id}, Treatment: ${assign.treatment_type}, Primary: ${assign.is_primary}`)
      })
    }
    
    // 2. Check if new provider has patients assigned
    console.log('\n2. Checking new provider assignments:')
    const { data: providerAssignments, error: providerError } = await supabase
      .from('patient_assignments')
      .select('*')
      .eq('provider_id', newProviderAuthId)
    
    if (providerError) {
      console.error('❌ Error checking provider assignments:', providerError)
    } else {
      console.log(`   Provider ${newProviderAuthId} has ${providerAssignments.length} patients:`)
      providerAssignments.forEach(assign => {
        console.log(`   - Patient: ${assign.patient_id}, Treatment: ${assign.treatment_type}, Primary: ${assign.is_primary}`)
      })
    }
    
    // 3. Check provider schedules
    console.log('\n3. Checking provider schedules:')
    const { data: schedules, error: schedError } = await supabase
      .from('provider_schedules')
      .select('*')
      .eq('provider_id', newProviderAuthId)
      .eq('active', true)
      .contains('treatment_types', ['weight_loss'])
    
    if (schedError) {
      console.error('❌ Error checking schedules:', schedError)
    } else {
      console.log(`   Provider has ${schedules.length} weight_loss schedules`)
    }
    
    // 4. Create assignment if missing
    if (patientAssignments.length === 0 || providerAssignments.length === 0) {
      console.log('\n4. ⚠️ Missing assignment! Creating it now...')
      
      const { error: createError } = await supabase
        .from('patient_assignments')
        .upsert([
          {
            patient_id: newPatientAuthId,
            provider_id: newProviderAuthId,
            treatment_type: 'weight_loss',
            assigned_date: new Date().toISOString().split('T')[0],
            is_primary: true
          }
        ])
      
      if (createError) {
        console.error('❌ Error creating assignment:', createError)
      } else {
        console.log('✅ Patient-provider assignment created!')
      }
    }
    
    // 5. Final verification
    console.log('\n5. Final verification:')
    const { data: finalCheck } = await supabase
      .from('patient_assignments')
      .select('*')
      .eq('patient_id', newPatientAuthId)
      .eq('provider_id', newProviderAuthId)
      .eq('treatment_type', 'weight_loss')
    
    if (finalCheck && finalCheck.length > 0) {
      console.log('✅ ASSIGNMENT CONFIRMED:')
      console.log(`   Patient: ${newPatientAuthId} (patient.connected@test.com)`)
      console.log(`   Provider: ${newProviderAuthId} (provider.connected@test.com)`)
      console.log(`   Treatment: weight_loss`)
      console.log(`   Primary: ${finalCheck[0].is_primary}`)
      
      console.log('\n🎯 READY TO TEST:')
      console.log('📧 Login as patient.connected@test.com - should see weight loss provider with times')
      console.log('🩺 Login as provider.connected@test.com - should see assigned patients')
      
    } else {
      console.log('❌ Assignment still missing - there may be a constraint issue')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkAssignments()