// Test trigger status and manually check the recent signup
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
)

async function checkTriggerStatus() {
  console.log('🔍 Checking trigger status and recent signup...')
  
  // Check if user exists in auth.users
  const { data: authUser, error: authError } = await supabase.auth.admin.getUserById('2be9df1b-b453-4586-b0c6-7739b4ca56a8')
  console.log('Auth user:', authUser?.user?.email || 'Not found')
  
  // Check if profile exists
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', '2be9df1b-b453-4586-b0c6-7739b4ca56a8')
  console.log('Profile found:', profile?.length || 0)
  if (profileError) console.log('Profile error:', profileError)
  
  // Check if patient exists
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('*')
    .eq('profile_id', '2be9df1b-b453-4586-b0c6-7739b4ca56a8')
  console.log('Patient found:', patient?.length || 0)
  if (patientError) console.log('Patient error:', patientError)
  
  // Check trigger logs
  const { data: logs, error: logsError } = await supabase
    .from('auth_trigger_debug_log')
    .select('*')
    .eq('user_id', '2be9df1b-b453-4586-b0c6-7739b4ca56a8')
    .order('created_at')
  
  console.log('Trigger logs found:', logs?.length || 0)
  if (logs?.length > 0) {
    logs.forEach(log => {
      console.log(`${log.step}: ${log.status}`, log.error_message || '', log.metadata || '')
    })
  } else {
    console.log('❌ NO TRIGGER LOGS FOUND - This means the trigger never fired!')
  }
  
  // Check if trigger exists
  const { data: triggers, error: triggerError } = await supabase.rpc('sql', {
    query: `
      SELECT trigger_name, event_manipulation, event_object_table, action_timing
      FROM information_schema.triggers 
      WHERE trigger_name = 'on_auth_user_created';
    `
  })
  
  console.log('Trigger exists:', triggers?.length > 0 ? 'YES' : 'NO')
  if (triggers?.length > 0) {
    console.log('Trigger details:', triggers[0])
  }
  
  if (logsError) console.log('Logs error:', logsError)
  if (triggerError) console.log('Trigger check error:', triggerError)
}

checkTriggerStatus().catch(console.error)