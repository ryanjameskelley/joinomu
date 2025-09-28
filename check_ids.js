const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('http://127.0.0.1:54321', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU');

async function checkIds() {
  console.log('Checking provider and patient IDs...');
  
  // Check provider
  const { data: provider } = await supabase
    .from('providers')
    .select('id, profile_id, specialty')
    .eq('id', '9a5c4642-08bd-4c4d-97e7-f9578d63554d')
    .single();
  
  console.log('Provider:', provider || 'Not found');
  
  // Check patient
  const { data: patient } = await supabase
    .from('patients')
    .select('id, profile_id')
    .eq('id', '4c33fc13-be7a-422e-920a-f89a80f9931a')
    .single();
  
  console.log('Patient:', patient || 'Not found');
  
  // List all patients
  const { data: allPatients } = await supabase
    .from('patients')
    .select('id, profile_id')
    .limit(5);
  
  console.log('Available patients:', allPatients);
  
  // List all providers
  const { data: allProviders } = await supabase
    .from('providers')
    .select('id, profile_id, specialty')
    .limit(5);
  
  console.log('Available providers:', allProviders);
}

checkIds();
