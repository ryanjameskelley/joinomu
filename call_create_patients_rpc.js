// Call RPC function to create patient records
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ukyczgfoqhdbamxycrkn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVreWN6Z2ZvcWhkYmFteHljcmtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMzUwNjAsImV4cCI6MjA3MDcxMTA2MH0.Z43rbJrXSpfS1n4R2YUS-2zA_mFUaU2ywdAPOB2KuF8'
);

async function createPatients() {
  try {
    console.log('Calling RPC function to create patient records...');
    
    const { data, error } = await supabase
      .rpc('create_missing_patients');
    
    if (error) {
      console.error('Error calling RPC function:', error);
      return;
    }
    
    console.log('✅ RPC function results:', data);
    
    // Now verify the relationships work
    console.log('\n=== VERIFYING PATIENT-PROVIDER RELATIONSHIPS ===');
    const { data: verifyData, error: verifyError } = await supabase
      .from('patient_providers')
      .select(`
        treatment_type,
        assigned_date,
        is_primary,
        patients (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('provider_id', '133ad6a8-f330-4d04-8fb5-48e902653bfc');

    if (verifyError) {
      console.error('Error verifying relationships:', verifyError);
    } else {
      console.log('✅ Patient-Provider relationships verified:');
      verifyData.forEach((rel, index) => {
        if (rel.patients) {
          console.log(`${index + 1}. ${rel.patients.first_name} ${rel.patients.last_name} (${rel.treatment_type})`);
        } else {
          console.log(`${index + 1}. NULL patient (${rel.treatment_type})`);
        }
      });
    }

  } catch (error) {
    console.error('Script error:', error);
  }
}

createPatients();