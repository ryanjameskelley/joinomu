// Safe assignment script that won't delete existing users
// Following CLAUDE.md guidance: Use direct SQL inserts, avoid database resets, check if users exist

const { createClient } = require('@supabase/supabase-js');

// Local Supabase configuration
const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

async function assignProviderToPatient() {
  try {
    console.log('🔍 Looking up users...');
    
    // Provider user ID: 02438205-29ee-44c1-94f2-10342a9fe7cf
    // Patient user ID: e2b62e92-840b-4db4-8e37-7f2208b1ac23
    
    const providerUserId = '02438205-29ee-44c1-94f2-10342a9fe7cf';
    const patientUserId = 'e2b62e92-840b-4db4-8e37-7f2208b1ac23';
    
    // Find provider by profile_id (which should match user_id in auth)
    const { data: providerData, error: providerError } = await supabase
      .from('providers')
      .select('id, first_name, last_name, profile_id')
      .eq('profile_id', providerUserId)
      .single();
    
    if (providerError || !providerData) {
      console.error('❌ Provider not found with profile_id:', providerUserId);
      console.error('Error:', providerError?.message || 'No data');
      return;
    }
    
    console.log('✅ Found provider:', {
      id: providerData.id,
      name: `${providerData.first_name} ${providerData.last_name}`,
      profile_id: providerData.profile_id
    });
    
    // Find patient by profile_id
    const { data: patientData, error: patientError } = await supabase
      .from('patients')
      .select('id, first_name, last_name, profile_id')
      .eq('profile_id', patientUserId)
      .single();
    
    if (patientError || !patientData) {
      console.error('❌ Patient not found with profile_id:', patientUserId);
      console.error('Error:', patientError?.message || 'No data');
      return;
    }
    
    console.log('✅ Found patient:', {
      id: patientData.id,
      name: `${patientData.first_name} ${patientData.last_name}`,
      profile_id: patientData.profile_id
    });
    
    // Check if assignment already exists
    const { data: existingAssignment } = await supabase
      .from('patient_assignments')
      .select('*')
      .eq('provider_id', providerData.id)
      .eq('patient_id', patientData.id)
      .eq('active', true)
      .maybeSingle();
    
    if (existingAssignment) {
      console.log('ℹ️ Assignment already exists:', existingAssignment);
      return;
    }
    
    console.log('🔄 Creating patient assignment...');
    
    // Create assignment using direct insert
    const { data: assignmentData, error: assignmentError } = await supabase
      .from('patient_assignments')
      .insert({
        provider_id: providerData.id,
        patient_id: patientData.id,
        treatment_type: 'weight_loss',
        is_primary: true,
        active: true,
        assigned_date: new Date().toISOString()
      })
      .select()
      .single();
    
    if (assignmentError) {
      console.error('❌ Assignment creation error:', assignmentError);
      return;
    }
    
    console.log('✅ Successfully assigned provider to patient!');
    console.log(`   Provider: ${providerData.first_name} ${providerData.last_name} (${providerData.profile_id})`);
    console.log(`   Patient: ${patientData.first_name} ${patientData.last_name} (${patientData.profile_id})`);
    console.log(`   Assignment ID: ${assignmentData.id}`);
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

assignProviderToPatient();