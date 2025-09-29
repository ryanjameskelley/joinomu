const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
)

async function testSignIn() {
  console.log('🔐 Testing sign in with admin user...')
  
  // Try common passwords for admin@test.com
  const passwords = ['admin123', 'password123', 'admin', 'test123', '123456', 'password']
  
  for (const pwd of passwords) {
    console.log(`Trying password: ${pwd}`)
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@test.com',
      password: pwd
    })
    
    if (!error && data.user) {
      console.log('✅ Sign in successful with password:', pwd)
      console.log('User ID:', data.user.id)
      console.log('Email:', data.user.email)
      return
    } else {
      console.log('❌ Failed:', error?.message || 'Unknown error')
    }
  }
  
  console.log('❌ All password attempts failed. The auth.users table might not have this user.')
  console.log('💡 You can sign in manually in the webapp and it should work for testing the admin features.')
}

testSignIn().catch(console.error)