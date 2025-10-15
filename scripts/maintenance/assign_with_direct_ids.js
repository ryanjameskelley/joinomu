// Script to assign patient directly using IDs (bypassing potential RLS issues)
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ukyczgfoqhdbamxycrkn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVreWN6Z2ZvcWhkYmFteHljcmtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMzUwNjAsImV4cCI6MjA3MDcxMTA2MH0.Z43rbJrXSpfS1n4R2YUS-2zA_mFUaU2ywdAPOB2KuF8'
);

async function assignDirectly() {
  try {
    console.log('Creating assignment directly...');
    
    // Since we know both users exist in auth, let's create provider and patient records if they don't exist
    // and then create the assignment
    
    // First, let's try to create a provider record (in case it doesn't exist)
    const providerData = {
      user_id: '9bc6ae5e-d528-411b-975a-b2346519dbb5',
      first_name: 'Provider',
      last_name: 'User',
      email: 'provider@example.com',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Attempting to create/find provider...');
    const { data: provider, error: providerError } = await supabase
      .from('providers')
      .upsert(providerData, { onConflict: 'user_id' })
      .select()
      .single();

    if (providerError) {
      console.error('Provider upsert error:', providerError);
      return;
    }

    console.log('Provider ready:', provider);

    // Try to create/find patient record
    const patientData = {
      email: 'ryan@ryankelleydesign.com',
      first_name: 'Ryan',
      last_name: 'Kelley',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Attempting to create/find patient...');
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .upsert(patientData, { onConflict: 'email' })
      .select()
      .single();

    if (patientError) {
      console.error('Patient upsert error:', patientError);
      return;
    }

    console.log('Patient ready:', patient);

    // Now create the assignment
    const assignment = {
      patient_id: patient.id,
      provider_id: provider.id,
      treatment_type: 'weight_loss',
      is_primary: true,
      assigned_date: new Date().toISOString().split('T')[0]
    };

    console.log('Creating assignment:', assignment);

    const { data: newAssignment, error: assignmentError } = await supabase
      .from('patient_providers')
      .insert(assignment)
      .select()
      .single();

    if (assignmentError) {
      console.error('Assignment error:', assignmentError);
      return;
    }

    console.log('✅ SUCCESS! Assignment created:', newAssignment);

  } catch (error) {
    console.error('Script error:', error);
  }
}

assignDirectly();