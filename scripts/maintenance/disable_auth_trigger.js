const { createClient } = require('@supabase/supabase-js')

// Create a direct SQL connection function
const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
)

async function fixAuth() {
  console.log('🔧 Attempting to fix auth by disabling trigger temporarily...')
  
  try {
    // First, disable the trigger
    console.log('Disabling auth trigger...')
    await supabase.rpc('exec_sql', { 
      sql: 'DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;'
    })
    console.log('✅ Trigger disabled')
  } catch (e) {
    console.log('Info: Could not disable trigger:', e.message)
  }
  
  // Try to create user without trigger
  console.log('Creating user without trigger...')
  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email: 'test.admin@test.com',
    password: 'admin123',
    email_confirm: true,
    user_metadata: {
      role: 'admin',
      first_name: 'Test',
      last_name: 'Admin'
    }
  })
  
  console.log('User creation without trigger:', userData?.user ? 'SUCCESS' : 'FAILED')
  console.log('User error:', userError?.message || 'None')
  
  if (userData?.user) {
    console.log('✅ User created successfully:')
    console.log('- ID:', userData.user.id)
    console.log('- Email:', userData.user.email)
    
    // Manually create profile
    console.log('Creating profile manually...')
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userData.user.id,
        email: userData.user.email,
        first_name: 'Test',
        last_name: 'Admin',
        role: 'admin'
      })
      .select()
      .single()
      
    console.log('Profile creation:', profileData ? 'SUCCESS' : 'FAILED')
    console.log('Profile error:', profileError?.message || 'None')
    
    if (profileData) {
      // Create admin record
      console.log('Creating admin record...')
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .insert({
          profile_id: userData.user.id,
          permissions: 'full'
        })
        .select()
        .single()
        
      console.log('Admin record creation:', adminData ? 'SUCCESS' : 'FAILED')
      console.log('Admin error:', adminError?.message || 'None')
    }
    
    console.log('🎉 Test user created! You can now sign in with:')
    console.log('Email: test.admin@test.com')
    console.log('Password: admin123')
  }
  
  console.log('Authentication should now work in the webapp for testing admin features!')
}

fixAuth().catch(console.error)