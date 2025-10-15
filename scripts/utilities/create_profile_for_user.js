#!/usr/bin/env node

/**
 * Create missing profile for the new user
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

async function createProfileForUser() {
  const userId = '8653d3a0-0e44-4474-afac-f3ea582d46a9'
  
  console.log('🔧 Creating missing profile for new user:', userId)
  
  try {
    // Get the user from auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId)
    
    if (authError || !authUser.user) {
      console.error('Error getting auth user:', authError)
      return
    }
    
    console.log('Found auth user:', {
      email: authUser.user.email,
      metadata: authUser.user.user_metadata
    })
    
    // Create the profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: authUser.user.email,
        first_name: authUser.user.user_metadata?.firstName || 'Patient',
        last_name: authUser.user.user_metadata?.lastName || 'User',
        role: authUser.user.user_metadata?.role || 'patient',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
    
    if (profileError) {
      console.error('Error creating profile:', profileError)
    } else {
      console.log('✅ Profile created successfully:', profile)
      
      // Create patient record if role is patient
      if (authUser.user.user_metadata?.role === 'patient' || !authUser.user.user_metadata?.role) {
        const { data: patient, error: patientError } = await supabase
          .from('patients')
          .insert({
            profile_id: userId,
            first_name: authUser.user.user_metadata?.firstName || 'Patient',
            last_name: authUser.user.user_metadata?.lastName || 'User',
            has_completed_intake: false,
            created_at: new Date().toISOString()
          })
          .select()
        
        if (patientError) {
          console.error('Error creating patient record:', patientError)
        } else {
          console.log('✅ Patient record created successfully:', patient)
        }
      }
    }
    
    console.log('🔐 User should now be able to access the patient dashboard!')
    
  } catch (error) {
    console.error('Error creating profile:', error)
  }
}

createProfileForUser()