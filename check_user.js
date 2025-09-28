
const { createClient } = require('@supabase/supabase-js')
const supabase = createClient('http://127.0.0.1:54321', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU')

async function checkUser() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', 'fe5fee47-896d-4ac7-ba2b-d35ef4589eee')
  
  console.log('User profile:', data, error)
}
checkUser()

