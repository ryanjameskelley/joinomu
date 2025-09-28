#!/usr/bin/env node

/**
 * Create missing profile for authenticated user
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

async function createMissingProfile() {
  const userId = 'e8ce536b-0c0a-4382-8b27-9768dc51455b'
  
  console.log('🔧 Creating missing profile for user:', userId)
  
  try {
    // First, get the user from auth.users to see their email and metadata
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId)
    
    if (authError || !authUser.user) {
      console.error('Error getting auth user or user not found:', authError)
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
      
      // If this is a patient, also create a patient record
      if (authUser.user.user_metadata?.role === 'patient' || !authUser.user.user_metadata?.role) {
        const { data: patient, error: patientError } = await supabase
          .from('patients')
          .insert({
            profile_id: userId,
            email: authUser.user.email,
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
    
    console.log('🔐 You should now be able to access the patient dashboard!')
    
  } catch (error) {
    console.error('Error creating missing profile:', error)
  }
}

createMissingProfile()