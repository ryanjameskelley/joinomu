// Execute SQL to create missing patient records
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ukyczgfoqhdbamxycrkn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVreWN6Z2ZvcWhkYmFteHljcmtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMzUwNjAsImV4cCI6MjA3MDcxMTA2MH0.Z43rbJrXSpfS1n4R2YUS-2zA_mFUaU2ywdAPOB2KuF8'
);

async function createPatientRecords() {
  try {
    console.log('Creating patient records...');
    
    // 1. Create Ryan as a patient
    const { data: ryan, error: ryanError } = await supabase
      .from('patients')
      .upsert({
        id: 'c08004fd-1b9b-4eda-9fb2-28e3e272a561',
        user_id: '9bc6ae5e-d528-411b-975a-b2346519dbb5', // Same as provider for testing
        email: 'ryan@ryankelleydesign.com',
        first_name: 'Ryan',
        last_name: 'Kelley',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (ryanError) {
      console.error('Error creating Ryan patient:', ryanError);
    } else {
      console.log('✅ Created Ryan patient record');
    }

    // 2. Create test patient 1
    const { data: patient1, error: patient1Error } = await supabase
      .from('patients')
      .upsert({
        id: '7b76db36-47cb-4ca2-acdd-c262f52919e2',
        user_id: crypto.randomUUID(),
        email: 'patient1@example.com',
        first_name: 'Test',
        last_name: 'Patient1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (patient1Error) {
      console.error('Error creating patient 1:', patient1Error);
    } else {
      console.log('✅ Created Test Patient1 record');
    }

    // 3. Create test patient 2
    const { data: patient2, error: patient2Error } = await supabase
      .from('patients')
      .upsert({
        id: '66ac7329-b5f2-480b-ae4d-5767442e3df2',
        user_id: crypto.randomUUID(),
        email: 'patient2@example.com',
        first_name: 'Test',
        last_name: 'Patient2',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (patient2Error) {
      console.error('Error creating patient 2:', patient2Error);
    } else {
      console.log('✅ Created Test Patient2 record');
    }

    // 4. Verify the relationships work now
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
          email,
          user_id
        )
      `)
      .eq('provider_id', '133ad6a8-f330-4d04-8fb5-48e902653bfc');

    if (verifyError) {
      console.error('Error verifying relationships:', verifyError);
    } else {
      console.log('✅ Patient-Provider relationships verified:');
      verifyData.forEach((rel, index) => {
        console.log(`${index + 1}. ${rel.patients?.first_name} ${rel.patients?.last_name} (${rel.treatment_type})`);
      });
    }

  } catch (error) {
    console.error('Script error:', error);
  }
}

createPatientRecords();