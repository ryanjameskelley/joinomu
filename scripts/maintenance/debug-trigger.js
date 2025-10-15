// Simple test to create a user manually and see what happens
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testTrigger() {
  console.log('🔧 Testing Trigger Function')
  console.log('===========================')

  // Create user using admin API
  const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
    email: 'manual-test@example.com',
    password: 'password123',
    user_metadata: {
      role: 'patient',
      first_name: 'Manual',
      last_name: 'Test',
      date_of_birth: '1990-01-01',
      phone: '555-0000'
    }
  })

  if (createError) {
    console.log('❌ User creation failed:', createError.message)
    return
  }

  console.log('✅ User created with ID:', newUser.user.id)
  console.log('User metadata:', newUser.user.user_metadata)
  
  // Wait for trigger
  console.log('⏳ Waiting 3 seconds for trigger...')
  await new Promise(resolve => setTimeout(resolve, 3000))

  // Check what got created
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', newUser.user.id)
    .single()
  
  if (profileError) {
    console.log('❌ Profile not found:', profileError.message)
  } else {
    console.log('✅ Profile found:', profile)
  }

  // Check patient record
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('*')
    .eq('profile_id', newUser.user.id)
    .single()
  
  if (patientError) {
    console.log('❌ Patient record not found:', patientError.message)
  } else {
    console.log('✅ Patient record found:', patient)
  }

  // Let's also manually create the records to test the schema
  console.log('\n🔧 Testing manual record creation')
  
  try {
    // Manual profile creation
    const { data: manualProfile, error: manualProfileError } = await supabase
      .from('profiles')
      .insert({
        id: newUser.user.id,
        email: newUser.user.email,
        role: 'patient',
        first_name: 'Manual',
        last_name: 'Test'
      })
      .select()
      .single()
    
    if (manualProfileError) {
      console.log('❌ Manual profile creation failed:', manualProfileError.message)
    } else {
      console.log('✅ Manual profile created successfully')
    }

    // Manual patient creation
    const { data: manualPatient, error: manualPatientError } = await supabase
      .from('patients')
      .insert({
        profile_id: newUser.user.id,
        date_of_birth: '1990-01-01',
        phone: '555-0000',
        has_completed_intake: false
      })
      .select()
      .single()
    
    if (manualPatientError) {
      console.log('❌ Manual patient creation failed:', manualPatientError.message)
    } else {
      console.log('✅ Manual patient created successfully')
    }
  } catch (error) {
    console.log('❌ Manual creation error:', error.message)
  }

  console.log('\n🔧 Test complete')
}

testTrigger().catch(console.error)