const { createClient } = require('@supabase/supabase-js')

const serviceSupabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
)

async function createAuthBypassSolution() {
  console.log('🔧 Creating auth bypass solution for testing...')
  
  // Create test users directly in the database with all the required records
  const testUsers = [
    {
      id: 'test-admin-001',
      email: 'admin@test.com',
      role: 'admin',
      first_name: 'Test',
      last_name: 'Admin'
    },
    {
      id: 'test-patient-001',
      email: 'patient@test.com',
      role: 'patient',
      first_name: 'Test',
      last_name: 'Patient'
    }
  ]
  
  for (const user of testUsers) {
    console.log(`Creating ${user.role}: ${user.email}`)
    
    try {
      // Create auth user with a proper password hash
      await serviceSupabase.rpc('exec_sql', { 
        sql: `
          INSERT INTO auth.users (
            id, 
            email, 
            encrypted_password, 
            email_confirmed_at, 
            created_at, 
            updated_at,
            confirmation_token,
            raw_user_meta_data
          ) VALUES (
            '${user.id}',
            '${user.email}',
            '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- password: secret
            NOW(),
            NOW(),
            NOW(),
            encode(gen_random_bytes(32), 'hex'),
            '{"role": "${user.role}", "first_name": "${user.first_name}", "last_name": "${user.last_name}"}'::jsonb
          )
          ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data
        `
      })
      
      // Create profile
      const { data: profile, error: profileError } = await serviceSupabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role
        })
        .select()
        .single()
        
      if (profileError && !profileError.message.includes('duplicate')) {
        console.log(`❌ Profile creation failed for ${user.email}:`, profileError.message)
        continue
      }
      
      // Create role-specific record
      if (user.role === 'admin') {
        await serviceSupabase
          .from('admins')
          .upsert({
            profile_id: user.id,
            permissions: 'full'
          })
      } else if (user.role === 'patient') {
        await serviceSupabase
          .from('patients')
          .upsert({
            profile_id: user.id,
            has_completed_intake: false
          })
      }
      
      console.log(`✅ Created ${user.role} user: ${user.email}`)
      
    } catch (e) {
      console.log(`❌ Failed to create ${user.email}:`, e.message)
    }
  }
  
  console.log('\n🎉 Auth bypass solution completed!')
  console.log('\n📝 Test Credentials:')
  console.log('Admin User:')
  console.log('  Email: admin@test.com')
  console.log('  Password: secret')
  console.log('\nPatient User:')
  console.log('  Email: patient@test.com')
  console.log('  Password: secret')
  
  console.log('\n💡 Usage:')
  console.log('1. Go to the webapp: http://localhost:8243/')
  console.log('2. Try signing in with the credentials above')
  console.log('3. If signin still fails, the webapp auth logic may need adjustment')
  console.log('4. The admin features are fully implemented and ready for testing')
  
  // Test if signin works now
  console.log('\n🧪 Testing signin with created users...')
  
  const testSupabase = createClient(
    'http://127.0.0.1:54321',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
  )
  
  const { data: signInData, error: signInError } = await testSupabase.auth.signInWithPassword({
    email: 'admin@test.com',
    password: 'secret'
  })
  
  if (signInError) {
    console.log('❌ Signin test failed:', signInError.message)
    console.log('The auth service may need additional configuration')
  } else {
    console.log('✅ Signin test successful!')
    console.log('User ID:', signInData.user?.id)
    console.log('Email:', signInData.user?.email)
  }
}

createAuthBypassSolution().catch(console.error)