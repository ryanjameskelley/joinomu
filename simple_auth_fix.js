const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
)

async function simpleAuthFix() {
  console.log('🧪 Testing basic signup to understand the issue...')
  
  // First, let's see what happens if we just try to sign up
  const testEmail = `test.${Date.now()}@example.com`
  
  const { data: signupData, error: signupError } = await supabase.auth.signUp({
    email: testEmail,
    password: 'password123',
    options: {
      data: {
        role: 'patient',
        first_name: 'Test',
        last_name: 'Patient'
      }
    }
  })
  
  console.log('Signup attempt result:')
  console.log('- Data:', signupData)
  console.log('- Error:', signupError)
  
  if (signupError) {
    console.log('❌ Signup failed with error:', signupError.message)
    
    // Let's try to create the user profile manually if signup succeeded but trigger failed
    if (signupData?.user?.id) {
      console.log('🔧 User was created, trying to create profile manually...')
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: signupData.user.id,
          email: testEmail,
          first_name: 'Test',
          last_name: 'Patient',
          role: 'patient'
        })
        .select()
        .single()
        
      console.log('Manual profile creation:', profileData)
      console.log('Manual profile error:', profileError)
      
      if (!profileError) {
        // Create patient record
        const { data: patientData, error: patientError } = await supabase
          .from('patients')
          .insert({
            profile_id: signupData.user.id,
            has_completed_intake: false
          })
          .select()
          .single()
          
        console.log('Manual patient creation:', patientData)
        console.log('Manual patient error:', patientError)
      }
    }
  } else {
    console.log('✅ Signup succeeded!')
  }
}

simpleAuthFix().catch(console.error)