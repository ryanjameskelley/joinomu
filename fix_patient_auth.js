#!/usr/bin/env node

/**
 * Fix Patient Authentication
 * This script ensures patient users can log in properly by creating proper auth.users records
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

async function fixPatientAuth() {
  console.log('🔧 Fixing patient authentication...')
  
  try {
    // Create or update Sarah Johnson as a test patient
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'sarah.j@test.com',
      password: 'password123',
      email_confirm: true,
      user_metadata: {
        role: 'patient',
        firstName: 'Sarah',
        lastName: 'Johnson'
      }
    })
    
    if (authError) {
      console.log('User might already exist, trying to update instead...')
      
      // If user already exists, try to update the password
      const { data: users } = await supabase.auth.admin.listUsers()
      const existingUser = users.users.find(u => u.email === 'sarah.j@test.com')
      
      if (existingUser) {
        console.log('Found existing user, updating password...')
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          existingUser.id,
          { password: 'password123' }
        )
        
        if (updateError) {
          console.error('Error updating password:', updateError)
        } else {
          console.log('✅ Password updated successfully')
        }
      }
    } else {
      console.log('✅ User created successfully:', authUser.user.email)
    }
    
    // Check that the profile exists and has the correct role
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'sarah.j@test.com')
    
    if (profileError) {
      console.error('Error checking profile:', profileError)
    } else {
      console.log('Profile data:', profiles)
    }
    
    console.log('🔐 Test login: sarah.j@test.com / password123')
    
  } catch (error) {
    console.error('Error fixing patient auth:', error)
  }
}

fixPatientAuth()