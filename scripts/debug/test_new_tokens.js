const { createClient } = require('@supabase/supabase-js')

// Use the new token format from updated Supabase CLI
const supabase = createClient(
  'http://127.0.0.1:54321',
  'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'
)

const serviceSupabase = createClient(
  'http://127.0.0.1:54321',
  'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'
)

async function testNewTokens() {
  console.log('🧪 Testing auth with new token format...')
  
  // Test basic signup
  const testEmail = `newtoken.test.${Date.now()}@example.com`
  
  console.log('Testing signup with new tokens...')
  const { data: signupData, error: signupError } = await supabase.auth.signUp({
    email: testEmail,
    password: 'password123',
    options: {
      data: {
        role: 'patient',
        first_name: 'NewToken',
        last_name: 'Test'
      }
    }
  })
  
  if (signupError) {
    console.log('❌ Signup failed:', signupError.message)
    console.log('Error details:', signupError)
  } else {
    console.log('✅ Signup successful with new tokens!')
    console.log('User created:', signupData.user?.email)
    console.log('User ID:', signupData.user?.id)
    console.log('Session:', signupData.session ? 'Created' : 'None')
  }
  
  // Test admin creation
  console.log('\n🔧 Testing admin user creation with new tokens...')
  
  const { data: adminData, error: adminError } = await serviceSupabase.auth.admin.createUser({
    email: 'new.admin@test.com',
    password: 'admin123',
    email_confirm: true,
    user_metadata: {
      role: 'admin',
      first_name: 'New',
      last_name: 'Admin'
    }
  })
  
  if (adminError) {
    console.log('❌ Admin creation failed:', adminError.message)
    console.log('Error details:', adminError)
  } else {
    console.log('✅ Admin creation successful!')
    console.log('Admin email:', adminData.user?.email)
    console.log('Admin ID:', adminData.user?.id)
    
    // Create profile manually since we don't have triggers
    if (adminData.user?.id) {
      console.log('Creating admin profile...')
      
      const { data: profile, error: profileError } = await serviceSupabase
        .from('profiles')
        .insert({
          id: adminData.user.id,
          email: adminData.user.email,
          first_name: 'New',
          last_name: 'Admin',
          role: 'admin'
        })
        .select()
        .single()
        
      if (profile) {
        console.log('✅ Admin profile created')
        
        // Create admin record
        const { data: adminRecord } = await serviceSupabase
          .from('admins')
          .insert({
            profile_id: adminData.user.id,
            permissions: 'full'
          })
          .select()
          .single()
          
        if (adminRecord) {
          console.log('✅ Admin record created')
        }
      } else {
        console.log('❌ Admin profile creation failed:', profileError?.message)
      }
    }
    
    // Test signin
    console.log('\n🔐 Testing signin with new admin...')
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'new.admin@test.com',
      password: 'admin123'
    })
    
    if (signInError) {
      console.log('❌ Signin failed:', signInError.message)
    } else {
      console.log('✅ Signin successful!')
      console.log('Signed in as:', signInData.user?.email)
      console.log('Session active:', signInData.session ? 'YES' : 'NO')
    }
  }
  
  console.log('\n🎉 New token testing completed!')
  
  if (!adminError && !signInError) {
    console.log('\n✅ AUTH SYSTEM IS NOW WORKING!')
    console.log('🚀 Ready to test admin features!')
    console.log('\n📝 Admin Login Credentials:')
    console.log('Email: new.admin@test.com')
    console.log('Password: admin123')
    console.log('\n🌐 Webapp URL: http://localhost:4567/')
  }
}

testNewTokens().catch(console.error)