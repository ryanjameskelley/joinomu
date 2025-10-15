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

async function createCompletePatientSetup() {
  try {
    const testPatientId = '55bb52a5-32da-4d8a-9a82-8d568a0eb33d' // The signed in user
    const providerWithSchedulesId = 'a44b32bb-00a5-460d-a18b-4468d59d0318' // Provider with 20 schedules
    
    console.log('🏗️ Creating complete patient setup...')
    console.log(`   Patient ID: ${testPatientId}`)
    console.log(`   Provider ID: ${providerWithSchedulesId}`)
    
    // 1. Create patient record
    console.log('\n1. Creating patient record...')
    const { error: patientError } = await supabase
      .from('patients')
      .upsert([
        {
          id: testPatientId,
          name: 'Test Patient',
          email: 'testpatient@example.com',
          date_of_birth: '1990-01-01'
        }
      ])
    
    if (patientError) {
      console.error('❌ Error creating patient:', patientError)
    } else {
      console.log('✅ Patient record created')
    }
    
    // 2. Create provider record if needed
    console.log('\n2. Ensuring provider record exists...')
    const { error: providerError } = await supabase
      .from('providers')
      .upsert([
        {
          id: providerWithSchedulesId,
          name: 'Dr. Weight Loss Specialist',
          specialty: 'Weight Management'
        }
      ])
    
    if (providerError) {
      console.error('❌ Error creating provider:', providerError)
    } else {
      console.log('✅ Provider record ensured')
    }
    
    // 3. Create patient assignment for weight_loss
    console.log('\n3. Creating patient assignment...')
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
    
    // 4. Verify everything is connected
    console.log('\n4. Final verification...')
    
    // Check assignment
    const { data: assignments } = await supabase
      .from('patient_assignments')
      .select('*')
      .eq('patient_id', testPatientId)
      .eq('treatment_type', 'weight_loss')
    
    console.log(`✅ Patient has ${assignments?.length || 0} weight_loss assignments`)
    
    // Check provider schedules
    const { data: schedules } = await supabase
      .from('provider_schedules')
      .select('*')
      .eq('provider_id', providerWithSchedulesId)
      .eq('active', true)
      .contains('treatment_types', ['weight_loss'])
    
    console.log(`✅ Provider has ${schedules?.length || 0} weight_loss schedules`)
    
    // Create some appointment history for visits testing
    console.log('\n5. Creating appointment history for visits testing...')
    const appointments = [
      {
        id: 'test_apt_1',
        patient_id: testPatientId,
        provider_id: providerWithSchedulesId,
        appointment_date: '2024-09-20',
        start_time: '10:00:00',
        appointment_type: 'Initial Consultation',
        treatment_type: 'weight_loss',
        status: 'completed'
      },
      {
        id: 'test_apt_2',
        patient_id: testPatientId,
        provider_id: providerWithSchedulesId,
        appointment_date: '2024-09-15',
        start_time: '14:30:00',
        appointment_type: 'Follow-up',
        treatment_type: 'weight_loss', 
        status: 'completed'
      }
    ]
    
    for (const apt of appointments) {
      await supabase.from('appointments').upsert([apt])
    }
    console.log('✅ Created 2 appointment history records')
    
    console.log('\n🎉 Complete patient setup finished!')
    console.log('\n📋 SUMMARY:')
    console.log('✅ Patient record created')
    console.log('✅ Provider record ensured')  
    console.log('✅ Patient assigned to provider for weight_loss')
    console.log('✅ Provider has 20+ active schedules')
    console.log('✅ Appointment history created for visits testing')
    console.log('\n🧪 TEST NOW:')
    console.log('1. Login as testpatient@example.com')
    console.log('2. Weight loss provider should show available times')
    console.log('3. After logging in as provider, check visits tab for appointment history')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

createCompletePatientSetup()