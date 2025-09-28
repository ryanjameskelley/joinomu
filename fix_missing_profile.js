#!/usr/bin/env node

/**
 * Fix missing profile for user experiencing login issues
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

async function fixMissingProfile() {
  const problemUserId = 'e92fcabd-95a9-442d-b634-aad585af12a8'
  
  console.log('🔧 Fixing missing profile for user:', problemUserId)
  
  try {
    // 1. Check if user exists in auth.users
    console.log('1️⃣ Checking if user exists in auth.users...')
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(problemUserId)
    
    if (authError || !authUser.user) {
      console.error('❌ User not found in auth.users:', authError)
      return
    }
    
    console.log('✅ User found in auth.users:', {
      email: authUser.user.email,
      created_at: authUser.user.created_at,
      user_metadata: authUser.user.user_metadata,
      raw_user_meta_data: authUser.user.raw_user_meta_data
    })
    
    // 2. Check if profile already exists (double-check)
    console.log('2️⃣ Double-checking profile existence...')
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', problemUserId)
      .single()
    
    if (existingProfile) {
      console.log('✅ Profile already exists:', existingProfile)
      return
    }
    
    if (profileCheckError && profileCheckError.code !== 'PGRST116') {
      console.error('❌ Error checking profile:', profileCheckError)
      return
    }
    
    console.log('❌ Confirmed: Profile does not exist')
    
    // 3. Create the missing profile
    console.log('3️⃣ Creating missing profile...')
    
    // Extract role from user metadata (check both possible locations)
    const role = authUser.user.user_metadata?.role || 
                 authUser.user.raw_user_meta_data?.role || 
                 'patient' // default to patient
    
    const firstName = authUser.user.user_metadata?.first_name || 
                      authUser.user.raw_user_meta_data?.first_name || 
                      'User'
    
    const lastName = authUser.user.user_metadata?.last_name || 
                     authUser.user.raw_user_meta_data?.last_name || 
                     'User'
    
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: problemUserId,
        email: authUser.user.email,
        first_name: firstName,
        last_name: lastName,
        role: role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (createError) {
      console.error('❌ Error creating profile:', createError)
      return
    }
    
    console.log('✅ Profile created successfully:', newProfile)
    
    // 4. Create corresponding role-specific record if needed
    if (role === 'patient') {
      console.log('4️⃣ Creating patient record...')
      const { data: patientRecord, error: patientError } = await supabase
        .from('patients')
        .insert({
          profile_id: problemUserId,
          has_completed_intake: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (patientError) {
        console.error('❌ Error creating patient record:', patientError)
      } else {
        console.log('✅ Patient record created:', patientRecord)
      }
    }
    
    // 5. Test the getUserRole query that was failing
    console.log('5️⃣ Testing getUserRole query...')
    const anonSupabase = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0')
    
    const { data: roleTest, error: roleTestError } = await anonSupabase
      .from('profiles')
      .select('role')
      .eq('id', problemUserId)
      .single()
    
    if (roleTestError) {
      console.log('❌ getUserRole test still failing:', roleTestError)
    } else {
      console.log('✅ getUserRole test now working:', roleTest)
    }
    
    console.log('\n🎉 SUCCESS: User should now be able to login and access the patient dashboard!')
    
  } catch (error) {
    console.error('💥 Error:', error)
  }
}

fixMissingProfile()
