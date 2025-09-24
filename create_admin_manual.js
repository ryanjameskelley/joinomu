const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createAdminManual() {
  try {
    console.log('🔄 Temporarily disabling trigger and creating admin manually...')

    // Temporarily disable the trigger
    await supabase.rpc('exec_sql', {
      sql: 'DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users'
    }).catch(() => {})

    // Try to create the user without trigger first
    const { data: adminAuth, error: adminAuthError } = await supabase.auth.admin.createUser({
      email: 'admin@test.com',
      password: 'password',
      email_confirm: true
    })

    if (adminAuthError) {
      console.error('❌ Error creating admin user:', adminAuthError)
      return
    }

    console.log('✅ Created admin auth user:', adminAuth.user.id)

    // Now manually create the profile and admin records
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: adminAuth.user.id,
        email: 'admin@test.com',
        role: 'admin',
        first_name: 'Admin',
        last_name: 'User'
      })

    if (profileError) {
      console.error('❌ Error creating profile:', profileError)
    } else {
      console.log('✅ Profile created successfully')
    }

    // Create admin record
    const { error: adminError } = await supabase
      .from('admins')
      .insert({
        profile_id: adminAuth.user.id,
        permissions: ['dashboard', 'patients', 'providers', 'assignments'],
        active: true
      })

    if (adminError) {
      console.error('❌ Error creating admin record:', adminError)
    } else {
      console.log('✅ Admin record created successfully')
    }

    // Re-enable the trigger
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TRIGGER on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW EXECUTE FUNCTION handle_new_user();
      `
    }).catch(() => {})

    console.log('✅ Trigger re-enabled')
    console.log('🎉 admin@test.com created successfully!')
    console.log('📝 Login credentials: admin@test.com / password')

  } catch (error) {
    console.error('❌ Script error:', error)
  }
}

createAdminManual()