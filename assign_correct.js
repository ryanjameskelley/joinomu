const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('http://127.0.0.1:54321', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU');

async function assignCorrectIds() {
  console.log('Creating assignment with correct IDs...');
  
  // Use the correct provider ID (the one with profile_id matching what you provided)
  const providerId = 'afdf39f6-64fa-4557-911a-735eb154c646';
  
  // Use first available patient ID
  const patientId = '91f9c492-0265-4e1e-be52-f109c760722a';
  
  const { data, error } = await supabase
    .from('patient_assignments')
    .insert({
      patient_id: patientId,
      provider_id: providerId,
      treatment_type: 'weight_loss',
      active: true
    })
    .select();
  
  if (error) console.error('Error:', error);
  else {
    console.log('Success! Assignment created:', data);
    console.log('Provider ID:', providerId);
    console.log('Patient ID:', patientId);
  }
}

assignCorrectIds();
