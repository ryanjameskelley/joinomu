const { createClient } = require('@supabase/supabase-js')

// Local Supabase configuration
const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function resetPassword() {
  try {
    console.log('🔄 Resetting password for dr.watson@test.com...')
    
    const { data, error } = await supabase.auth.admin.updateUserById(
      'fe5fee47-896d-4ac7-ba2b-d35ef4589eee', // Replace with actual user ID if different
      {
        password: 'password'
      }
    )
    
    if (error) {
      console.error('❌ Error resetting password:', error)
      
      // Try alternative method - find user by email first
      console.log('🔍 Looking up user by email...')
      const { data: users, error: listError } = await supabase.auth.admin.listUsers()
      
      if (listError) {
        console.error('❌ Error listing users:', listError)
        return
      }
      
      const user = users.users.find(u => u.email === 'dr.watson@test.com')
      if (!user) {
        console.error('❌ User not found: dr.watson@test.com')
        return
      }
      
      console.log(`🔄 Found user ID: ${user.id}`)
      const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        {
          password: 'password'
        }
      )
      
      if (updateError) {
        console.error('❌ Error updating password:', updateError)
      } else {
        console.log('✅ Password reset successfully for dr.watson@test.com')
        console.log('📧 Email: dr.watson@test.com')
        console.log('🔑 Password: password')
      }
      
    } else {
      console.log('✅ Password reset successfully for dr.watson@test.com')
      console.log('📧 Email: dr.watson@test.com')
      console.log('🔑 Password: password')
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

resetPassword()