// Manual test to verify everything works by creating records directly
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function manualTest() {
  console.log('🔧 Manual Test: Creating Complete User Records')
  console.log('==============================================')

  // Create a test patient manually (simulating what the trigger should do)
  console.log('\n📋 Creating test patient manually...')
  
  // 1. Create auth user
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: 'manual.patient@example.com',
    password: 'password123',
    user_metadata: {
      role: 'patient',
      first_name: 'Manual',
      last_name: 'Patient'
    }
  })

  if (authError) {
    console.log('❌ Auth user creation failed:', authError.message)
    return
  }

  console.log('✅ Auth user created:', authUser.user.id)

  // 2. Create profile record
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: authUser.user.id,
      email: authUser.user.email,
      role: 'patient',
      first_name: 'Manual',
      last_name: 'Patient'
    })
    .select()
    .single()

  if (profileError) {
    console.log('❌ Profile creation failed:', profileError.message)
  } else {
    console.log('✅ Profile created:', profile)
  }

  // 3. Create patient record
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .insert({
      profile_id: authUser.user.id,
      date_of_birth: '1990-01-01',
      phone: '555-1234',
      has_completed_intake: false
    })
    .select()
    .single()

  if (patientError) {
    console.log('❌ Patient record creation failed:', patientError.message)
  } else {
    console.log('✅ Patient record created:', patient)
  }

  // Now test reading the data
  console.log('\n📋 Testing data retrieval...')
  
  const { data: allProfiles } = await supabase.from('profiles').select('*')
  console.log('📊 Profiles in database:', allProfiles?.length || 0)
  
  const { data: allPatients } = await supabase.from('patients').select('*')
  console.log('📊 Patients in database:', allPatients?.length || 0)

  // Test our auth service getUserRole function
  console.log('\n📋 Testing getUserRole function...')
  const { data: roleResult, error: roleError } = await supabase
    .rpc('get_user_role', { user_id: authUser.user.id })
  
  if (roleError) {
    console.log('❌ getUserRole failed:', roleError.message)
  } else {
    console.log('✅ getUserRole result:', roleResult)
  }

  console.log('\n🎉 Manual test complete!')
  console.log('\n📍 View your data at: http://127.0.0.1:54323')
  console.log('   - Authentication > Users (auth.users)')
  console.log('   - Table Editor > profiles, patients')
}

manualTest().catch(console.error)