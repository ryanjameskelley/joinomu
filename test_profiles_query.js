
const { createClient } = require('@supabase/supabase-js')
const supabase = createClient('http://127.0.0.1:54321', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU')

async function testProfilesQuery() {
  console.log('Testing profiles query with service key...')
  
  const userId = 'fe5fee47-896d-4ac7-ba2b-d35ef4589eee'
  
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()
  
  console.log('Service key result:', { data, error })
  
  // Test with anon key
  const anonSupabase = createClient('http://127.0.0.1:54321', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0')
  
  console.log('Testing profiles query with anon key...')
  
  const { data: anonData, error: anonError } = await anonSupabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()
  
  console.log('Anon key result:', { anonData, anonError })
}

testProfilesQuery()

