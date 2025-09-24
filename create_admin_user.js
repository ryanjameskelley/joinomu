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

    // Create admin user
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
      return
    }

    console.log('✅ Created admin@test.com:', adminAuth.user.id)

    // Wait a moment for triggers to process
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Verify admin record was created
    const { data: adminRecord } = await supabase
      .from('admins')
      .select('id')
      .eq('profile_id', adminAuth.user.id)
      .single()

    if (adminRecord) {
      console.log('✅ Admin record created in database')
    } else {
      console.log('❌ Admin record not found in database - check triggers')
    }

    console.log('🎉 admin@test.com created successfully!')
    console.log('📝 Login credentials: admin@test.com / password')

  } catch (error) {
    console.error('❌ Script error:', error)
  }
}

createAdminUser()