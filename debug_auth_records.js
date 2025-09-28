// Debug auth trigger - check what's happening with recent signups
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
)

async function debugAuthRecords() {
  console.log('🔍 Debugging auth records...')
  
  // Check recent auth users
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
  
  if (authUsers?.users) {
    console.log(`Found ${authUsers.users.length} auth users`)
    
    // Check last few users
    const recentUsers = authUsers.users.slice(-5)
    
    for (const user of recentUsers) {
      console.log(`\n--- User: ${user.email} (${user.id}) ---`)
      console.log(`Role from metadata: ${user.user_metadata?.role || 'not set'}`)
      console.log(`Created: ${user.created_at}`)
      
      // Check if profile exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
      
      console.log(`Profile exists: ${profile?.length > 0 ? 'YES' : 'NO'}`)
      if (profile?.length > 0) {
        console.log(`Profile role: ${profile[0].role}`)
      }
      
      // Check role-specific records
      if (user.user_metadata?.role === 'patient') {
        const { data: patient } = await supabase
          .from('patients')
          .select('*')
          .eq('profile_id', user.id)
        console.log(`Patient record exists: ${patient?.length > 0 ? 'YES' : 'NO'}`)
      } else if (user.user_metadata?.role === 'provider') {
        const { data: provider } = await supabase
          .from('providers')
          .select('*')
          .eq('profile_id', user.id)
        console.log(`Provider record exists: ${provider?.length > 0 ? 'YES' : 'NO'}`)
        
        if (provider?.length > 0) {
          // Check schedules
          const { data: schedules } = await supabase
            .from('provider_schedules')
            .select('*')
            .eq('provider_id', provider[0].id)
          console.log(`Provider schedules: ${schedules?.length || 0}`)
        }
      }
    }
  }
  
  // Check if trigger exists
  const { data: triggerCheck, error: triggerError } = await supabase.rpc('sql', {
    query: `
      SELECT trigger_name, event_manipulation, event_object_table 
      FROM information_schema.triggers 
      WHERE trigger_name = 'on_auth_user_created'
    `
  }).catch(() => null)
  
  console.log('\n--- Trigger Status ---')
  console.log('Trigger exists:', triggerCheck?.length > 0 ? 'YES' : 'NO')
  
  // Check trigger logs if they exist
  const { data: logs } = await supabase
    .from('auth_trigger_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)
    .catch(() => ({ data: null }))
  
  console.log('Recent trigger logs:', logs?.length || 0)
  if (logs?.length > 0) {
    logs.forEach(log => {
      console.log(`${log.created_at}: ${log.step} - ${log.status}`)
      if (log.error_message) console.log(`  Error: ${log.error_message}`)
    })
  }
}

debugAuthRecords().catch(console.error)