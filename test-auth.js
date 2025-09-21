// Simple test script to verify our authentication system
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAuthentication() {
  console.log('🔧 Testing Clean Authentication System')
  console.log('=====================================')

  // Test 1: Patient signup
  console.log('\n📋 Test 1: Patient Signup')
  const patientSignup = await supabase.auth.signUp({
    email: 'test.patient@example.com',
    password: 'password123',
    options: {
      data: {
        role: 'patient',
        first_name: 'John',
        last_name: 'Patient',
        date_of_birth: '1990-01-01',
        phone: '555-1234'
      }
    }
  })

  if (patientSignup.error) {
    console.log('❌ Patient signup failed:', patientSignup.error.message)
  } else {
    console.log('✅ Patient signup successful:', patientSignup.data.user?.id)
    
    // Check if profile was created
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', patientSignup.data.user.id)
      .single()
    
    if (profileError) {
      console.log('❌ Profile not found:', profileError.message)
    } else {
      console.log('✅ Profile created:', profile.role, profile.first_name, profile.last_name)
    }

    // Check if patient record was created
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('profile_id', patientSignup.data.user.id)
      .single()
    
    if (patientError) {
      console.log('❌ Patient record not found:', patientError.message)
    } else {
      console.log('✅ Patient record created:', patient.date_of_birth, patient.phone)
    }
  }

  // Test 2: Admin signup
  console.log('\n📋 Test 2: Admin Signup')
  const adminSignup = await supabase.auth.signUp({
    email: 'test.admin@example.com',
    password: 'password123',
    options: {
      data: {
        role: 'admin',
        first_name: 'Jane',
        last_name: 'Admin'
      }
    }
  })

  if (adminSignup.error) {
    console.log('❌ Admin signup failed:', adminSignup.error.message)
  } else {
    console.log('✅ Admin signup successful:', adminSignup.data.user?.id)
    
    // Check if admin record was created
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('*')
      .eq('profile_id', adminSignup.data.user.id)
      .single()
    
    if (adminError) {
      console.log('❌ Admin record not found:', adminError.message)
    } else {
      console.log('✅ Admin record created:', admin.permissions)
    }
  }

  // Test 3: Provider signup
  console.log('\n📋 Test 3: Provider Signup')
  const providerSignup = await supabase.auth.signUp({
    email: 'test.provider@example.com',
    password: 'password123',
    options: {
      data: {
        role: 'provider',
        first_name: 'Dr.',
        last_name: 'Provider',
        specialty: 'Family Medicine',
        license_number: 'MD123456',
        phone: '555-5678'
      }
    }
  })

  if (providerSignup.error) {
    console.log('❌ Provider signup failed:', providerSignup.error.message)
  } else {
    console.log('✅ Provider signup successful:', providerSignup.data.user?.id)
    
    // Check if provider record was created
    const { data: provider, error: providerError } = await supabase
      .from('providers')
      .select('*')
      .eq('profile_id', providerSignup.data.user.id)
      .single()
    
    if (providerError) {
      console.log('❌ Provider record not found:', providerError.message)
    } else {
      console.log('✅ Provider record created:', provider.specialty, provider.license_number)
    }
  }

  // Test 4: Role utility function
  console.log('\n📋 Test 4: Role Utility Function')
  if (patientSignup.data.user?.id) {
    const { data: roleResult, error: roleError } = await supabase
      .rpc('get_user_role', { user_id: patientSignup.data.user.id })
    
    if (roleError) {
      console.log('❌ Role function failed:', roleError.message)
    } else {
      console.log('✅ Role function works:', roleResult)
    }
  }

  console.log('\n🎉 Authentication system testing complete!')
}

testAuthentication().catch(console.error)