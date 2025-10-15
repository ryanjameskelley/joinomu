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

async function checkWatsonUser() {
  try {
    console.log('🔍 Looking up dr.watson@test.com user...')
    
    // List all users
    const { data: users, error } = await supabase.auth.admin.listUsers()
    
    if (error) {
      console.error('❌ Error listing users:', error)
      return
    }
    
    const watsonUser = users.users.find(u => u.email === 'dr.watson@test.com')
    
    if (!watsonUser) {
      console.error('❌ dr.watson@test.com not found in auth.users')
      return
    }
    
    console.log('👤 Found dr.watson@test.com:')
    console.log(`   Auth ID: ${watsonUser.id}`)
    console.log(`   Email: ${watsonUser.email}`)
    console.log(`   Created: ${watsonUser.created_at}`)
    
    // Check if this ID exists in profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', watsonUser.id)
      .single()
    
    if (profileError) {
      console.log('❌ Profile not found:', profileError.message)
      console.log('⚠️  This user may not have a profile record')
    } else {
      console.log('✅ Profile found:')
      console.log(`   Role: ${profile.role}`)
      console.log(`   Full Name: ${profile.full_name}`)
    }
    
    // Check if the ID looks like a proper UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(watsonUser.id)) {
      console.log('⚠️  WARNING: Auth ID does not appear to be a valid UUID format')
      console.log('   This may cause authentication issues')
    } else {
      console.log('✅ Auth ID is a valid UUID format')
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkWatsonUser()