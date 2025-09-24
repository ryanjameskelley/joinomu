const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createAdminSimple() {
  try {
    console.log('🔄 Creating admin@test.com with minimal approach...')

    // Try with minimal metadata first
    const { data: adminAuth, error: adminAuthError } = await supabase.auth.admin.createUser({
      email: 'admin@test.com',
      password: 'password',
      email_confirm: true
    })

    if (adminAuthError) {
      console.error('❌ Error creating admin user (minimal):', adminAuthError)
      
      // If that fails, check if user already exists
      const { data: users } = await supabase.auth.admin.listUsers()
      const existingUser = users.users.find(u => u.email === 'admin@test.com')
      if (existingUser) {
        console.log('✅ Found existing admin@test.com user:', existingUser.id)
        
        // Update password
        const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
          password: 'password'
        })
        
        if (updateError) {
          console.error('❌ Error updating password:', updateError)
        } else {
          console.log('✅ Password updated to "password"')
        }
        
        return
      }
      
      console.log('❌ Could not create or find admin user')
      return
    }

    console.log('✅ Created admin auth user:', adminAuth.user.id)

    // Wait for trigger
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Check if profile was created by trigger
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', adminAuth.user.id)
      .single()

    if (profileError || !profile) {
      console.log('⚠️  Profile not created by trigger, creating manually...')
      
      // Manually create profile
      const { error: manualProfileError } = await supabase
        .from('profiles')
        .insert({
          id: adminAuth.user.id,
          email: 'admin@test.com',
          role: 'admin',
          first_name: 'Admin',
          last_name: 'User'
        })

      if (manualProfileError) {
        console.error('❌ Error creating profile manually:', manualProfileError)
      } else {
        console.log('✅ Profile created manually')
      }
    } else {
      console.log('✅ Profile created by trigger:', profile)
    }

    // Check if admin record was created
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('*')
      .eq('profile_id', adminAuth.user.id)
      .single()

    if (adminError || !admin) {
      console.log('⚠️  Admin record not created by trigger, creating manually...')
      
      // Manually create admin record
      const { error: manualAdminError } = await supabase
        .from('admins')
        .insert({
          profile_id: adminAuth.user.id,
          permissions: ['dashboard', 'patients', 'providers', 'assignments'],
          active: true
        })

      if (manualAdminError) {
        console.error('❌ Error creating admin record manually:', manualAdminError)
      } else {
        console.log('✅ Admin record created manually')
      }
    } else {
      console.log('✅ Admin record created by trigger:', admin)
    }

    console.log('🎉 admin@test.com created successfully!')
    console.log('📝 Login credentials: admin@test.com / password')

  } catch (error) {
    console.error('❌ Script error:', error)
  }
}

createAdminSimple()