// Test to see what's happening with user creation
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkCurrentUsers() {
  console.log('🔍 Checking current state of local database')
  console.log('===========================================')

  // Check auth users
  const { data: authUsers } = await supabase.auth.admin.listUsers()
  console.log(`\n👥 Users in auth.users: ${authUsers.users.length}`)
  authUsers.users.forEach(user => {
    console.log(`   - ${user.email} (ID: ${user.id}) - Created: ${user.created_at}`)
    console.log(`     Metadata:`, user.user_metadata)
    console.log(`     Raw metadata:`, user.raw_user_meta_data)
  })

  // Check profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')

  if (profilesError) {
    console.log('❌ Error reading profiles:', profilesError)
  } else {
    console.log(`\n📋 Profiles: ${profiles.length}`)
    profiles.forEach(profile => {
      console.log(`   - ${profile.email} (${profile.role}) - ${profile.first_name} ${profile.last_name}`)
    })
  }

  // Check patients
  const { data: patients, error: patientsError } = await supabase
    .from('patients')
    .select('*')

  if (patientsError) {
    console.log('❌ Error reading patients:', patientsError)
  } else {
    console.log(`\n🏥 Patients: ${patients.length}`)
    patients.forEach(patient => {
      console.log(`   - Profile ID: ${patient.profile_id}`)
    })
  }

  // Check if trigger exists
  const { data: triggers, error: triggerError } = await supabase
    .from('information_schema.triggers')
    .select('trigger_name, event_manipulation, action_statement')
    .eq('trigger_name', 'on_auth_user_created')

  if (triggerError) {
    console.log('❌ Error checking triggers:', triggerError)
  } else {
    console.log(`\n🔧 Triggers found: ${triggers.length}`)
    triggers.forEach(trigger => {
      console.log(`   - ${trigger.trigger_name} on ${trigger.event_manipulation}`)
    })
  }

  // Test creating a user manually to see the trigger fire
  console.log('\n🧪 Testing manual user creation to trigger...')
  
  const testEmail = `trigger-test-${Date.now()}@example.com`
  const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: 'password123',
    user_metadata: {
      role: 'patient',
      firstName: 'Trigger',
      lastName: 'Test'
    }
  })

  if (createError) {
    console.log('❌ User creation failed:', createError)
  } else {
    console.log('✅ User created:', newUser.user.id)
    
    // Wait for trigger
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Check if profile was created
    const { data: newProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', newUser.user.id)
      .single()
    
    if (newProfile) {
      console.log('✅ Trigger worked! Profile created:', newProfile)
    } else {
      console.log('❌ Trigger failed - no profile created')
    }
  }
}

checkCurrentUsers().catch(console.error)