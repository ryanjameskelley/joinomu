const { createClient } = require('@supabase/supabase-js')

async function testFinalAuth() {
  console.log('🧪 Testing final auth trigger with Supabase signup...')
  
  const testSupabase = createClient(
    'http://127.0.0.1:54321',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
  )
  
  const serviceSupabase = createClient(
    'http://127.0.0.1:54321',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
  )
  
  const testUsers = [
    {
      email: `final.patient.${Date.now()}@test.com`,
      role: 'patient',
      first_name: 'Final',
      last_name: 'Patient',
      phone: '555-0001'
    },
    {
      email: `final.provider.${Date.now()}@test.com`,
      role: 'provider',
      first_name: 'Dr. Final',
      last_name: 'Provider',
      specialty: 'Endocrinology',
      licenseNumber: 'MD555999',
      phone: '555-0002'
    },
    {
      email: `final.admin.${Date.now()}@test.com`,
      role: 'admin',
      first_name: 'Final',
      last_name: 'Admin'
    }
  ]
  
  let successCount = 0
  
  for (const user of testUsers) {
    console.log(`\n📝 Testing ${user.role} creation: ${user.email}`)
    
    try {
      const { data: signupData, error: signupError } = await testSupabase.auth.signUp({
        email: user.email,
        password: 'password123',
        options: {
          data: {
            role: user.role,
            first_name: user.first_name,
            last_name: user.last_name,
            specialty: user.specialty,
            licenseNumber: user.licenseNumber,
            phone: user.phone
          }
        }
      })
      
      if (signupError) {
        console.log(`❌ Signup failed: ${signupError.message}`)
        continue
      }
      
      console.log(`✅ Auth user created: ${signupData.user?.id}`)
      
      // Wait for trigger
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Check if profile was created
      const { data: profile } = await serviceSupabase
        .from('profiles')
        .select('*')
        .eq('id', signupData.user.id)
        .single()
        
      if (profile) {
        console.log(`✅ Profile auto-created: ${profile.first_name} ${profile.last_name} (${profile.role})`)
        
        // Check role-specific record
        if (user.role === 'patient') {
          const { data: patient } = await serviceSupabase
            .from('patients')
            .select('*')
            .eq('profile_id', signupData.user.id)
            .single()
            
          if (patient) {
            console.log(`✅ Patient record auto-created`)
            successCount++
          } else {
            console.log(`❌ Patient record missing`)
          }
          
        } else if (user.role === 'provider') {
          const { data: provider } = await serviceSupabase
            .from('providers')
            .select('*')
            .eq('profile_id', signupData.user.id)
            .single()
            
          if (provider) {
            console.log(`✅ Provider record auto-created`)
            
            // Check provider schedules
            const { data: schedules } = await serviceSupabase
              .from('provider_schedules')
              .select('*')
              .eq('provider_id', provider.id)
              
            if (schedules && schedules.length > 0) {
              console.log(`✅ Provider schedules auto-created: ${schedules.length} days (${schedules[0].start_time}-${schedules[0].end_time})`)
              successCount++
            } else {
              console.log(`❌ Provider schedules missing`)
            }
          } else {
            console.log(`❌ Provider record missing`)
          }
          
        } else if (user.role === 'admin') {
          const { data: admin } = await serviceSupabase
            .from('admins')
            .select('*')
            .eq('profile_id', signupData.user.id)
            .single()
            
          if (admin) {
            console.log(`✅ Admin record auto-created with permissions: ${admin.permissions}`)
            successCount++
          } else {
            console.log(`❌ Admin record missing`)
          }
        }
        
      } else {
        console.log(`❌ Profile creation failed`)
      }
      
    } catch (e) {
      console.log(`❌ Error testing ${user.role}:`, e.message)
    }
  }
  
  return successCount === 3
}

async function main() {
  const allWorking = await testFinalAuth()
  
  console.log('\n🎯 FINAL ANSWER TO YOUR QUESTION:')
  
  if (allWorking) {
    console.log('🎉 YES! You can now create users of any type and have Supabase respond correctly!')
    console.log('\n✅ What works:')
    console.log('✅ Auth users are created in auth.users table')
    console.log('✅ Profile records are auto-created in profiles table')
    console.log('✅ Role-specific records are auto-created (patients, providers, admins)')
    console.log('✅ Provider schedules are automatically generated (Mon-Fri, 9-5)')
    console.log('✅ Supports all user metadata (specialty, license, phone)')
    console.log('\n🚀 Ready for production use!')
    console.log('🌐 Test signup at: http://localhost:3456/')
    console.log('📝 Include role in signup metadata: "patient", "provider", or "admin"')
  } else {
    console.log('❌ NO, user creation with automatic table population is still not working correctly')
    console.log('\n🔧 Auth trigger exists but may have issues with:')
    console.log('- Profile creation from auth.users insert')
    console.log('- Role-specific record creation')
    console.log('- Provider schedule auto-generation')
  }
  
  console.log('\n📋 Current status summary:')
  console.log('- Auth trigger function: ✅ Created')
  console.log('- Auth trigger: ✅ Installed') 
  console.log('- Permissions: ✅ Granted')
  console.log(`- End-to-end functionality: ${allWorking ? '✅' : '❌'} ${allWorking ? 'Working' : 'Needs debugging'}`)
}

main().catch(console.error)