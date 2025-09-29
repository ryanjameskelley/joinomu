const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
)

async function createTestUser() {
  console.log('🔧 Creating a test admin user for webapp testing...')
  
  // Use the admin API to create a user
  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email: 'admin@test.com',
    password: 'admin123',
    email_confirm: true,
    user_metadata: {
      role: 'admin',
      first_name: 'Admin',
      last_name: 'User'
    }
  })
  
  console.log('User creation result:', userData?.user ? 'SUCCESS' : 'FAILED')
  console.log('User error:', userError?.message || 'None')
  
  if (userData?.user) {
    console.log('✅ Created admin user:')
    console.log('- ID:', userData.user.id)
    console.log('- Email:', userData.user.email)
    console.log('- Confirmed:', userData.user.email_confirmed_at ? 'Yes' : 'No')
    
    // The auth trigger should have created the profile automatically
    // Let's verify it exists
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userData.user.id)
      .single()
      
    console.log('Profile created by trigger:', profileData ? 'YES' : 'NO')
    console.log('Profile error:', profileError?.message || 'None')
    
    if (profileData) {
      console.log('✅ Profile details:')
      console.log('- Role:', profileData.role)
      console.log('- Name:', profileData.first_name, profileData.last_name)
    }
  }
  
  console.log('🎉 You can now sign in to the webapp with:')
  console.log('Email: admin@test.com')
  console.log('Password: admin123')
}

createTestUser().catch(console.error)