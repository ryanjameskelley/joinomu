#!/usr/bin/env node

/**
 * Create profile for the current test user from browser console
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

async function fixCurrentUser() {
  // The user ID from your browser console: 44f26452-dfe6-4e0c-a10e-31dc947cf08e
  const userId = '44f26452-dfe6-4e0c-a10e-31dc947cf08e'
  
  console.log('🔧 Creating profile for current user:', userId)
  
  try {
    // Get the user from auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId)
    
    if (authError || !authUser.user) {
      console.error('User not found or error:', authError)
      return
    }
    
    console.log('Found user:', authUser.user.email)
    
    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (existingProfile) {
      console.log('✅ Profile already exists:', existingProfile)
      return
    }
    
    // Create the profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: authUser.user.email,
        first_name: authUser.user.user_metadata?.first_name || 'Patient',
        last_name: authUser.user.user_metadata?.last_name || 'User', 
        role: 'patient',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
    
    if (profileError) {
      console.error('Error creating profile:', profileError)
    } else {
      console.log('✅ Profile created:', profile)
      
      // Create patient record
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .insert({
          profile_id: userId,
          has_completed_intake: false,
          created_at: new Date().toISOString()
        })
        .select()
      
      if (patientError) {
        console.error('Error creating patient record:', patientError)
      } else {
        console.log('✅ Patient record created:', patient)
      }
    }
    
    console.log('🔐 Refresh the browser page - you should now access the patient dashboard!')
    
  } catch (error) {
    console.error('Error:', error)
  }
}

fixCurrentUser()