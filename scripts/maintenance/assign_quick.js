// Simple assignment script
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('http://127.0.0.1:54321', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU');

async function assign() {
  console.log('Creating assignment...');
  const { data, error } = await supabase
    .from('patient_assignments')
    .insert({
      patient_id: 'fee32dc6-49b5-49a4-a245-8f5ee70b4613',
      provider_id: '1a3803f0-fe96-4649-8e2a-0e06a64c94c1',
      treatment_type: 'weight_loss',
      active: true
    })
    .select();
  
  if (error) console.error('Error:', error);
  else console.log('Success:', data);
}

assign();
