// Script to assign ryan@ryankelleydesign.com patient to the logged-in provider
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ukyczgfoqhdbamxycrkn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVreWN6Z2ZvcWhkYmFteHljcmtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMzUwNjAsImV4cCI6MjA3MDcxMTA2MH0.Z43rbJrXSpfS1n4R2YUS-2zA_mFUaU2ywdAPOB2KuF8'
);

async function assignRyanToProvider() {
  try {
    const providerUserId = '9bc6ae5e-d528-411b-975a-b2346519dbb5';
    const patientEmail = 'ryan@ryankelleydesign.com';
    
    console.log('Finding provider...');
    // Find the provider by user_id
    const { data: provider, error: providerError } = await supabase
      .from('providers')
      .select('id, first_name, last_name, email')
      .eq('user_id', providerUserId)
      .single();

    if (providerError) {
      console.error('Provider not found:', providerError);
      return;
    }

    console.log('Found provider:', provider);

    console.log('Finding patient...');
    // Find the patient by email
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id, first_name, last_name, email')
      .eq('email', patientEmail)
      .single();

    if (patientError) {
      console.error('Patient not found:', patientError);
      return;
    }

    console.log('Found patient:', patient);

    // Check if assignment already exists
    console.log('Checking for existing assignment...');
    const { data: existing, error: existingError } = await supabase
      .from('patient_providers')
      .select('*')
      .eq('patient_id', patient.id)
      .eq('provider_id', provider.id);

    if (existing && existing.length > 0) {
      console.log('Assignment already exists:', existing);
      return;
    }

    // Create the assignment
    console.log('Creating patient-provider assignment...');
    const assignment = {
      patient_id: patient.id,
      provider_id: provider.id,
      treatment_type: 'weight_loss',
      is_primary: true,
      assigned_date: new Date().toISOString().split('T')[0]
    };

    const { data: newAssignment, error: assignmentError } = await supabase
      .from('patient_providers')
      .insert(assignment)
      .select()
      .single();

    if (assignmentError) {
      console.error('Error creating assignment:', assignmentError);
      return;
    }

    console.log('✅ SUCCESS! Assignment created:', newAssignment);
    console.log(`Patient: ${patient.first_name} ${patient.last_name} (${patient.email})`);
    console.log(`Provider: ${provider.first_name} ${provider.last_name} (${provider.email})`);
    console.log(`Treatment: ${assignment.treatment_type}`);

    // Verify the assignment
    console.log('\nVerifying assignment...');
    const { data: verification, error: verifyError } = await supabase
      .from('patient_providers')
      .select(`
        *,
        patients (first_name, last_name, email),
        providers (first_name, last_name, email)
      `)
      .eq('patient_id', patient.id)
      .eq('provider_id', provider.id);

    if (verification && verification.length > 0) {
      console.log('✅ Verification successful:', verification[0]);
    }

  } catch (error) {
    console.error('Script error:', error);
  }
}

assignRyanToProvider();