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

async function fixPatientAssignment() {
  try {
    const testPatientId = '55bb52a5-32da-4d8a-9a82-8d568a0eb33d' // The signed in user
    const providerWithSchedulesId = 'a44b32bb-00a5-460d-a18b-4468d59d0318' // Provider with 20 schedules
    
    console.log('🔧 Fixing patient assignment...')
    console.log(`   Patient: ${testPatientId}`)
    console.log(`   Provider: ${providerWithSchedulesId}`)
    
    // 1. Create patient assignment for weight_loss
    console.log('\n1. Creating patient assignment...')
    const { error: assignError } = await supabase
      .from('patient_assignments')
      .upsert([
        {
          patient_id: testPatientId,
          provider_id: providerWithSchedulesId,
          treatment_type: 'weight_loss',
          assigned_date: new Date().toISOString().split('T')[0],
          is_primary: true
        }
      ])
    
    if (assignError) {
      console.error('❌ Error creating assignment:', assignError)
    } else {
      console.log('✅ Patient assignment created')
    }
    
    // 2. Verify the assignment worked
    console.log('\n2. Verifying assignment...')
    const { data: assignments, error: verifyError } = await supabase
      .from('patient_assignments')
      .select('*')
      .eq('patient_id', testPatientId)
      .eq('treatment_type', 'weight_loss')
    
    if (verifyError) {
      console.error('❌ Error verifying assignment:', verifyError)
    } else {
      console.log(`✅ Found ${assignments.length} weight_loss assignments:`)
      assignments.forEach(assign => {
        console.log(`   Patient: ${assign.patient_id} → Provider: ${assign.provider_id}`)
      })
    }
    
    // 3. Verify the provider has schedules
    console.log('\n3. Verifying provider schedules...')
    const { data: schedules, error: schedError } = await supabase
      .from('provider_schedules')
      .select('*')
      .eq('provider_id', providerWithSchedulesId)
      .eq('active', true)
      .contains('treatment_types', ['weight_loss'])
    
    if (schedError) {
      console.error('❌ Error getting schedules:', schedError)
    } else {
      console.log(`✅ Provider has ${schedules.length} active weight_loss schedules`)
      if (schedules.length > 0) {
        console.log(`   Sample: Day ${schedules[0].day_of_week}, ${schedules[0].start_time}-${schedules[0].end_time}`)
      }
    }
    
    console.log('\n🎉 Patient assignment fixed!')
    console.log('📧 Login as the test patient and you should now see available appointment times!')
    console.log('🔄 The provider should appear with bookable time slots')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

fixPatientAssignment()