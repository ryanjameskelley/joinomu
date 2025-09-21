// Debug script to check patient-provider relationships
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ukyczgfoqhdbamxycrkn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVreWN6Z2ZvcWhkYmFteHljcmtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMzUwNjAsImV4cCI6MjA3MDcxMTA2MH0.Z43rbJrXSpfS1n4R2YUS-2zA_mFUaU2ywdAPOB2KuF8'
);

async function debugPatientData() {
  try {
    const providerId = '133ad6a8-f330-4d04-8fb5-48e902653bfc';
    
    console.log('=== CHECKING PATIENT_PROVIDERS TABLE ===');
    const { data: relationships, error: relError } = await supabase
      .from('patient_providers')
      .select('*')
      .eq('provider_id', providerId);
      
    if (relError) {
      console.error('Error fetching relationships:', relError);
    } else {
      console.log('Patient-Provider relationships:', relationships);
    }

    console.log('\n=== CHECKING PATIENTS TABLE ===');
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('*')
      .limit(5);
      
    if (patientsError) {
      console.error('Error fetching patients:', patientsError);
    } else {
      console.log('Patients in database:', patients);
    }

    console.log('\n=== CHECKING SPECIFIC PATIENT IDS ===');
    if (relationships && relationships.length > 0) {
      for (const rel of relationships) {
        console.log(`Checking patient ID: ${rel.patient_id}`);
        const { data: patient, error: patientError } = await supabase
          .from('patients')
          .select('*')
          .eq('id', rel.patient_id)
          .single();
          
        if (patientError) {
          console.error(`Patient ${rel.patient_id} error:`, patientError);
        } else {
          console.log(`Patient ${rel.patient_id}:`, patient);
        }
      }
    }

  } catch (error) {
    console.error('Script error:', error);
  }
}

debugPatientData();