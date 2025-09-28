#!/usr/bin/env node

/**
 * Test the specific 406 error on profiles table
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

async function testProfiles406() {
  console.log('🔍 Testing 406 error on profiles table...')
  
  // Test user ID from the logs
  const testUserId = 'e8ce536b-0c0a-4382-8b27-9768dc51455b'
  
  try {
    // 1. Test with service key (should work)
    console.log('1️⃣ Testing with SERVICE key...')
    const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { data: serviceData, error: serviceError } = await serviceSupabase
      .from('profiles')
      .select('role')
      .eq('id', testUserId)
      .single()
    
    if (serviceError) {
      console.log('❌ Service key error:', serviceError)
    } else {
      console.log('✅ Service key success:', serviceData)
    }
    
    // 2. Test with anon key (reproduces 406 error)
    console.log('\n2️⃣ Testing with ANON key (should reproduce 406)...')
    const anonSupabase = createClient(supabaseUrl, supabaseAnonKey)
    
    const { data: anonData, error: anonError } = await anonSupabase
      .from('profiles')
      .select('role')
      .eq('id', testUserId)
      .single()
    
    if (anonError) {
      console.log('❌ Anon key error (this is the 406):', anonError)
    } else {
      console.log('✅ Anon key success:', anonData)
    }
    
    // 3. Check current RLS policies on profiles
    console.log('\n3️⃣ Checking RLS policies on profiles table...')
    const { data: policies, error: policiesError } = await serviceSupabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            policyname,
            permissive,
            roles,
            cmd,
            qual,
            with_check
          FROM pg_policies 
          WHERE tablename = 'profiles' AND schemaname = 'public'
          ORDER BY policyname;
        `
      })
    
    if (policiesError) {
      console.log('❌ Error checking policies:', policiesError)
    } else {
      console.log('📋 Current policies on profiles:', JSON.stringify(policies, null, 2))
    }
    
    // 4. Check if RLS is enabled
    console.log('\n4️⃣ Checking if RLS is enabled on profiles...')
    const { data: rlsInfo, error: rlsError } = await serviceSupabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            tablename,
            rowsecurity
          FROM pg_tables 
          WHERE tablename = 'profiles' AND schemaname = 'public';
        `
      })
    
    if (rlsError) {
      console.log('❌ Error checking RLS:', rlsError)
    } else {
      console.log('🔐 RLS status:', rlsInfo)
    }
    
    // 5. Test user context - authenticate as the user and try the same query
    console.log('\n5️⃣ Testing with user authentication...')
    
    // First check if this user exists in auth.users
    const { data: authUser, error: authError } = await serviceSupabase.auth.admin.getUserById(testUserId)
    
    if (authError || !authUser.user) {
      console.log('❌ User not found in auth.users:', authError)
      return
    }
    
    console.log('✅ User found in auth.users:', authUser.user.email)
    
    // Try to authenticate as this user (this might fail if we don't know the password)
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey)
    
    // Since we can't authenticate as the user without the password, 
    // let's simulate the auth context using the service key but setting auth context
    console.log('📝 Simulating authenticated user context...')
    
    // Check if there's an existing session or if we need to create one
    const { data: sessionData, error: sessionError } = await serviceSupabase
      .rpc('exec_sql', {
        sql: `SELECT auth.uid() as current_user_id;`
      })
    
    if (sessionError) {
      console.log('❌ Error checking session:', sessionError)
    } else {
      console.log('👤 Current auth context:', sessionData)
    }
    
  } catch (error) {
    console.error('💥 Error:', error)
  }
}

testProfiles406()
