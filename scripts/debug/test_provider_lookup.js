const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testProviderLookup() {
  console.log('Testing provider lookup for auth UID: 0acae873-a2c7-4e3d-bcfa-264ec7cd77c0')
  
  const { data: providers, error } = await supabase
    .from('providers')
    .select('*')
    .eq('profile_id', '0acae873-a2c7-4e3d-bcfa-264ec7cd77c0')

  if (error) {
    console.error('Error:', error)
  } else {
    console.log('Found providers:', providers)
    console.log('Provider count:', providers?.length || 0)
  }
  
  // Also check all providers to see what exists
  console.log('\nAll providers:')
  const { data: allProviders, error: allError } = await supabase
    .from('providers')
    .select('id, profile_id')
    .limit(10)

  if (allError) {
    console.error('Error getting all providers:', allError)
  } else {
    console.log('All providers:', allProviders)
  }
}

testProviderLookup()