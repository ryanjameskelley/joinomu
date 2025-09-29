const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
)

async function testExistingUser() {
  console.log('🧪 Testing with existing users...')
  
  // Check what users exist in profiles
  const serviceSupabase = createClient(
    'http://127.0.0.1:54321',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
  )
  
  const { data: profiles, error: profilesError } = await serviceSupabase
    .from('profiles')
    .select('id, email, role')
    
  console.log('Available profiles:', profiles)
  
  if (profiles?.length > 0) {
    // Try to sign in with admin user
    const adminUser = profiles.find(p => p.role === 'admin')
    if (adminUser) {
      console.log('🔐 Trying to sign in as admin:', adminUser.email)
      
      // First check if this user exists in auth.users
      const { data: authUsers, error: authError } = await serviceSupabase
        .rpc('', {}, { 
          query: `SELECT id, email FROM auth.users WHERE email = '${adminUser.email}'`
        })
        .catch(() => ({ data: null, error: 'Cannot query auth.users' }))
        
      console.log('Auth users check:', authUsers, authError)
      
      // Try signing in (this will fail if no auth user exists)
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: adminUser.email,
        password: 'admin123' // Try common passwords
      })
      
      console.log('Sign in result:', signInData ? 'SUCCESS' : 'FAILED')
      console.log('Sign in error:', signInError?.message || 'None')
      
      if (signInError) {
        // Try other common passwords
        const passwords = ['password123', 'admin', 'test123', '123456']
        for (const pwd of passwords) {
          console.log(`Trying password: ${pwd}`)
          const { data, error } = await supabase.auth.signInWithPassword({
            email: adminUser.email,
            password: pwd
          })
          if (!error) {
            console.log('✅ Sign in successful with password:', pwd)
            break
          }
        }
      }
    }
  }
}

testExistingUser().catch(console.error)