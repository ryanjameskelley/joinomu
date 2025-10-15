// Script to check what data we have
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ukyczgfoqhdbamxycrkn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVreWN6Z2ZvcWhkYmFteHljcmtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMzUwNjAsImV4cCI6MjA3MDcxMTA2MH0.Z43rbJrXSpfS1n4R2YUS-2zA_mFUaU2ywdAPOB2KuF8'
);

async function checkData() {
  try {
    // Check all providers
    console.log('=== ALL PROVIDERS ===');
    const { data: providers, error: providersError } = await supabase
      .from('providers')
      .select('*');

    if (providersError) {
      console.error('Error fetching providers:', providersError);
    } else {
      console.log('Providers found:', providers?.length || 0);
      providers?.forEach(p => {
        console.log(`- ID: ${p.id}, Name: ${p.first_name} ${p.last_name}, User ID: ${p.user_id}`);
      });
    }

    // Check all patients
    console.log('\n=== ALL PATIENTS ===');
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('id, first_name, last_name, user_id')
      .limit(5);

    if (patientsError) {
      console.error('Error fetching patients:', patientsError);
    } else {
      console.log('Patients found:', patients?.length || 0);
      patients?.forEach(p => {
        console.log(`- ID: ${p.id}, Name: ${p.first_name} ${p.last_name}, User ID: ${p.user_id}`);
      });
    }

    // Check existing patient-provider relationships
    console.log('\n=== EXISTING PATIENT-PROVIDER RELATIONSHIPS ===');
    const { data: relationships, error: relationshipsError } = await supabase
      .from('patient_providers')
      .select('*');

    if (relationshipsError) {
      console.error('Error fetching relationships:', relationshipsError);
    } else {
      console.log('Relationships found:', relationships?.length || 0);
      relationships?.forEach(r => {
        console.log(`- Patient: ${r.patient_id}, Provider: ${r.provider_id}, Treatment: ${r.treatment_type}`);
      });
    }

  } catch (error) {
    console.error('Script error:', error);
  }
}

checkData();