#!/usr/bin/env node

/**
 * Test frontend signup specifically using the same method as the UI
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testFrontendSignup() {
  const testEmail = `frontend.test.${Date.now()}@example.com`
  
  console.log('🧪 Testing FRONTEND signup flow for:', testEmail)
  
  try {
    // Step 1: Frontend signup (same as UI)
    console.log('1️⃣ Creating user via frontend signup...')
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: 'testpassword123',
      options: {
        data: {
          role: 'patient',
          first_name: 'Frontend',
          last_name: 'Test'
        }
      }
    })
    
    if (error) {
      console.error('❌ Frontend signup failed:', error)
      return false
    }
    
    console.log('✅ Frontend signup successful:', data.user?.id)
    console.log('📋 User metadata:', data.user?.user_metadata)
    console.log('📋 Raw user metadata:', data.user?.raw_user_meta_data)
    
    // Step 2: Wait for trigger
    console.log('2️⃣ Waiting for trigger to process...')
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Step 3: Check if profile was created using service key for admin access
    console.log('3️⃣ Checking if profile was created...')
    
    const serviceSupabase = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU')
    
    const { data: profile, error: profileError } = await serviceSupabase
      .from('profiles')
      .select('*')
      .eq('id', data.user?.id)
      .single()
    
    if (profileError || !profile) {
      console.log('❌ FRONTEND TRIGGER NOT WORKING - Profile not created:', profileError)
      
      // Check trigger logs
      const { data: logs } = await serviceSupabase
        .from('auth_trigger_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)
      
      console.log('📋 Recent trigger logs:', logs)
      
      // Clean up
      await serviceSupabase.auth.admin.deleteUser(data.user?.id || '')
      
      return false
    } else {
      console.log('✅ FRONTEND TRIGGER WORKING - Profile created:', profile)
      
      // Clean up
      await serviceSupabase.auth.admin.deleteUser(data.user?.id || '')
      
      return true
    }
    
  } catch (error) {
    console.error('❌ Error testing frontend signup:', error)
    return false
  }
}

testFrontendSignup().then(success => {
  if (success) {
    console.log('\n🎉 FRONTEND SIGNUP WORKS! The trigger should work with the UI.')
  } else {
    console.log('\n⚠️ FRONTEND SIGNUP BROKEN - Trigger still not working with frontend signups.')
    console.log('The issue is likely in how frontend vs admin signups handle metadata.')
  }
})