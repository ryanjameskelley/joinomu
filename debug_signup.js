const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
)

async function debugSignup() {
  console.log('🔍 Checking auth trigger logs...')
  
  // Check if auth_trigger_logs table exists
  const { data: logs, error: logsError } = await supabase
    .from('auth_trigger_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)
    
  console.log('Recent auth trigger logs:', logs)
  console.log('Logs error:', logsError)
  
  // Check profiles table structure
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .limit(1)
    
  console.log('Profiles sample:', profiles)
  console.log('Profiles error:', profilesError)
  
  // Try to sign up a test user to see what happens
  console.log('🔍 Testing signup...')
  
  const { data: signupData, error: signupError } = await supabase.auth.signUp({
    email: 'test.patient@example.com',
    password: 'password123',
    options: {
      data: {
        role: 'patient',
        first_name: 'Test',
        last_name: 'Patient'
      }
    }
  })
  
  console.log('Signup data:', signupData)
  console.log('Signup error:', signupError)
  
  // Check logs again after signup attempt
  const { data: newLogs, error: newLogsError } = await supabase
    .from('auth_trigger_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)
    
  console.log('New auth trigger logs:', newLogs)
  console.log('New logs error:', newLogsError)
}

debugSignup().catch(console.error)