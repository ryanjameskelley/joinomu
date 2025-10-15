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

async function fixProviderSchedule() {
  try {
    const actualProviderId = 'a44b32bb-00a5-460d-a18b-4468d59d0318' // The one being queried
    const testUserId = '55bb52a5-32da-4d8a-9a82-8d568a0eb33d' // The signed in user
    
    console.log('🔧 Fixing provider schedule for the correct provider...')
    console.log(`   Target provider: ${actualProviderId}`)
    console.log(`   Signed in user: ${testUserId}`)
    
    // 1. Set up the provider record for the actual provider ID
    console.log('\n🏥 Creating provider record...')
    await supabase.from('providers').upsert([{
      id: actualProviderId,
      name: 'Dr. Weight Loss Specialist',
      specialty: 'Weight Management'
    }])
    console.log('✅ Provider record created')
    
    // 2. Create provider schedule for the actual provider
    console.log('\n📅 Creating provider schedule...')
    const schedules = [
      { provider_id: actualProviderId, day_of_week: 1, start_time: '09:00:00', end_time: '17:00:00' }, // Monday
      { provider_id: actualProviderId, day_of_week: 2, start_time: '09:00:00', end_time: '17:00:00' }, // Tuesday
      { provider_id: actualProviderId, day_of_week: 3, start_time: '09:00:00', end_time: '17:00:00' }, // Wednesday
      { provider_id: actualProviderId, day_of_week: 4, start_time: '09:00:00', end_time: '17:00:00' }, // Thursday
      { provider_id: actualProviderId, day_of_week: 5, start_time: '09:00:00', end_time: '17:00:00' }  // Friday
    ]
    
    for (const schedule of schedules) {
      await supabase.from('provider_schedules').upsert([schedule])
    }
    console.log('✅ Provider schedule created (Mon-Fri 9AM-5PM)')
    
    // 3. Create availability overrides to block some time
    console.log('\n⏰ Creating availability overrides...')
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]
    
    const overrides = [
      {
        provider_id: actualProviderId,
        date: tomorrowStr,
        start_time: '10:00:00',
        end_time: '12:00:00',
        available: false,
        reason: 'Medical Conference'
      },
      {
        provider_id: actualProviderId,
        date: tomorrowStr,
        start_time: '14:00:00',
        end_time: '15:00:00',
        available: false,
        reason: 'Staff Meeting'
      }
    ]
    
    for (const override of overrides) {
      await supabase.from('provider_availability_overrides').upsert([override])
      console.log(`✅ Blocked: ${override.date} ${override.start_time}-${override.end_time} (${override.reason})`)
    }
    
    // 4. Verify the patient assignment exists
    console.log('\n📋 Checking patient assignment...')
    const { data: assignments, error: assignError } = await supabase
      .from('patient_assignments')
      .select('*')
      .eq('patient_id', testUserId)
      .eq('treatment_type', 'weight_loss')
    
    if (assignments && assignments.length > 0) {
      console.log(`✅ Found ${assignments.length} weight loss assignments`)
      assignments.forEach(assign => {
        console.log(`   Patient ${assign.patient_id} → Provider ${assign.provider_id}`)
      })
    } else {
      console.log('❌ No weight loss assignments found, creating one...')
      await supabase.from('patient_assignments').upsert([{
        patient_id: testUserId,
        provider_id: actualProviderId,
        treatment_type: 'weight_loss',
        assigned_date: new Date().toISOString().split('T')[0],
        is_primary: true
      }])
      console.log('✅ Patient assignment created')
    }
    
    console.log('\n🎉 Provider schedule fixed!')
    console.log('🔄 Try refreshing the app - weight loss provider should now show available times')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

fixProviderSchedule()