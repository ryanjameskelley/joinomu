const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

async function checkRLSPolicies() {
  console.log('🔍 Checking RLS policies and permissions...')
  
  // Create clients with different keys
  const serviceClient = createClient(supabaseUrl, supabaseServiceKey)
  const anonClient = createClient(supabaseUrl, supabaseAnonKey)
  
  const providerId = 'eefb13eb-c40e-4fff-9dac-6225f6bfdf78'
  
  console.log('\n1️⃣ Testing with SERVICE key (should work)...')
  try {
    const { data: serviceData, error: serviceError } = await serviceClient
      .from('provider_schedules')
      .select('*')
      .eq('provider_id', providerId)
      .eq('active', true)
      .limit(3)
    
    if (serviceError) {
      console.error('❌ Service key error:', serviceError)
    } else {
      console.log(`✅ Service key works: Found ${serviceData.length} schedules`)
    }
  } catch (error) {
    console.error('❌ Service key exception:', error.message)
  }
  
  console.log('\n2️⃣ Testing with ANON key (likely fails due to RLS)...')
  try {
    const { data: anonData, error: anonError } = await anonClient
      .from('provider_schedules')
      .select('*')
      .eq('provider_id', providerId)
      .eq('active', true)
      .limit(3)
    
    if (anonError) {
      console.error('❌ Anon key error (this is likely our problem):', anonError)
    } else {
      console.log(`✅ Anon key works: Found ${anonData.length} schedules`)
    }
  } catch (error) {
    console.error('❌ Anon key exception:', error.message)
  }
  
  console.log('\n3️⃣ Testing with authenticated user context...')
  
  // Sign in as the patient
  const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({
    email: 'test@email.com', // Use the patient's email from the current session
    password: 'password123'
  })
  
  if (authError) {
    console.error('❌ Could not sign in:', authError)
  } else {
    console.log('✅ Signed in as user:', authData.user?.id)
    
    // Now try the query with user context
    const { data: authScheduleData, error: authScheduleError } = await anonClient
      .from('provider_schedules')
      .select('*')
      .eq('provider_id', providerId)
      .eq('active', true)
      .limit(3)
    
    if (authScheduleError) {
      console.error('❌ Authenticated user error:', authScheduleError)
      console.log('This confirms RLS is blocking provider_schedules access!')
    } else {
      console.log(`✅ Authenticated user works: Found ${authScheduleData.length} schedules`)
    }
  }
  
  // Check RLS status
  console.log('\n4️⃣ Checking table RLS status...')
  try {
    const { data: tableInfo } = await serviceClient
      .from('information_schema.tables')
      .select('table_name, row_security')
      .eq('table_name', 'provider_schedules')
      .eq('table_schema', 'public')
    
    console.log('Provider schedules RLS info:', tableInfo)
  } catch (error) {
    console.log('Could not check RLS status')
  }
}

checkRLSPolicies()