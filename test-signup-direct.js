// Test the exact signup flow that the frontend would use
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

// This mimics exactly what the frontend does
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// This is the exact authService.signUp call from the frontend
async function testFrontendSignup() {
  console.log('🔧 Testing Frontend Signup Flow')
  console.log('================================')

  // Exact data that would come from the form
  const formData = {
    email: 'frontend.real@example.com',
    password: 'password123',
    firstName: 'Frontend',
    lastName: 'Real',
    role: 'patient',
    dateOfBirth: '1990-01-01',
    phone: '555-1234'
  }

  console.log('📋 Attempting signup with data:', formData)

  try {
    // This is exactly what authService.signUp does
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          role: formData.role,
          firstName: formData.firstName,
          lastName: formData.lastName,
          ...(formData.dateOfBirth && { dateOfBirth: formData.dateOfBirth }),
          ...(formData.phone && { phone: formData.phone })
        }
      }
    })

    if (error) {
      console.log('❌ Signup failed:', error)
      console.log('Error details:', JSON.stringify(error, null, 2))
      return
    }

    console.log('✅ Signup successful!')
    console.log('User ID:', data.user?.id)
    console.log('User email:', data.user?.email)
    console.log('Session:', !!data.session)
    console.log('User metadata:', data.user?.user_metadata)

    // Check if user was created in Supabase
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
    if (!listError) {
      const foundUser = users?.find(u => u.email === formData.email)
      if (foundUser) {
        console.log('✅ User found in auth.users:', foundUser.id)
      } else {
        console.log('❌ User not found in auth.users')
      }
    }

  } catch (error) {
    console.log('❌ Signup exception:', error)
  }

  console.log('\n📍 Check Supabase Studio: http://127.0.0.1:54323')
  console.log('   - Authentication > Users tab')
}

testFrontendSignup().catch(console.error)