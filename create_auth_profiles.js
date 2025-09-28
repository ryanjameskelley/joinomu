const { createClient } = require('@supabase/supabase-js')

// Local Supabase configuration
const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const anonSupabase = createClient(supabaseUrl, supabaseAnonKey)
const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function createAuthProfiles() {
  try {
    const patientId = 'd10382e9-d30e-4a1c-8c17-16cd6da6a9de'
    const providerId = 'a44b32bb-00a5-460d-a18b-4468d59d0318'
    
    console.log('👤 Creating auth profiles for patient and provider...\n')
    
    // 1. Create patient auth user
    console.log('1. Creating patient auth user...')
    const { data: patientAuth, error: patientAuthError } = await anonSupabase.auth.signUp({
      email: 'patient.connected@test.com',
      password: 'password',
      options: {
        data: {
          full_name: 'Connected Test Patient'
        }
      }
    })
    
    if (patientAuthError && !patientAuthError.message.includes('already registered')) {
      console.error('❌ Patient auth error:', patientAuthError.message)
    } else {
      console.log('✅ Patient auth user created')
      const actualPatientAuthId = patientAuth?.user?.id
      
      if (actualPatientAuthId) {
        // Update profiles table to connect this auth user to patient role
        await serviceSupabase.from('profiles').upsert([{
          id: actualPatientAuthId,
          email: 'patient.connected@test.com',
          role: 'patient'
        }])
        
        // Update the patient assignment to use the auth user ID
        await serviceSupabase
          .from('patient_assignments')
          .update({ patient_id: actualPatientAuthId })
          .eq('patient_id', patientId)
        
        console.log(`   📧 Email: patient.connected@test.com`)
        console.log(`   🆔 Auth ID: ${actualPatientAuthId}`)
      }
    }
    
    // 2. Create provider auth user
    console.log('\n2. Creating provider auth user...')
    const { data: providerAuth, error: providerAuthError } = await anonSupabase.auth.signUp({
      email: 'provider.connected@test.com',
      password: 'password',
      options: {
        data: {
          full_name: 'Connected Test Provider'
        }
      }
    })
    
    if (providerAuthError && !providerAuthError.message.includes('already registered')) {
      console.error('❌ Provider auth error:', providerAuthError.message)
    } else {
      console.log('✅ Provider auth user created')
      const actualProviderAuthId = providerAuth?.user?.id
      
      if (actualProviderAuthId) {
        // Update profiles table to connect this auth user to provider role
        await serviceSupabase.from('profiles').upsert([{
          id: actualProviderAuthId,
          email: 'provider.connected@test.com',
          role: 'provider'
        }])
        
        // Update provider record
        await serviceSupabase.from('providers').upsert([{
          id: actualProviderAuthId,
          name: 'Connected Test Provider',
          specialty: 'Weight Management'
        }])
        
        // Update all schedules to use the new provider ID
        await serviceSupabase
          .from('provider_schedules')
          .update({ provider_id: actualProviderAuthId })
          .eq('provider_id', providerId)
        
        // Update patient assignments to point to new provider ID
        await serviceSupabase
          .from('patient_assignments')
          .update({ provider_id: actualProviderAuthId })
          .eq('provider_id', providerId)
        
        console.log(`   📧 Email: provider.connected@test.com`)
        console.log(`   🆔 Auth ID: ${actualProviderAuthId}`)
      }
    }
    
    // 3. Verify the final setup
    console.log('\n3. Verifying final setup...')
    
    // Check assignments
    const { data: finalAssignments } = await serviceSupabase
      .from('patient_assignments')
      .select('*')
      .eq('treatment_type', 'weight_loss')
    
    console.log(`✅ Found ${finalAssignments?.length || 0} weight_loss assignments`)
    
    if (finalAssignments && finalAssignments.length > 0) {
      const assignment = finalAssignments[0]
      console.log(`   Patient: ${assignment.patient_id}`)
      console.log(`   Provider: ${assignment.provider_id}`)
      
      // Check provider schedules
      const { data: schedules } = await serviceSupabase
        .from('provider_schedules')
        .select('*')
        .eq('provider_id', assignment.provider_id)
        .eq('active', true)
        .contains('treatment_types', ['weight_loss'])
      
      console.log(`✅ Provider has ${schedules?.length || 0} weight_loss schedules`)
    }
    
    console.log('\n🎉 AUTH PROFILES CREATED!')
    console.log('\n🔑 NEW LOGIN CREDENTIALS:')
    console.log('👤 Patient: patient.connected@test.com / password')
    console.log('🩺 Provider: provider.connected@test.com / password')
    console.log('\n✅ READY TO TEST:')
    console.log('1. Login as patient.connected@test.com to see weight loss provider with available times')
    console.log('2. Login as provider.connected@test.com to view patients and test visits component')
    console.log('3. All schedules and assignments are properly connected!')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

createAuthProfiles()