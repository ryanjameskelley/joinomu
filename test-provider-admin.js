// Test provider and admin creation
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testProviderAndAdmin() {
  console.log('🧪 Testing provider and admin creation')
  console.log('=====================================')

  // Test provider creation
  console.log('\n👨‍⚕️ Creating provider...')
  const providerEmail = `provider-test-${Date.now()}@example.com`
  const { data: providerUser, error: providerError } = await supabase.auth.admin.createUser({
    email: providerEmail,
    password: 'password123',
    user_metadata: {
      role: 'provider',
      firstName: 'Dr. Test',
      lastName: 'Provider',
      specialty: 'Cardiology',
      licenseNumber: 'MD789456',
      phone: '(555) 123-4567'
    }
  })

  if (providerError) {
    console.log('❌ Provider creation failed:', providerError)
  } else {
    console.log('✅ Provider created:', providerUser.user.id)
    
    // Wait for trigger
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Check provider profile and provider record
    const { data: providerProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', providerUser.user.id)
      .single()
    
    const { data: providerRecord } = await supabase
      .from('providers')
      .select('*')
      .eq('profile_id', providerUser.user.id)
      .single()
    
    console.log('📋 Provider Profile:', providerProfile)
    console.log('👨‍⚕️ Provider Record:', providerRecord)
  }

  // Test admin creation
  console.log('\n👑 Creating admin...')
  const adminEmail = `admin-test-${Date.now()}@example.com`
  const { data: adminUser, error: adminError } = await supabase.auth.admin.createUser({
    email: adminEmail,
    password: 'password123',
    user_metadata: {
      role: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      phone: '(555) 987-6543'
    }
  })

  if (adminError) {
    console.log('❌ Admin creation failed:', adminError)
  } else {
    console.log('✅ Admin created:', adminUser.user.id)
    
    // Wait for trigger
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Check admin profile and admin record
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', adminUser.user.id)
      .single()
    
    const { data: adminRecord } = await supabase
      .from('admins')
      .select('*')
      .eq('profile_id', adminUser.user.id)
      .single()
    
    console.log('📋 Admin Profile:', adminProfile)
    console.log('👑 Admin Record:', adminRecord)
  }

  // Show final counts
  console.log('\n📊 Final table counts:')
  const { data: allProfiles } = await supabase.from('profiles').select('id, role, first_name, last_name')
  const { data: allPatients } = await supabase.from('patients').select('profile_id')
  const { data: allProviders } = await supabase.from('providers').select('profile_id, specialty, license_number')
  const { data: allAdmins } = await supabase.from('admins').select('profile_id, permissions')

  console.log(`Profiles: ${allProfiles?.length || 0}`)
  allProfiles?.forEach(p => console.log(`  - ${p.first_name} ${p.last_name} (${p.role})`))
  
  console.log(`Patients: ${allPatients?.length || 0}`)
  console.log(`Providers: ${allProviders?.length || 0}`)
  allProviders?.forEach(p => console.log(`  - Specialty: ${p.specialty}, License: ${p.license_number}`))
  
  console.log(`Admins: ${allAdmins?.length || 0}`)
  allAdmins?.forEach(a => console.log(`  - Permissions: ${a.permissions?.join(', ')}`))
}

testProviderAndAdmin().catch(console.error)