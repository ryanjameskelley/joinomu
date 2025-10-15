// Script to create provider for auth user and assign patients
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ukyczgfoqhdbamxycrkn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVreWN6Z2ZvcWhkYmFteHljcmtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMzUwNjAsImV4cCI6MjA3MDcxMTA2MH0.Z43rbJrXSpfS1n4R2YUS-2zA_mFUaU2ywdAPOB2KuF8'
);

async function createProviderAndAssign() {
  try {
    const authUserId = '9bc6ae5e-d528-411b-975a-b2346519dbb5';
    
    // 1. Create a provider record for this auth user
    console.log('Creating provider record for auth user...');
    const providerData = {
      user_id: authUserId,
      first_name: 'Dr. Test',
      last_name: 'Provider',
      email: 'test.provider@example.com',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: newProvider, error: providerError } = await supabase
      .from('providers')
      .insert(providerData)
      .select()
      .single();

    if (providerError) {
      console.error('Error creating provider:', providerError);
      return;
    }

    console.log('Created provider:', newProvider);

    // 2. Get some existing patient IDs from the relationships table
    console.log('Getting existing patient IDs...');
    const { data: existingRelations, error: relationsError } = await supabase
      .from('patient_providers')
      .select('patient_id')
      .limit(5);

    if (relationsError) {
      console.error('Error getting patient IDs:', relationsError);
      return;
    }

    const patientIds = [...new Set(existingRelations.map(r => r.patient_id))]; // Remove duplicates
    console.log('Found patient IDs:', patientIds);

    // 3. Create new assignments for this provider
    const assignments = patientIds.slice(0, 3).map((patientId, index) => ({
      patient_id: patientId,
      provider_id: newProvider.id,
      treatment_type: index % 2 === 0 ? 'weight_loss' : 'mens_health',
      is_primary: true,
      assigned_date: new Date().toISOString().split('T')[0]
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

    console.log('Successfully created assignments:', insertData);

    console.log('\n✅ SUCCESS! Provider created and patients assigned.');
    console.log(`Provider ID: ${newProvider.id}`);
    console.log(`Assigned ${assignments.length} patients`);

  } catch (error) {
    console.error('Script error:', error);
  }
}

createProviderAndAssign();