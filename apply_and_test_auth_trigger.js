const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const serviceSupabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
)

const testSupabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
)

async function applyAuthTrigger() {
  console.log('🔧 Applying enhanced auth trigger...')
  
  try {
    // Read the SQL file
    const triggerSQL = fs.readFileSync('enhanced_auth_trigger.sql', 'utf8')
    
    // Apply via raw SQL query using fetch
    const response = await fetch('http://127.0.0.1:54321/rest/v1/rpc/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
      },
      body: JSON.stringify({ query: triggerSQL })
    })
    
    if (!response.ok) {
      // Try alternative approach - create migration file
      console.log('Direct SQL failed, creating migration instead...')
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '').replace('T', '').slice(0, 14)
      const migrationPath = `supabase/migrations/${timestamp}_enhanced_auth_trigger.sql`
      
      fs.writeFileSync(migrationPath, triggerSQL)
      console.log(`✅ Created migration: ${migrationPath}`)
      
      // Apply migration
      const { exec } = require('child_process')
      return new Promise((resolve, reject) => {
        exec('npx supabase db push', (error, stdout, stderr) => {
          if (error) {
            console.log('❌ Migration failed:', stderr)
            resolve(false)
          } else {
            console.log('✅ Migration applied successfully')
            resolve(true)
          }
        })
      })
    }
    
    console.log('✅ Auth trigger applied directly')
    return true
    
  } catch (error) {
    console.log('❌ Error applying auth trigger:', error.message)
    return false
  }
}

async function testEnhancedAuthTrigger() {
  console.log('\n🧪 Testing enhanced auth trigger with all user types...')
  
  const testUsers = [
    {
      email: `test.patient.${Date.now()}@example.com`,
      password: 'password123',
      role: 'patient',
      first_name: 'Test',
      last_name: 'Patient',
      phone: '555-0001'
    },
    {
      email: `test.provider.${Date.now()}@example.com`,
      password: 'password123',
      role: 'provider',
      first_name: 'Dr. Test',
      last_name: 'Provider',
      specialty: 'Endocrinology',
      licenseNumber: 'MD12345',
      phone: '555-0002'
    },
    {
      email: `test.admin.${Date.now()}@example.com`,
      password: 'password123',
      role: 'admin',
      first_name: 'Test',
      last_name: 'Admin'
    }
  ]
  
  let successCount = 0
  
  for (const user of testUsers) {
    console.log(`\n📝 Testing ${user.role} creation: ${user.email}`)
    
    try {
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
      
      // Wait for trigger
      await new Promise(resolve => setTimeout(resolve, 2000))
      
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
  const applied = await applyAuthTrigger()
  
  if (applied) {
    const working = await testEnhancedAuthTrigger()
    
    if (working) {
      console.log('\n🎉 ENHANCED AUTH TRIGGER WORKING PERFECTLY!')
      console.log('\n✅ ANSWER TO YOUR QUESTION:')
      console.log('✅ YES! You can now create users of any type and have Supabase respond correctly!')
      console.log('✅ Auth users are created in auth.users')
      console.log('✅ Profile records are auto-created')
      console.log('✅ Role-specific records are auto-created')
      console.log('✅ Provider schedules are automatically generated (Mon-Fri, 9-5)')
      console.log('\n🚀 Test signup at: http://localhost:3456/')
      console.log('📝 Use role: "patient", "provider", or "admin" in signup metadata')
      
      console.log('\n🔧 Features of the enhanced trigger:')
      console.log('- Supports current database structure (profiles table)')
      console.log('- Creates provider schedules automatically for new providers')
      console.log('- Handles both raw_user_meta_data and user_metadata')
      console.log('- Includes error handling with warnings')
      console.log('- Uses ON CONFLICT DO NOTHING for schedule creation')
    } else {
      console.log('\n❌ Auth trigger not working properly yet')
    }
  }
}

main().catch(console.error)