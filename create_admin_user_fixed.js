const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createAdminUser() {
  try {
    console.log('🔄 Creating admin@test.com with password "password"...')

    // Create admin user with raw_user_meta_data that matches trigger expectations
    const { data: adminAuth, error: adminAuthError } = await supabase.auth.admin.createUser({
      email: 'admin@test.com',
      password: 'password',
      email_confirm: true,
      user_metadata: {
        role: 'admin',
        first_name: 'Admin',
        last_name: 'User'
      }
    })

    if (adminAuthError) {
      console.error('❌ Error creating admin user:', adminAuthError)
      
      // Let's try to get more details about the error
      console.log('Error details:', {
        message: adminAuthError.message,
        status: adminAuthError.status,
        code: adminAuthError.code
      })
      return
    }

    console.log('✅ Created admin@test.com:', adminAuth.user.id)
    console.log('User metadata:', adminAuth.user.user_metadata)
    console.log('Raw user metadata:', adminAuth.user.raw_user_meta_data)

    // Wait a moment for triggers to process
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Verify profile record was created
    const { data: profileRecord, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', adminAuth.user.id)
      .single()

    if (profileError) {
      console.log('❌ Profile record error:', profileError)
    } else if (profileRecord) {
      console.log('✅ Profile record created:', profileRecord)
    }

    // Verify admin record was created
    const { data: adminRecord, error: adminError } = await supabase
      .from('admins')
      .select('*')
      .eq('profile_id', adminAuth.user.id)
      .single()

    if (adminError) {
      console.log('❌ Admin record error:', adminError)
    } else if (adminRecord) {
      console.log('✅ Admin record created:', adminRecord)
    }

    console.log('🎉 admin@test.com created successfully!')
    console.log('📝 Login credentials: admin@test.com / password')

  } catch (error) {
    console.error('❌ Script error:', error)
  }
}

createAdminUser()