const { createClient } = require('@supabase/supabase-js')
const { v4: uuidv4 } = require('uuid')

// Local Supabase configuration
const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function fixWatsonId() {
  try {
    const oldId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
    const newId = uuidv4()
    
    console.log('🔧 Fixing Dr. Watson\'s ID...')
    console.log(`   Old ID: ${oldId}`)
    console.log(`   New ID: ${newId}`)
    
    // First create the auth user with the new ID
    console.log('👤 Creating auth user...')
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'dr.watson@test.com',
      password: 'password',
      email_confirm: true,
      user_metadata: {
        full_name: 'Dr. John Watson'
      }
    })
    
    if (authError) {
      console.error('❌ Error creating auth user:', authError.message)
      return
    }
    
    const actualUserId = authUser.user.id
    console.log(`✅ Auth user created with ID: ${actualUserId}`)
    
    // Update profiles table
    console.log('📝 Updating profiles table...')
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ id: actualUserId })
      .eq('id', oldId)
    
    if (profileError) {
      console.error('❌ Error updating profiles:', profileError)
    } else {
      console.log('✅ Profiles table updated')
    }
    
    // Update providers table
    console.log('🏥 Updating providers table...')
    const { error: providerError } = await supabase
      .from('providers')
      .update({ id: actualUserId })
      .eq('id', oldId)
    
    if (providerError) {
      console.error('❌ Error updating providers:', providerError)
    } else {
      console.log('✅ Providers table updated')
    }
    
    // Update any other related tables that might reference the old ID
    const tablesToUpdate = [
      'patient_assignments',
      'provider_schedules', 
      'provider_availability_overrides',
      'appointments'
    ]
    
    for (const table of tablesToUpdate) {
      console.log(`🔄 Checking ${table} table...`)
      const { error: updateError } = await supabase
        .from(table)
        .update({ provider_id: actualUserId })
        .eq('provider_id', oldId)
      
      if (updateError && !updateError.message.includes('relation') && !updateError.message.includes('does not exist')) {
        console.error(`❌ Error updating ${table}:`, updateError.message)
      } else {
        console.log(`✅ ${table} table updated (or no records to update)`)
      }
    }
    
    console.log('\n🎉 Dr. Watson ID fixed successfully!')
    console.log('📧 Email: dr.watson@test.com')
    console.log('🔑 Password: password')
    console.log(`🆔 New Auth ID: ${actualUserId}`)
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

fixWatsonId()