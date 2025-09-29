const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'http://127.0.0.1:54321',
  'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'
)

const serviceSupabase = createClient(
  'http://127.0.0.1:54321',
  'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'
)

async function testUpdatedAuth() {
  console.log('🧪 Testing auth with updated Supabase CLI v2.45.5...')
  
  // Test 1: Basic signup
  const testEmail = `test.updated.${Date.now()}@example.com`
  
  console.log('Testing signup...')
  const { data: signupData, error: signupError } = await supabase.auth.signUp({
    email: testEmail,
    password: 'password123',
    options: {
      data: {
        role: 'patient',
        first_name: 'Updated',
        last_name: 'Test'
      }
    }
  })
  
  if (signupError) {
    console.log('❌ Signup still failing:', signupError.message)
  } else {
    console.log('✅ Signup successful!')
    console.log('User created:', signupData.user?.email)
    console.log('User ID:', signupData.user?.id)
    
    if (signupData.user?.id) {
      // Check if profile was created by trigger (if any)
      const { data: profile } = await serviceSupabase
        .from('profiles')
        .select('*')
        .eq('id', signupData.user.id)
        .single()
        
      if (profile) {
        console.log('✅ Profile auto-created by trigger!')
        console.log('Profile role:', profile.role)
      } else {
        console.log('ℹ️ No profile auto-created, creating manually...')
        
        // Create profile manually
        const { data: newProfile, error: profileError } = await serviceSupabase
          .from('profiles')
          .insert({
            id: signupData.user.id,
            email: signupData.user.email,
            first_name: 'Updated',
            last_name: 'Test',
            role: 'patient'
          })
          .select()
          .single()
          
        if (newProfile) {
          console.log('✅ Profile created manually')
          
          // Create patient record
          const { data: patient } = await serviceSupabase
            .from('patients')
            .insert({
              profile_id: signupData.user.id,
              has_completed_intake: false
            })
            .select()
            .single()
            
          if (patient) {
            console.log('✅ Patient record created')
          }
        } else {
          console.log('❌ Manual profile creation failed:', profileError?.message)
        }
      }
    }
  }
  
  // Test 2: Admin user creation
  console.log('\n🔧 Testing admin user creation...')
  
  const { data: adminData, error: adminError } = await serviceSupabase.auth.admin.createUser({
    email: 'admin@test.com',
    password: 'admin123',
    email_confirm: true,
    user_metadata: {
      role: 'admin',
      first_name: 'Admin',
      last_name: 'User'
    }
  })
  
  if (adminError) {
    console.log('❌ Admin creation failed:', adminError.message)
  } else {
    console.log('✅ Admin user created!')
    console.log('Admin email:', adminData.user?.email)
    console.log('Admin ID:', adminData.user?.id)
    
    if (adminData.user?.id) {
      // Create admin profile
      const { data: adminProfile } = await serviceSupabase
        .from('profiles')
        .insert({
          id: adminData.user.id,
          email: adminData.user.email,
          first_name: 'Admin',
          last_name: 'User',
          role: 'admin'
        })
        .select()
        .single()
        
      if (adminProfile) {
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
      }
    }
  }
  
  // Test 3: Sign in with created admin
  if (!adminError && adminData.user) {
    console.log('\n🔐 Testing signin with admin user...')
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'admin@test.com',
      password: 'admin123'
    })
    
    if (signInError) {
      console.log('❌ Signin failed:', signInError.message)
    } else {
      console.log('✅ Signin successful!')
      console.log('Signed in as:', signInData.user?.email)
      
      // Test role lookup
      const { data: userProfile } = await serviceSupabase
        .from('profiles')
        .select('role')
        .eq('id', signInData.user?.id)
        .single()
        
      if (userProfile) {
        console.log('✅ Role lookup successful:', userProfile.role)
      }
    }
  }
  
  console.log('\n🎉 Auth testing completed!')
  console.log('\n📝 Summary:')
  console.log('- Updated Supabase CLI from v2.40.7 to v2.45.5')
  console.log('- Tested auth functionality with new version')
  
  if (!adminError && !signupError) {
    console.log('- ✅ Auth system is now working!')
    console.log('- You can sign in to the webapp with:')
    console.log('  Email: admin@test.com')
    console.log('  Password: admin123')
    console.log('- Admin patient management features are ready for testing!')
  }
}

testUpdatedAuth().catch(console.error)