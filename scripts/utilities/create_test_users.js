const { createClient } = require('@supabase/supabase-js')

// Use your local Supabase instance with service role key for admin operations
const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createTestUsers() {
  console.log('👥 Creating test user accounts...\n')

  const testUsers = [
    // Patients
    { email: 'patient1@test.com', password: 'password123', role: 'patient', firstName: 'Sarah', lastName: 'Johnson' },
    { email: 'patient2@test.com', password: 'password123', role: 'patient', firstName: 'Michael', lastName: 'Roberts' },
    { email: 'patient3@test.com', password: 'password123', role: 'patient', firstName: 'Jennifer', lastName: 'Martinez' },
    { email: 'patient4@test.com', password: 'password123', role: 'patient', firstName: 'David', lastName: 'Anderson' },
    
    // Admin
    { email: 'admin@test.com', password: 'password123', role: 'admin', firstName: 'Admin', lastName: 'User' },
    
    // Providers
    { email: 'provider1@test.com', password: 'password123', role: 'provider', firstName: 'Dr. Emily', lastName: 'Watson' },
    { email: 'provider2@test.com', password: 'password123', role: 'provider', firstName: 'Dr. James', lastName: 'Wilson' }
  ]

  try {
    for (const user of testUsers) {
      console.log(`Creating ${user.role}: ${user.email}`)
      
      // Create the auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true
      })

      if (authError) {
        console.error(`❌ Error creating auth user ${user.email}:`, authError.message)
        continue
      }

      console.log(`✅ Created auth user: ${user.email}`)

      // Update the profile that was created by the trigger
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: user.firstName,
          last_name: user.lastName,
          role: user.role
        })
        .eq('id', authData.user.id)

      if (profileError) {
        console.error(`❌ Error updating profile for ${user.email}:`, profileError.message)
      } else {
        console.log(`✅ Updated profile for: ${user.firstName} ${user.lastName}`)
      }

      // Update role-specific records based on role
      if (user.role === 'patient') {
        const { error: patientError } = await supabase
          .from('patients')
          .update({
            phone: `555-010${testUsers.indexOf(user) + 1}`,
            has_completed_intake: true
          })
          .eq('profile_id', authData.user.id)

        if (patientError) {
          console.error(`❌ Error updating patient record:`, patientError.message)
        }
      } else if (user.role === 'admin') {
        const { error: adminError } = await supabase
          .from('admins')
          .update({
            permissions: ['all']
          })
          .eq('profile_id', authData.user.id)

        if (adminError) {
          console.error(`❌ Error updating admin record:`, adminError.message)
        }
      } else if (user.role === 'provider') {
        const specialty = user.firstName.includes('Emily') ? 'Endocrinology' : 'Men\'s Health'
        const { error: providerError } = await supabase
          .from('providers')
          .update({
            specialty: specialty,
            license_number: `LIC${testUsers.indexOf(user)}`,
            phone: `555-020${testUsers.indexOf(user)}`,
            active: true
          })
          .eq('profile_id', authData.user.id)

        if (providerError) {
          console.error(`❌ Error updating provider record:`, providerError.message)
        }
      }

      console.log('---')
    }

    console.log('\n🎉 Test users created successfully!')
    console.log('\n📋 Login credentials:')
    testUsers.forEach(user => {
      console.log(`${user.role.toUpperCase()}: ${user.email} / ${user.password}`)
    })

    console.log('\n✅ You can now login to test the medication system!')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

createTestUsers()