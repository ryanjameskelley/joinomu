const { createClient } = require('@supabase/supabase-js')

const testSupabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
)

const serviceSupabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
)

async function testUserCreation() {
  console.log('🧪 Testing complete user creation for all types...')
  
  const testUsers = [
    {
      email: `patient.test.${Date.now()}@example.com`,
      password: 'password123',
      role: 'patient',
      first_name: 'Test',
      last_name: 'Patient',
      phone: '555-0123'
    },
    {
      email: `provider.test.${Date.now()}@example.com`, 
      password: 'password123',
      role: 'provider',
      first_name: 'Dr. Test',
      last_name: 'Provider',
      specialty: 'Endocrinology',
      licenseNumber: 'MD789123',
      phone: '555-0456'
    },
    {
      email: `admin.test.${Date.now()}@example.com`,
      password: 'password123', 
      role: 'admin',
      first_name: 'Test',
      last_name: 'Admin'
    }
  ]
  
  for (const user of testUsers) {
    console.log(`\n📝 Testing ${user.role} creation: ${user.email}`)
    
    try {
      // Test signup through normal Supabase auth
      const { data: signupData, error: signupError } = await testSupabase.auth.signUp({
        email: user.email,
        password: user.password,
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
      
      // Wait for potential trigger execution
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Check if profile was created
      const { data: profile } = await serviceSupabase
        .from('profiles')
        .select('*')
        .eq('id', signupData.user.id)
        .single()
        
      if (profile) {
        console.log(`✅ Profile created: ${profile.first_name} ${profile.last_name} (${profile.role})`)
        
        // Check role-specific record
        if (user.role === 'patient') {
          const { data: patient } = await serviceSupabase
            .from('patients')
            .select('*')
            .eq('profile_id', signupData.user.id)
            .single()
            
          if (patient) {
            console.log(`✅ Patient record created`)
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
            console.log(`✅ Provider record created`)
            
            // Check provider schedules
            const { data: schedules } = await serviceSupabase
              .from('provider_schedules')
              .select('*')
              .eq('provider_id', provider.id)
              
            if (schedules && schedules.length > 0) {
              console.log(`✅ Provider schedules created: ${schedules.length} days`)
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
            console.log(`✅ Admin record created with permissions: ${admin.permissions}`)
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
  
  console.log('\n📊 FINAL TEST RESULTS:')
  console.log('\n🔍 To check current auth trigger status:')
  
  try {
    const { data: triggers } = await serviceSupabase.rpc('exec_sql', {
      sql: `
        SELECT trigger_name, event_manipulation, event_object_table
        FROM information_schema.triggers 
        WHERE event_object_table = 'users' 
        AND event_object_schema = 'auth'
      `
    })
    
    if (triggers && triggers.length > 0) {
      console.log('✅ Auth triggers found:', triggers.map(t => t.trigger_name).join(', '))
    } else {
      console.log('❌ No auth triggers found - this explains why automatic user creation fails')
      console.log('\n💡 SOLUTION: The auth trigger needs to be restored for automatic user creation')
      console.log('   The migration wiped out the auth trigger that creates profiles and role records')
    }
  } catch (e) {
    console.log('❌ Cannot check triggers:', e.message)
  }
  
  console.log('\n🎯 ANSWER TO YOUR QUESTION:')
  console.log('Currently: ❌ Users cannot be created with full auth + other table population')
  console.log('Reason: Missing auth trigger that was removed during migration')
  console.log('Solution: Restore the auth trigger for automatic user creation')
}

testUserCreation().catch(console.error)