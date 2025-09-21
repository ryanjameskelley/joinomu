// Debug script to investigate authentication issues
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

// Use service role to bypass RLS for debugging
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugAuth() {
  console.log('🔍 Debugging Authentication System')
  console.log('=================================')

  // Check if tables exist
  console.log('\n📋 Checking table structure...')
  
  try {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('count(*)')
      .limit(1)
    
    if (profilesError) {
      console.log('❌ Profiles table error:', profilesError.message)
    } else {
      console.log('✅ Profiles table exists')
    }

    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('count(*)')
      .limit(1)
    
    if (patientsError) {
      console.log('❌ Patients table error:', patientsError.message)
    } else {
      console.log('✅ Patients table exists')
    }

    const { data: admins, error: adminsError } = await supabase
      .from('admins')
      .select('count(*)')
      .limit(1)
    
    if (adminsError) {
      console.log('❌ Admins table error:', adminsError.message)
    } else {
      console.log('✅ Admins table exists')
    }

    const { data: providers, error: providersError } = await supabase
      .from('providers')
      .select('count(*)')
      .limit(1)
    
    if (providersError) {
      console.log('❌ Providers table error:', providersError.message)
    } else {
      console.log('✅ Providers table exists')
    }
  } catch (error) {
    console.log('❌ Table check failed:', error.message)
  }

  // Check if any data exists from previous test
  console.log('\n📋 Checking existing data...')
  
  try {
    const { data: allProfiles, error: allProfilesError } = await supabase
      .from('profiles')
      .select('*')
    
    if (allProfilesError) {
      console.log('❌ Cannot read profiles:', allProfilesError.message)
    } else {
      console.log('✅ Found profiles:', allProfiles.length)
      allProfiles.forEach(profile => {
        console.log(`   - ${profile.email} (${profile.role})`)
      })
    }

    const { data: allPatients, error: allPatientsError } = await supabase
      .from('patients')
      .select('*')
    
    if (allPatientsError) {
      console.log('❌ Cannot read patients:', allPatientsError.message)
    } else {
      console.log('✅ Found patients:', allPatients.length)
    }

    const { data: allAdmins, error: allAdminsError } = await supabase
      .from('admins')
      .select('*')
    
    if (allAdminsError) {
      console.log('❌ Cannot read admins:', allAdminsError.message)
    } else {
      console.log('✅ Found admins:', allAdmins.length)
    }

    const { data: allProviders, error: allProvidersError } = await supabase
      .from('providers')
      .select('*')
    
    if (allProvidersError) {
      console.log('❌ Cannot read providers:', allProvidersError.message)
    } else {
      console.log('✅ Found providers:', allProviders.length)
    }
  } catch (error) {
    console.log('❌ Data check failed:', error.message)
  }

  // Test the trigger function manually
  console.log('\n📋 Testing trigger function...')
  
  // Clean up any existing test users first
  const { error: deleteError } = await supabase.auth.admin.deleteUser('test-trigger@example.com')
  // Ignore error if user doesn't exist

  // Create a test user
  const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
    email: 'test-trigger@example.com',
    password: 'password123',
    user_metadata: {
      role: 'patient',
      first_name: 'Test',
      last_name: 'User',
      date_of_birth: '1990-01-01',
      phone: '555-0000'
    }
  })

  if (createError) {
    console.log('❌ User creation failed:', createError.message)
  } else {
    console.log('✅ User created:', newUser.user.id)

    // Wait a moment for trigger to run
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Check if profile was created
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', newUser.user.id)
      .single()
    
    if (profileError) {
      console.log('❌ Profile not created:', profileError.message)
    } else {
      console.log('✅ Profile created:', profile)
    }

    // Check if patient record was created
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('profile_id', newUser.user.id)
      .single()
    
    if (patientError) {
      console.log('❌ Patient record not created:', patientError.message)
    } else {
      console.log('✅ Patient record created:', patient)
    }
  }

  console.log('\n🔍 Debug complete!')
}

debugAuth().catch(console.error)