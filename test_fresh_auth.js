const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
)

const serviceSupabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
)

async function testFreshAuth() {
  console.log('🧪 Testing auth with fresh Supabase start...')
  
  // First, try basic signup
  const testEmail = `fresh.test.${Date.now()}@example.com`
  
  const { data: signupData, error: signupError } = await supabase.auth.signUp({
    email: testEmail,
    password: 'password123',
    options: {
      data: {
        role: 'patient',
        first_name: 'Fresh',
        last_name: 'Test'
      }
    }
  })
  
  if (signupError) {
    console.log('❌ Signup still failing after restart:', signupError.message)
    
    // Try with admin API
    console.log('🔧 Trying admin API...')
    
    const { data: adminData, error: adminError } = await serviceSupabase.auth.admin.createUser({
      email: `admin.fresh.${Date.now()}@test.com`,
      password: 'admin123',
      email_confirm: true,
      user_metadata: {
        role: 'admin',
        first_name: 'Admin',
        last_name: 'Fresh'
      }
    })
    
    if (adminError) {
      console.log('❌ Admin API also failing:', adminError.message)
      console.log('🚨 Auth service is fundamentally broken')
      
      // Create a manual workaround
      console.log('🔧 Creating manual auth workaround...')
      await createManualWorkaround()
      
    } else {
      console.log('✅ Admin API works!')
      console.log('User created:', adminData.user?.email)
      
      await createProfileForUser(adminData.user)
      
      console.log('🎉 You can sign in with:')
      console.log('Email:', adminData.user.email)
      console.log('Password: admin123')
    }
  } else {
    console.log('✅ Signup works!')
    console.log('User created:', signupData.user?.email)
    
    await createProfileForUser(signupData.user)
  }
}

async function createProfileForUser(user) {
  if (!user?.id) return
  
  console.log('🔧 Creating profile manually...')
  
  const { data: profile, error: profileError } = await serviceSupabase
    .from('profiles')
    .insert({
      id: user.id,
      email: user.email,
      first_name: user.user_metadata?.first_name || 'User',
      last_name: user.user_metadata?.last_name || 'Unknown',
      role: user.user_metadata?.role || 'admin'
    })
    .select()
    .single()
    
  if (profile) {
    console.log('✅ Profile created:', profile.email)
    
    // Create admin record if needed
    if (profile.role === 'admin') {
      const { data: adminRecord } = await serviceSupabase
        .from('admins')
        .insert({
          profile_id: user.id,
          permissions: 'full'
        })
        .select()
        .single()
        
      if (adminRecord) {
        console.log('✅ Admin record created')
      }
    }
  } else {
    console.log('❌ Profile creation failed:', profileError?.message)
  }
}

async function createManualWorkaround() {
  console.log('🔧 Creating manual test users directly in database...')
  
  try {
    // Create admin user manually
    const adminId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
    
    // Insert into auth.users manually
    await serviceSupabase.rpc('exec_sql', { 
      sql: `
        INSERT INTO auth.users (
          id, 
          email, 
          encrypted_password, 
          email_confirmed_at, 
          created_at, 
          updated_at,
          confirmation_token
        ) VALUES (
          '${adminId}',
          'manual.admin@test.com',
          '$2a$10$dummy.encrypted.password.hash.here',
          NOW(),
          NOW(),
          NOW(),
          encode(gen_random_bytes(32), 'hex')
        )
        ON CONFLICT (id) DO NOTHING
      `
    })
    
    // Create profile
    const { data: profile } = await serviceSupabase
      .from('profiles')
      .insert({
        id: adminId,
        email: 'manual.admin@test.com',
        first_name: 'Manual',
        last_name: 'Admin',
        role: 'admin'
      })
      .select()
      .single()
      
    if (profile) {
      // Create admin record
      await serviceSupabase
        .from('admins')
        .insert({
          profile_id: adminId,
          permissions: 'full'
        })
        
      console.log('✅ Manual admin user created')
      console.log('📝 Note: This user was created manually and may not work with normal signin')
      console.log('But the webapp can use this for testing if signin is bypassed')
    }
    
  } catch (e) {
    console.log('❌ Manual creation failed:', e.message)
  }
}

testFreshAuth().catch(console.error)