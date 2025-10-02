// Trace user UIDs from auth table to provider/patient tables and create assignment
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

async function traceAndAssign() {
  try {
    const providerAuthId = '02438205-29ee-44c1-94f2-10342a9fe7cf';
    const patientAuthId = 'e2b62e92-840b-4db4-8e37-7f2208b1ac23';
    
    console.log('🔍 Tracing user UIDs from auth table...');
    
    // Check auth table first
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Auth error:', authError);
      return;
    }
    
    const providerAuth = authUsers.users.find(u => u.id === providerAuthId);
    const patientAuth = authUsers.users.find(u => u.id === patientAuthId);
    
    console.log('Provider auth user:', providerAuth ? `${providerAuth.email} (${providerAuth.id})` : 'NOT FOUND');
    console.log('Patient auth user:', patientAuth ? `${patientAuth.email} (${patientAuth.id})` : 'NOT FOUND');
    
    if (!providerAuth || !patientAuth) {
      console.error('❌ One or both users not found in auth table');
      return;
    }
    
    console.log('\n🔍 Finding provider record...');
    
    // Find provider record using profile_id (which should match auth user id)
    const { data: providerData, error: providerError } = await supabase
      .from('providers')
      .select('*')
      .eq('profile_id', providerAuthId);
    
    console.log('Provider query result:', providerData);
    if (providerError) console.log('Provider error:', providerError);
    
    console.log('\n🔍 Finding patient record...');
    
    // Find patient record using profile_id
    const { data: patientData, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('profile_id', patientAuthId);
    
    console.log('Patient query result:', patientData);
    if (patientError) console.log('Patient error:', patientError);
    
    if (!providerData || providerData.length === 0) {
      console.error('❌ Provider record not found for auth ID:', providerAuthId);
      return;
    }
    
    if (!patientData || patientData.length === 0) {
      console.error('❌ Patient record not found for auth ID:', patientAuthId);
      return;
    }
    
    const provider = providerData[0];
    const patient = patientData[0];
    
    console.log(`\n✅ Found provider: ${provider.id} (profile: ${provider.profile_id})`);
    console.log(`✅ Found patient: ${patient.id} (profile: ${patient.profile_id})`);
    
    // Check existing assignment
    const { data: existingAssignment } = await supabase
      .from('patient_assignments')
      .select('*')
      .eq('provider_id', provider.id)
      .eq('patient_id', patient.id)
      .eq('active', true);
    
    if (existingAssignment && existingAssignment.length > 0) {
      console.log('ℹ️ Assignment already exists:', existingAssignment[0]);
      return;
    }
    
    console.log('\n🔄 Creating assignment...');
    
    // Create the assignment
    const { data: newAssignment, error: assignmentError } = await supabase
      .from('patient_assignments')
      .insert({
        provider_id: provider.id,
        patient_id: patient.id,
        treatment_type: 'weight_loss',
        is_primary: true,
        active: true,
        assigned_date: new Date().toISOString()
      })
      .select()
      .single();
    
    if (assignmentError) {
      console.error('❌ Assignment error:', assignmentError);
      return;
    }
    
    console.log('✅ SUCCESS! Assignment created:');
    console.log(`   Provider ID: ${provider.id} (Auth: ${providerAuthId})`);
    console.log(`   Patient ID: ${patient.id} (Auth: ${patientAuthId})`);
    console.log(`   Assignment ID: ${newAssignment.id}`);
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

traceAndAssign();