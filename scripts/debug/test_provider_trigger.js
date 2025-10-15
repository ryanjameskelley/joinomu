// Test the auth trigger with a provider signup simulation
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
)

async function testProviderTrigger() {
  console.log('🔍 Testing provider auth trigger...')
  
  // Test provider signup
  const testEmail = 'test-provider-' + Date.now() + '@example.com'
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: 'password123',
      options: {
        data: {
          role: 'provider',
          firstName: 'Test',
          lastName: 'Provider',
          specialty: 'Internal Medicine',
          licenseNumber: 'TEST123'
        }
      }
    })
    
    if (error) {
      console.log('❌ Signup error:', error)
      return
    }
    
    console.log('✅ Provider signup successful:', data.user?.id)
    
    // Wait a moment for trigger to execute
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Check if profile was created
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user?.id)
    
    console.log('Profile created:', profile?.length > 0 ? 'YES' : 'NO')
    if (profileError) console.log('Profile error:', profileError)
    
    // Check if provider was created
    const { data: provider, error: providerError } = await supabase
      .from('providers')
      .select('*')
      .eq('profile_id', data.user?.id)
    
    console.log('Provider record created:', provider?.length > 0 ? 'YES' : 'NO')
    if (providerError) console.log('Provider error:', providerError)
    
    // Check trigger logs
    const { data: logs } = await supabase
      .from('auth_trigger_logs')
      .select('*')
      .eq('user_id', data.user?.id)
      .order('created_at')
    
    console.log('Trigger logs:', logs?.length || 0)
    logs?.forEach(log => {
      console.log(`  ${log.step}: ${log.status}`)
      if (log.error_message) console.log(`    Error: ${log.error_message}`)
    })
    
    // Cleanup
    if (data.user?.id) {
      await supabase.auth.admin.deleteUser(data.user.id)
      await supabase.from('profiles').delete().eq('id', data.user.id)
      await supabase.from('providers').delete().eq('profile_id', data.user.id)
      await supabase.from('auth_trigger_logs').delete().eq('user_id', data.user.id)
      console.log('✅ Cleanup complete')
    }
    
  } catch (err) {
    console.log('❌ Test failed:', err.message)
  }
}

testProviderTrigger().catch(console.error)
