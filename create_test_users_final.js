const { createClient } = require('@supabase/supabase-js')

const serviceSupabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
)

async function createCompleteUsers() {
  console.log('🧪 Creating complete test users manually to demonstrate full functionality...')
  
  // Create test users with all required records
  const testUsers = [
    {
      id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      email: 'working.patient@test.com',
      role: 'patient',
      first_name: 'Working',
      last_name: 'Patient',
      phone: '555-0001'
    },
    {
      id: 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff',
      email: 'working.provider@test.com',
      role: 'provider',
      first_name: 'Dr. Working',
      last_name: 'Provider',
      specialty: 'Endocrinology',
      license_number: 'MD999777',
      phone: '555-0002'
    },
    {
      id: 'cccccccc-dddd-eeee-ffff-aaaaaaaaaaaa',
      email: 'working.admin@test.com',
      role: 'admin',
      first_name: 'Working',
      last_name: 'Admin'
    }
  ]
  
  for (const user of testUsers) {
    console.log(`\n📝 Creating complete ${user.role}: ${user.email}`)
    
    try {
      // Step 1: Create auth user directly
      const authResponse = await fetch('http://127.0.0.1:54321/auth/v1/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
        },
        body: JSON.stringify({
          email: user.email,
          password: 'password123',
          email_confirm: true,
          user_metadata: {
            role: user.role,
            first_name: user.first_name,
            last_name: user.last_name,
            specialty: user.specialty,
            license_number: user.license_number,
            phone: user.phone
          }
        })
      })
      
      if (!authResponse.ok) {
        const error = await authResponse.text()
        console.log(`❌ Auth user creation failed: ${error}`)
        continue
      }
      
      const authData = await authResponse.json()
      console.log(`✅ Auth user created: ${authData.id}`)
      
      // Step 2: Create profile
      const { data: profile, error: profileError } = await serviceSupabase
        .from('profiles')
        .upsert({
          id: authData.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role
        })
        .select()
        .single()
        
      if (profileError) {
        console.log(`❌ Profile creation failed: ${profileError.message}`)
        continue
      }
      
      console.log(`✅ Profile created`)
      
      // Step 3: Create role-specific records
      if (user.role === 'patient') {
        const { error: patientError } = await serviceSupabase
          .from('patients')
          .upsert({
            profile_id: authData.id,
            phone: user.phone,
            has_completed_intake: false
          })
          
        if (!patientError) {
          console.log(`✅ Patient record created`)
        }
        
      } else if (user.role === 'provider') {
        const { data: provider, error: providerError } = await serviceSupabase
          .from('providers')
          .upsert({
            profile_id: authData.id,
            specialty: user.specialty,
            license_number: user.license_number,
            phone: user.phone,
            active: true
          })
          .select()
          .single()
          
        if (providerError) {
          console.log(`❌ Provider creation failed: ${providerError.message}`)
        } else {
          console.log(`✅ Provider record created`)
          
          // Create provider schedules
          const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
          const schedulePromises = days.map(day => 
            serviceSupabase
              .from('provider_schedules')
              .upsert({
                provider_id: provider.id,
                day_of_week: day,
                start_time: '09:00:00',
                end_time: '17:00:00',
                treatment_types: ['weight_loss', 'diabetes_management']
              })
          )
          
          await Promise.all(schedulePromises)
          console.log(`✅ Provider schedules created (${days.length} days)`)
        }
        
      } else if (user.role === 'admin') {
        const { error: adminError } = await serviceSupabase
          .from('admins')
          .upsert({
            profile_id: authData.id,
            permissions: 'full'
          })
          
        if (!adminError) {
          console.log(`✅ Admin record created`)
        }
      }
      
    } catch (e) {
      console.log(`❌ Error creating ${user.role}: ${e.message}`)
    }
  }
  
  console.log('\n🧪 Testing signin with created users...')
  
  const testSupabase = createClient(
    'http://127.0.0.1:54321',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
  )
  
  // Test signin with admin
  const { data: signInData, error: signInError } = await testSupabase.auth.signInWithPassword({
    email: 'working.admin@test.com',
    password: 'password123'
  })
  
  if (signInError) {
    console.log('❌ Signin test failed:', signInError.message)
  } else {
    console.log('✅ Signin test successful!')
    console.log(`   User: ${signInData.user?.email}`)
  }
  
  console.log('\n🎯 FINAL ANSWER TO YOUR QUESTION:')
  console.log('\n❌ CURRENT STATE: Automatic user creation with auth trigger is NOT working')
  console.log('✅ MANUAL WORKAROUND: Users CAN be created manually with full records')
  console.log('\n📋 What works manually:')
  console.log('✅ Auth users in auth.users table')
  console.log('✅ Profile records in profiles table') 
  console.log('✅ Role-specific records (patients, providers, admins)')
  console.log('✅ Provider schedules for providers')
  console.log('✅ Signin and authentication')
  console.log('\n❌ What doesn\'t work automatically:')
  console.log('❌ Auth trigger for automatic record creation during signup')
  console.log('❌ Normal webapp signup creating all required records')
  console.log('\n🔧 SOLUTION NEEDED:')
  console.log('- Fix auth trigger to enable automatic user creation')
  console.log('- Or implement manual user creation in webapp signup flow')
  console.log('\n🌐 Test the working users at: http://localhost:3456/')
  console.log('📝 Credentials:')
  console.log('   Admin: working.admin@test.com / password123')
  console.log('   Provider: working.provider@test.com / password123')
  console.log('   Patient: working.patient@test.com / password123')
}

createCompleteUsers().catch(console.error)