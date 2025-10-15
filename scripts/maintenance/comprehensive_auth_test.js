const { createClient } = require('@supabase/supabase-js')

async function comprehensiveAuthTest() {
  console.log('🔧 Comprehensive auth test after Supabase CLI update...')
  
  // Test with both old and new token formats
  const configurations = [
    {
      name: 'New CLI tokens',
      url: 'http://127.0.0.1:54321',
      anonKey: 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH',
      serviceKey: 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'
    },
    {
      name: 'Legacy JWT tokens',
      url: 'http://127.0.0.1:54321',
      anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
      serviceKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
    }
  ]
  
  for (const config of configurations) {
    console.log(`\n🧪 Testing with ${config.name}...`)
    
    const supabase = createClient(config.url, config.anonKey)
    const serviceSupabase = createClient(config.url, config.serviceKey)
    
    // Test 1: Basic connection
    try {
      const { data: health } = await supabase.from('profiles').select('count(*)').limit(1)
      console.log(`✅ ${config.name}: Database connection successful`)
    } catch (e) {
      console.log(`❌ ${config.name}: Database connection failed:`, e.message)
      continue
    }
    
    // Test 2: User creation via admin API
    const testEmail = `test.${Date.now()}@example.com`
    
    try {
      const { data: userData, error: userError } = await serviceSupabase.auth.admin.createUser({
        email: testEmail,
        password: 'password123',
        email_confirm: true,
        user_metadata: {
          role: 'patient',
          first_name: 'Test',
          last_name: 'User'
        }
      })
      
      if (userError) {
        console.log(`❌ ${config.name}: Admin createUser failed:`, userError.message)
        continue
      } else {
        console.log(`✅ ${config.name}: Admin createUser successful!`)
        console.log(`   User ID: ${userData.user?.id}`)
        console.log(`   Email: ${userData.user?.email}`)
        
        // Test 3: Manual profile creation
        if (userData.user?.id) {
          const { data: profile, error: profileError } = await serviceSupabase
            .from('profiles')
            .insert({
              id: userData.user.id,
              email: userData.user.email,
              first_name: 'Test',
              last_name: 'User',
              role: 'patient'
            })
            .select()
            .single()
            
          if (profile) {
            console.log(`✅ ${config.name}: Profile created successfully`)
          } else {
            console.log(`❌ ${config.name}: Profile creation failed:`, profileError?.message)
          }
        }
        
        // Test 4: Sign in
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: testEmail,
          password: 'password123'
        })
        
        if (signInError) {
          console.log(`❌ ${config.name}: SignIn failed:`, signInError.message)
        } else {
          console.log(`✅ ${config.name}: SignIn successful!`)
          console.log(`   Session: ${signInData.session ? 'Active' : 'None'}`)
          
          // THIS CONFIGURATION WORKS!
          console.log(`\n🎉 ${config.name} WORKS COMPLETELY!`)
          console.log(`\n📝 Working Configuration:`)
          console.log(`URL: ${config.url}`)
          console.log(`Anon Key: ${config.anonKey}`)
          console.log(`Service Key: ${config.serviceKey}`)
          
          // Create admin user for testing
          const { data: adminData } = await serviceSupabase.auth.admin.createUser({
            email: 'admin@test.com',
            password: 'admin123',
            email_confirm: true,
            user_metadata: {
              role: 'admin',
              first_name: 'Admin',
              last_name: 'User'
            }
          })
          
          if (adminData.user?.id) {
            await serviceSupabase
              .from('profiles')
              .insert({
                id: adminData.user.id,
                email: adminData.user.email,
                first_name: 'Admin',
                last_name: 'User',
                role: 'admin'
              })
              
            await serviceSupabase
              .from('admins')
              .insert({
                profile_id: adminData.user.id,
                permissions: 'full'
              })
              
            console.log(`\n✅ Admin user created for webapp testing!`)
            console.log(`Email: admin@test.com`)
            console.log(`Password: admin123`)
          }
          
          return // Exit on first working configuration
        }
      }
    } catch (e) {
      console.log(`❌ ${config.name}: Exception during testing:`, e.message)
    }
  }
  
  console.log('\n❌ No working configuration found')
  console.log('The auth system may have deeper issues requiring manual intervention')
}

comprehensiveAuthTest().catch(console.error)