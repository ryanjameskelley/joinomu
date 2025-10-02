// Check table structure and existing data
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

async function checkTables() {
  try {
    console.log('🔍 Checking providers table...');
    const { data: providers, error: providerError } = await supabase
      .from('providers')
      .select('*')
      .limit(3);
    
    console.log('Providers:', providers);
    if (providerError) console.log('Provider error:', providerError);
    
    console.log('\n🔍 Checking patients table...');
    const { data: patients, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .limit(3);
    
    console.log('Patients:', patients);
    if (patientError) console.log('Patient error:', patientError);
    
    console.log('\n🔍 Checking patient_assignments table...');
    const { data: assignments, error: assignmentError } = await supabase
      .from('patient_assignments')
      .select('*')
      .limit(3);
    
    console.log('Assignments:', assignments);
    if (assignmentError) console.log('Assignment error:', assignmentError);
    
  } catch (error) {
    console.error('Script error:', error);
  }
}

checkTables();