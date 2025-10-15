// Quick test to verify the fixed trigger works
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

// Test with anon key like the frontend would use
const supabase = createClient(supabaseUrl, supabaseAnonKey)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function testQuick() {
  console.log('🔧 Quick Trigger Test (Simulating Frontend Signup)')
  console.log('==================================================')

  // Test signup like the frontend would do it
  const testData = {
    email: 'frontend.test@example.com',
    password: 'password123',
    firstName: 'Frontend',
    lastName: 'Test',
    role: 'patient',
    dateOfBirth: '1995-06-15',
    phone: '555-9999'
  }

  console.log('📋 Testing frontend-style signup...')
  
  const { data, error } = await supabase.auth.signUp({
    email: testData.email,
    password: testData.password,
    options: {
      data: testData  // This goes to raw_user_meta_data
    }
  })

  if (error) {
    console.log('❌ Signup failed:', error.message)
    return
  }

  console.log('✅ User created in auth:', data.user.id)
  console.log('   Metadata:', data.user.user_metadata)

  // Wait for trigger
  console.log('⏳ Waiting 3 seconds for trigger...')
  await new Promise(resolve => setTimeout(resolve, 3000))

  // Check results using admin client
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single()

  if (profile) {
    console.log('✅ Profile created:', profile)
  } else {
    console.log('❌ Profile not found')
  }

  const { data: patient } = await supabaseAdmin
    .from('patients')
    .select('*')
    .eq('profile_id', data.user.id)
    .single()

  if (patient) {
    console.log('✅ Patient record created:', patient)
  } else {
    console.log('❌ Patient record not found')
  }

  console.log('\n🎉 Trigger test complete!')
  console.log('📍 View in Supabase Studio: http://127.0.0.1:54323')
}

testQuick().catch(console.error)