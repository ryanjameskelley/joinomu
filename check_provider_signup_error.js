// Check what went wrong with provider signup
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
)

async function checkProviderSignupError() {
  console.log('🔍 Checking provider signup error...')
  
  // Check recent trigger logs for any errors
  const { data: logs, error: logsError } = await supabase
    .from('auth_trigger_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)
  
  console.log('Recent trigger logs:', logs?.length || 0)
  if (logs?.length > 0) {
    logs.forEach(log => {
      console.log(`${log.created_at}: ${log.step} - ${log.status}`)
      if (log.error_message) {
        console.log(`  Error: ${log.error_message}`)
      }
      if (log.metadata) {
        console.log(`  Meta:`, log.metadata)
      }
    })
  }
  
  // Check providers table structure
  const { data: providers, error: providersError } = await supabase
    .from('providers')
    .select('*')
    .limit(1)
  
  if (providers && providers.length > 0) {
    console.log('✅ Providers table columns:', Object.keys(providers[0]))
  } else if (providersError) {
    console.log('❌ Providers table error:', providersError)
  } else {
    console.log('⚠️ No providers found - checking table structure by attempting insert')
    
    // Try to see what columns are expected
    const { error: insertError } = await supabase
      .from('providers')
      .insert({
        profile_id: '00000000-0000-0000-0000-000000000000', // dummy data
        specialty: 'Test'
      })
    
    console.log('Insert test error (to see expected columns):', insertError)
  }
  
  if (logsError) console.log('Logs error:', logsError)
}

checkProviderSignupError().catch(console.error)