#!/usr/bin/env node

/**
 * Test the specific user that's experiencing 406 errors
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

async function testSpecificUser() {
  console.log('🔍 Testing specific user with 406 error...')
  
  // The user ID that was experiencing 406 errors from the conversation
  const problemUserId = 'e92fcabd-95a9-442d-b634-aad585af12a8'
  
  try {
    // Create anon client (like frontend would use)
    const anonSupabase = createClient(supabaseUrl, supabaseAnonKey)
    
    console.log('🧪 Testing getUserRole query that was failing...')
    const { data: roleData, error: roleError } = await anonSupabase
      .from('profiles')
      .select('role')
      .eq('id', problemUserId)
      .single()
    
    if (roleError) {
      console.log('❌ ERROR (this should be the 406):', roleError)
      console.log('   Status code:', roleError.code)
      console.log('   Details:', roleError.details)
      console.log('   Message:', roleError.message)
    } else {
      console.log('✅ SUCCESS:', roleData)
    }
    
    // Also test if this user exists at all
    console.log('\n🔍 Checking if this user exists in profiles...')
    const { data: allProfiles, error: allError } = await anonSupabase
      .from('profiles')
      .select('id, email, role')
      .limit(10)
    
    if (allError) {
      console.log('❌ Error fetching profiles:', allError)
    } else {
      console.log('✅ Found profiles:', allProfiles.length)
      const foundUser = allProfiles.find(p => p.id === problemUserId)
      if (foundUser) {
        console.log('👤 Found problem user:', foundUser)
      } else {
        console.log('❌ Problem user not found in profiles table')
      }
    }
    
    // Test the exact same query format used in auth-service.ts
    console.log('\n🧪 Testing exact auth-service query format...')
    const { data: exactData, error: exactError } = await anonSupabase
      .from('profiles')
      .select('role')
      .eq('id', problemUserId)
      .single()
    
    if (exactError) {
      console.log('❌ Exact query error:', exactError)
    } else {
      console.log('✅ Exact query success:', exactData)
    }
    
  } catch (error) {
    console.error('💥 Catch error:', error)
  }
}

testSpecificUser()
