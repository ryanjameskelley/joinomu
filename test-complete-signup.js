// Complete test to verify signup creates users in both auth and appropriate tables
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

// Use service role to see all data
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testCompleteSignup() {
  console.log('🔧 Testing Complete Signup Flow')
  console.log('===============================')

  // Apply the latest migration to ensure trigger is fixed
  console.log('📋 Applying latest migration...')

  // Test all three role types
  const testUsers = [
    {
      email: 'test.patient@example.com',
      password: 'password123',
      role: 'patient',
      first_name: 'John',
      last_name: 'Patient',
      date_of_birth: '1990-01-01',
      phone: '555-1234'
    },
    {
      email: 'test.admin@example.com', 
      password: 'password123',
      role: 'admin',
      first_name: 'Jane',
      last_name: 'Admin'
    },
    {
      email: 'test.provider@example.com',
      password: 'password123', 
      role: 'provider',
      first_name: 'Dr. Sarah',
      last_name: 'Provider',
      specialty: 'Family Medicine',
      license_number: 'MD123456',
      phone: '555-5678'
    }
  ]

  for (const testUser of testUsers) {
    console.log(`\n📋 Testing ${testUser.role} signup: ${testUser.email}`)
    
    // Create user with our auth service approach (simulating frontend signup)
    const { data, error } = await supabase.auth.signUp({
      email: testUser.email,
      password: testUser.password,
      options: {
        data: testUser // This will go to user_metadata
      }
    })

    if (error) {
      console.log(`❌ ${testUser.role} signup failed:`, error.message)
      continue
    }

    console.log(`✅ ${testUser.role} user created in auth.users:`, data.user.id)

    // Wait for trigger to process
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Check if profile was created
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()
    
    if (profileError) {
      console.log(`❌ ${testUser.role} profile not created:`, profileError.message)
    } else {
      console.log(`✅ ${testUser.role} profile created:`, {
        role: profile.role,
        name: `${profile.first_name} ${profile.last_name}`,
        email: profile.email
      })
    }

    // Check role-specific table
    let roleData = null
    let roleError = null

    if (testUser.role === 'patient') {
      const result = await supabase
        .from('patients')
        .select('*')
        .eq('profile_id', data.user.id)
        .single()
      roleData = result.data
      roleError = result.error
    } else if (testUser.role === 'admin') {
      const result = await supabase
        .from('admins')
        .select('*')
        .eq('profile_id', data.user.id)
        .single()
      roleData = result.data
      roleError = result.error
    } else if (testUser.role === 'provider') {
      const result = await supabase
        .from('providers')
        .select('*')
        .eq('profile_id', data.user.id)
        .single()
      roleData = result.data
      roleError = result.error
    }

    if (roleError) {
      console.log(`❌ ${testUser.role} role record not created:`, roleError.message)
    } else {
      console.log(`✅ ${testUser.role} role record created:`, roleData)
    }
  }

  // Summary of all users created
  console.log('\n📋 Summary of all users in database:')
  
  const { data: allAuth, error: authError } = await supabase.auth.admin.listUsers()
  if (!authError) {
    console.log(`\n👥 Users in auth.users: ${allAuth.users.length}`)
    allAuth.users.forEach(user => {
      console.log(`   - ${user.email} (${user.user_metadata?.role || 'no role'})`)
    })
  }

  const { data: allProfiles } = await supabase.from('profiles').select('*')
  console.log(`\n👥 Users in profiles: ${allProfiles?.length || 0}`)
  allProfiles?.forEach(profile => {
    console.log(`   - ${profile.email} (${profile.role})`)
  })

  const { data: allPatients } = await supabase.from('patients').select('*')
  console.log(`\n🏥 Patients: ${allPatients?.length || 0}`)

  const { data: allAdmins } = await supabase.from('admins').select('*')
  console.log(`\n⚡ Admins: ${allAdmins?.length || 0}`)

  const { data: allProviders } = await supabase.from('providers').select('*')
  console.log(`\n👨‍⚕️ Providers: ${allProviders?.length || 0}`)

  console.log('\n🎉 Complete signup test finished!')
  console.log('\n📍 Where to view your data:')
  console.log('   1. Supabase Studio: http://127.0.0.1:54323')
  console.log('   2. Authentication > Users tab (for auth.users)')
  console.log('   3. Table Editor > profiles, patients, admins, providers')
  console.log('   4. Or connect directly to PostgreSQL: postgresql://postgres:postgres@127.0.0.1:54322/postgres')
}

testCompleteSignup().catch(console.error)