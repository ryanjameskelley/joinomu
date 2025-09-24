const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function changeAdminPassword() {
  try {
    console.log('🔄 Changing admin@test.com password to "password"...')

    // Get the user first
    const { data: users, error: listError } = await supabase.auth.admin.listUsers()
    if (listError) {
      console.error('❌ Error listing users:', listError)
      return
    }

    const adminUser = users.users.find(user => user.email === 'admin@test.com')
    if (!adminUser) {
      console.error('❌ admin@test.com user not found')
      return
    }

    console.log('✅ Found admin user:', adminUser.id)

    // Update the password
    const { data, error } = await supabase.auth.admin.updateUserById(adminUser.id, {
      password: 'password'
    })

    if (error) {
      console.error('❌ Error updating password:', error)
      return
    }

    console.log('✅ Successfully changed admin@test.com password to "password"')
    console.log('🎉 You can now login with admin@test.com / password')

  } catch (error) {
    console.error('❌ Script error:', error)
  }
}

changeAdminPassword()