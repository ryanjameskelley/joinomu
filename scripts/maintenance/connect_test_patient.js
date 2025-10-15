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

async function connectTestPatient() {
  try {
    const testPatientId = 'fe5fee47-896d-4ac7-ba2b-d35ef4589eee' // Known working patient
    const providerWithSchedulesId = 'a44b32bb-00a5-460d-a18b-4468d59d0318' // Provider with 20 schedules
    
    console.log('🔗 Connecting test patient to provider with schedules...')
    console.log(`   Patient: ${testPatientId} (testpatient@example.com)`)
    console.log(`   Provider: ${providerWithSchedulesId}`)
    
    // 1. Assign the test patient to the provider with schedules
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
    
    // 2. Verify everything is connected
    console.log('\n2. Final verification...')
    
    // Check the test patient has the assignment
    const { data: assignments } = await supabase
      .from('patient_assignments')
      .select('*')
      .eq('patient_id', testPatientId)
      .eq('treatment_type', 'weight_loss')
    
    console.log(`✅ Test patient has ${assignments?.length || 0} weight_loss assignments`)
    
    // Check the provider has schedules
    const { data: schedules } = await supabase
      .from('provider_schedules')
      .select('*')
      .eq('provider_id', providerWithSchedulesId)
      .eq('active', true)
      .contains('treatment_types', ['weight_loss'])
    
    console.log(`✅ Provider has ${schedules?.length || 0} weight_loss schedules`)
    
    console.log('\n🎉 Connection complete!')
    console.log('\n📋 READY TO TEST:')
    console.log('🔑 Login: testpatient@example.com / password')
    console.log('⏰ The weight loss provider should now show available appointment times!')
    console.log('📅 Provider has extensive availability (20+ time slots)')
    console.log('🩺 After booking appointments, test the visits component in provider view')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

connectTestPatient()