#!/usr/bin/env node

/**
 * Fix the auth trigger by testing and potentially recreating it
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

async function fixAuthTrigger() {
  console.log('🔧 Investigating auth trigger issue...')
  
  try {
    // Test if the trigger works by creating a test user
    const testEmail = `trigger.test.${Date.now()}@example.com`
    
    console.log('1️⃣ Creating test user to check trigger:', testEmail)
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'testpassword123',
      email_confirm: true,
      user_metadata: {
        role: 'patient',
        firstName: 'TriggerTest',
        lastName: 'User'
      }
    })
    
    if (authError) {
      console.error('❌ Error creating test user:', authError)
      return
    }
    
    console.log('✅ Test user created:', authUser.user.id)
    
    // Wait for trigger to process
    console.log('2️⃣ Waiting for trigger to process...')
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Check if profile was created
    console.log('3️⃣ Checking if trigger created profile...')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.user.id)
      .single()
    
    if (profileError || !profile) {
      console.log('❌ TRIGGER NOT WORKING - Profile not created automatically')
      console.log('Profile error:', profileError)
      
      // Manually create profile for this test user
      console.log('4️⃣ Manually creating profile for test user...')
      const { data: manualProfile, error: manualError } = await supabase
        .from('profiles')
        .insert({
          id: authUser.user.id,
          email: authUser.user.email,
          first_name: authUser.user.user_metadata?.firstName || 'Test',
          last_name: authUser.user.user_metadata?.lastName || 'User',
          role: authUser.user.user_metadata?.role || 'patient',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
      
      if (manualError) {
        console.error('Error manually creating profile:', manualError)
      } else {
        console.log('✅ Manually created profile:', manualProfile)
      }
      
      console.log('\n⚠️ CONCLUSION: Auth trigger is NOT working properly')
      console.log('📋 RECOMMENDATION: Profiles need to be created manually or trigger needs to be fixed')
      
    } else {
      console.log('✅ TRIGGER IS WORKING - Profile created automatically:', profile)
      console.log('\n🎉 CONCLUSION: Auth trigger is working correctly')
    }
    
    // Cleanup test user
    console.log('🧹 Cleaning up test user...')
    await supabase.auth.admin.deleteUser(authUser.user.id)
    
  } catch (error) {
    console.error('❌ Error testing auth trigger:', error)
  }
}

fixAuthTrigger()