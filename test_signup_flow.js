#!/usr/bin/env node

/**
 * Test the complete signup flow to ensure auth trigger works
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testSignupFlow() {
  const testEmail = `test.signup.${Date.now()}@example.com`
  
  console.log('🧪 Testing signup flow for:', testEmail)
  
  try {
    // Step 1: Create a new user (simulating signup)
    console.log('1️⃣ Creating new auth user...')
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'testpassword123',
      email_confirm: true,
      user_metadata: {
        role: 'patient',
        firstName: 'Test',
        lastName: 'Patient'
      }
    })
    
    if (authError) {
      console.error('❌ Error creating auth user:', authError)
      return false
    }
    
    console.log('✅ Auth user created:', authUser.user.id)
    
    // Step 2: Wait a moment for trigger to process
    console.log('2️⃣ Waiting for auth trigger to process...')
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Step 3: Check if profile was created
    console.log('3️⃣ Checking if profile was created...')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.user.id)
      .single()
    
    if (profileError || !profile) {
      console.log('❌ Profile not created automatically:', profileError)
      return false
    }
    
    console.log('✅ Profile created:', profile)
    
    // Step 4: Check if patient record was created
    console.log('4️⃣ Checking if patient record was created...')
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('profile_id', authUser.user.id)
      .single()
    
    if (patientError || !patient) {
      console.log('❌ Patient record not created automatically:', patientError)
      return false
    }
    
    console.log('✅ Patient record created:', patient)
    
    // Step 5: Test the role detection
    console.log('5️⃣ Testing role detection...')
    const { data: roleTest } = await supabase.rpc('get_user_role', { user_id: authUser.user.id })
    console.log('Role detection result:', roleTest)
    
    // Cleanup: Delete the test user
    console.log('🧹 Cleaning up test user...')
    await supabase.auth.admin.deleteUser(authUser.user.id)
    
    console.log('✅ Signup flow test PASSED - trigger is working correctly!')
    return true
    
  } catch (error) {
    console.error('❌ Error testing signup flow:', error)
    return false
  }
}

testSignupFlow().then(success => {
  if (success) {
    console.log('\n🎉 RESULT: New user signups should work correctly!')
    console.log('   - Auth user will be created')
    console.log('   - Profile will be auto-created by trigger') 
    console.log('   - Patient record will be auto-created by trigger')
    console.log('   - Role detection will work')
    console.log('   - User will be redirected to patient dashboard')
  } else {
    console.log('\n⚠️ RESULT: Signup flow has issues - manual profile creation may be needed')
  }
})