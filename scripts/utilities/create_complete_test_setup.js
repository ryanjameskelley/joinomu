const { createClient } = require('@supabase/supabase-js')

// Local Supabase configuration
const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const anonSupabase = createClient(supabaseUrl, supabaseAnonKey)
const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function createCompleteTestSetup() {
  try {
    console.log('🏗️  Creating complete test setup...\n')
    
    // 1. Create Patient User
    console.log('👤 Creating patient user...')
    const { data: patientAuth, error: patientAuthError } = await anonSupabase.auth.signUp({
      email: 'patient@test.com',
      password: 'password'
    })
    
    if (patientAuthError && !patientAuthError.message.includes('already registered')) {
      console.error('❌ Patient auth error:', patientAuthError.message)
      return
    }
    
    const patientId = patientAuth?.user?.id || 'existing-patient-id'
    console.log(`✅ Patient auth created: ${patientId}`)
    
    // Set patient profile
    await serviceSupabase.from('profiles').upsert([{
      id: patientId,
      email: 'patient@test.com',
      role: 'patient'
    }])
    console.log('✅ Patient profile set')
    
    // 2. Create Provider User  
    console.log('\n🩺 Creating provider user...')
    const { data: providerAuth, error: providerAuthError } = await anonSupabase.auth.signUp({
      email: 'provider@test.com',
      password: 'password'
    })
    
    if (providerAuthError && !providerAuthError.message.includes('already registered')) {
      console.error('❌ Provider auth error:', providerAuthError.message)
      return
    }
    
    const providerId = providerAuth?.user?.id || '1ca238a9-9547-41fb-851e-8eb0dcb92c82' // Use existing ID if signup failed
    console.log(`✅ Provider auth created: ${providerId}`)
    
    // Set provider profile
    await serviceSupabase.from('profiles').upsert([{
      id: providerId,
      email: 'provider@test.com', 
      role: 'provider'
    }])
    console.log('✅ Provider profile set')
    
    // 3. Create provider record with schedule
    console.log('\n🏥 Setting up provider record and schedule...')
    await serviceSupabase.from('providers').upsert([{
      id: providerId,
      name: 'Dr. Test Provider',
      specialty: 'Weight Management'
    }])
    console.log('✅ Provider record created')
    
    // Create provider schedule (Mon-Fri 9AM-5PM)
    const schedules = [
      { provider_id: providerId, day_of_week: 1, start_time: '09:00:00', end_time: '17:00:00' }, // Monday
      { provider_id: providerId, day_of_week: 2, start_time: '09:00:00', end_time: '17:00:00' }, // Tuesday
      { provider_id: providerId, day_of_week: 3, start_time: '09:00:00', end_time: '17:00:00' }, // Wednesday
      { provider_id: providerId, day_of_week: 4, start_time: '09:00:00', end_time: '17:00:00' }, // Thursday
      { provider_id: providerId, day_of_week: 5, start_time: '09:00:00', end_time: '17:00:00' }  // Friday
    ]
    
    for (const schedule of schedules) {
      await serviceSupabase.from('provider_schedules').upsert([schedule])
    }
    console.log('✅ Provider schedule created (Mon-Fri 9AM-5PM)')
    
    // 4. Assign provider to patient
    console.log('\n📋 Creating patient assignment...')
    await serviceSupabase.from('patient_assignments').upsert([{
      patient_id: patientId,
      provider_id: providerId,
      treatment_type: 'weight_loss',
      assigned_date: new Date().toISOString().split('T')[0],
      is_primary: true
    }])
    console.log('✅ Patient assigned to provider for weight loss')
    
    // 5. Create availability overrides (block some time)
    console.log('\n⏰ Creating availability overrides...')
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]
    
    const overrides = [
      {
        provider_id: providerId,
        date: tomorrowStr,
        start_time: '10:00:00',
        end_time: '12:00:00',
        available: false,
        reason: 'Medical Conference'
      },
      {
        provider_id: providerId,
        date: tomorrowStr,
        start_time: '14:00:00',
        end_time: '15:00:00',
        available: false,
        reason: 'Staff Meeting'
      }
    ]
    
    for (const override of overrides) {
      await serviceSupabase.from('provider_availability_overrides').upsert([override])
      console.log(`✅ Blocked: ${override.date} ${override.start_time}-${override.end_time} (${override.reason})`)
    }
    
    // 6. Add some medication preferences for testing
    console.log('\n💊 Adding medication preferences...')
    const medications = [
      {
        id: 'med_1',
        patient_id: patientId,
        medication_name: 'Semaglutide (Ozempic)',
        preferred_dosage: '1.0mg',
        frequency: 'Weekly',
        status: 'approved',
        requested_date: '2024-09-20'
      },
      {
        id: 'med_2', 
        patient_id: patientId,
        medication_name: 'Tirzepatide (Mounjaro)',
        preferred_dosage: '5.0mg',
        frequency: 'Weekly',
        status: 'pending',
        requested_date: '2024-09-25'
      }
    ]
    
    for (const med of medications) {
      await serviceSupabase.from('patient_medication_preferences').upsert([med])
    }
    console.log('✅ Medication preferences added')
    
    // 7. Create some appointment history for visits testing
    console.log('\n📅 Creating appointment history...')
    const appointments = [
      {
        id: 'apt_1',
        patient_id: patientId,
        provider_id: providerId,
        appointment_date: '2024-09-20',
        start_time: '10:00:00',
        appointment_type: 'Initial Consultation',
        treatment_type: 'weight_loss',
        status: 'completed'
      },
      {
        id: 'apt_2',
        patient_id: patientId,
        provider_id: providerId,
        appointment_date: '2024-09-15',
        start_time: '14:30:00',
        appointment_type: 'Follow-up',
        treatment_type: 'weight_loss', 
        status: 'completed'
      },
      {
        id: 'apt_3',
        patient_id: patientId,
        provider_id: providerId,
        appointment_date: '2024-09-30',
        start_time: '11:00:00',
        appointment_type: 'Check-up',
        treatment_type: 'weight_loss',
        status: 'scheduled'
      }
    ]
    
    for (const apt of appointments) {
      await serviceSupabase.from('appointments').upsert([apt])
    }
    console.log('✅ Appointment history created')
    
    console.log('\n🎉 Complete test setup finished!')
    console.log('\n📋 LOGIN CREDENTIALS:')
    console.log('👤 Patient: patient@test.com / password')
    console.log('🩺 Provider: provider@test.com / password')
    console.log('\n🧪 TESTING STEPS:')
    console.log('1. Login as provider@test.com')
    console.log('2. You should see the test patient in your dashboard')
    console.log('3. Click on the patient to open information dialog')
    console.log('4. Navigate to "Visits" tab to see appointment history')
    console.log('5. Test booking new appointments (some times will be blocked)')
    console.log('\nProvider has schedule Mon-Fri 9AM-5PM with some blocked times tomorrow.')
    
  } catch (error) {
    console.error('❌ Setup error:', error)
  }
}

createCompleteTestSetup()