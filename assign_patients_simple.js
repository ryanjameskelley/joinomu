const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xxhkwgkbdzhwapudijzq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4aGt3Z2tiZHpod2FwdWRpanpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2NDk3MjgsImV4cCI6MjA1MDIyNTcyOH0.uKFaNTOzT-DyB_BSKuDZaOOgzpjvKLrNZy4QZwKqy3w'
);

async function assignPatientsToProviders() {
  try {
    console.log('Fetching providers...');
    
    // Get all providers
    const { data: providers } = await supabase
      .from('providers')
      .select('id, email, name');

    console.log('Providers found:', providers?.length || 0);
    
    // Get all patients  
    const { data: patients } = await supabase
      .from('patients')
      .select('id, email, name');

    console.log('Patients found:', patients?.length || 0);

    if (!providers || !patients || providers.length < 2 || patients.length < 3) {
      console.log('Not enough providers or patients to make assignments');
      return;
    }

    // Filter out the heavily assigned provider
    const availableProviders = providers.filter(p => 
      !p.email.includes('provider-test-1758500385268')
    );

    console.log('Available providers for assignment:', availableProviders.length);

    if (availableProviders.length < 2) {
      console.log('Need at least 2 available providers');
      return;
    }

    // Create assignments
    const assignments = [];
    
    // Assign first 3 patients to first provider
    for (let i = 0; i < 3 && i < patients.length; i++) {
      assignments.push({
        provider_id: availableProviders[0].id,
        patient_id: patients[i].id,
        assigned_date: new Date().toISOString().split('T')[0]
      });
    }

    // Assign next 3 patients to second provider
    for (let i = 3; i < 6 && i < patients.length; i++) {
      assignments.push({
        provider_id: availableProviders[1].id,
        patient_id: patients[i].id,
        assigned_date: new Date().toISOString().split('T')[0]
      });
    }

    console.log('Creating assignments:', assignments.length);

    // Insert assignments
    const { data, error } = await supabase
      .from('patient_provider_assignments')
      .upsert(assignments, { 
        onConflict: 'provider_id,patient_id',
        ignoreDuplicates: true 
      });

    if (error) {
      console.error('Error creating assignments:', error);
      return;
    }

    console.log('Assignments created successfully');

    // Verify assignments
    const { data: finalAssignments } = await supabase
      .from('patient_provider_assignments')
      .select(`
        provider_id,
        providers(email, name),
        patients(email, name)
      `);

    console.log('\nFinal assignment summary:');
    const summary = {};
    finalAssignments?.forEach(assignment => {
      const providerEmail = assignment.providers.email;
      if (!summary[providerEmail]) {
        summary[providerEmail] = [];
      }
      summary[providerEmail].push(assignment.patients.name);
    });

    Object.keys(summary).forEach(email => {
      console.log(`${email}: ${summary[email].length} patients`);
      summary[email].forEach(name => console.log(`  - ${name}`));
    });

  } catch (error) {
    console.error('Script error:', error);
  }
}

assignPatientsToProviders();