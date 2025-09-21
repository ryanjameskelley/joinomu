// Script to assign patients to provider with user_id: 9bc6ae5e-d528-411b-975a-b2346519dbb5
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ukyczgfoqhdbamxycrkn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVreWN6Z2ZvcWhkYmFteHljcmtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMzUwNjAsImV4cCI6MjA3MDcxMTA2MH0.Z43rbJrXSpfS1n4R2YUS-2zA_mFUaU2ywdAPOB2KuF8'
);

async function assignPatientsToProvider() {
  try {
    // Find the provider ID for the given user_id
    console.log('Finding provider...');
    const { data: provider, error: providerError } = await supabase
      .from('providers')
      .select('id, first_name, last_name')
      .eq('user_id', '9bc6ae5e-d528-411b-975a-b2346519dbb5')
      .single();

    if (providerError || !provider) {
      console.error('Provider not found:', providerError);
      return;
    }

    console.log('Found provider:', provider);

    // Get first 5 patients
    console.log('Getting patients...');
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('id, first_name, last_name, email')
      .limit(5);

    if (patientsError || !patients || patients.length === 0) {
      console.error('No patients found:', patientsError);
      return;
    }

    console.log('Found patients:', patients);

    // Check existing assignments
    console.log('Checking existing assignments...');
    const { data: existing, error: existingError } = await supabase
      .from('patient_providers')
      .select('*')
      .eq('provider_id', provider.id);

    if (existing && existing.length > 0) {
      console.log('Provider already has assignments:', existing.length);
    }

    // Create assignments
    const assignments = patients.map((patient, index) => ({
      patient_id: patient.id,
      provider_id: provider.id,
      treatment_type: index % 2 === 0 ? 'weight_loss' : 'mens_health',
      is_primary: true,
      assigned_date: new Date().toISOString().split('T')[0] // Today's date
    }));

    console.log('Creating assignments:', assignments);

    const { data: insertData, error: insertError } = await supabase
      .from('patient_providers')
      .insert(assignments)
      .select();

    if (insertError) {
      console.error('Error creating assignments:', insertError);
      return;
    }

    console.log('Successfully assigned patients:', insertData);

    // Verify assignments
    console.log('Verifying assignments...');
    const { data: verification, error: verifyError } = await supabase
      .from('patient_providers')
      .select(`
        *,
        patients (first_name, last_name, email),
        providers (first_name, last_name)
      `)
      .eq('provider_id', provider.id);

    if (verifyError) {
      console.error('Error verifying:', verifyError);
      return;
    }

    console.log('Final assignments for provider:', verification);

  } catch (error) {
    console.error('Script error:', error);
  }
}

assignPatientsToProvider();