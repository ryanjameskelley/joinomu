const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('http://127.0.0.1:54321', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU');

async function assign() {
  console.log('Creating assignment...');
  const { data, error } = await supabase
    .from('patient_assignments')
    .insert({
      patient_id: '4c33fc13-be7a-422e-920a-f89a80f9931a',
      provider_id: '9a5c4642-08bd-4c4d-97e7-f9578d63554d',
      treatment_type: 'weight_loss',
      active: true
    })
    .select();
  
  if (error) console.error('Error:', error);
  else console.log('Success:', data);
}

assign();
