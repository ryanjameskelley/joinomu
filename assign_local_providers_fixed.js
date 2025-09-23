const { createClient } = require('@supabase/supabase-js');

// Local Supabase connection
const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

async function assignPatientsToLocalProviders() {
  try {
    console.log('Connecting to local Supabase...');
    
    // Get all providers (they don't have email/name columns, just profile_id)
    const { data: providers, error: providersError } = await supabase
      .from('providers')
      .select('id, profile_id, specialty')
      .order('created_at');

    if (providersError) {
      console.error('Error fetching providers:', providersError);
      return;
    }

    console.log(`Found ${providers.length} providers:`);
    providers.forEach((provider, index) => {
      console.log(`${index + 1}. ID: ${provider.id}, Profile: ${provider.profile_id}, Specialty: ${provider.specialty}`);
    });

    // Get all patients (they also don't have email/name columns, just profile_id)
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('id, profile_id, phone')
      .order('created_at');

    if (patientsError) {
      console.error('Error fetching patients:', patientsError);
      return;
    }

    console.log(`\nFound ${patients.length} patients:`);
    patients.forEach((patient, index) => {
      console.log(`${index + 1}. ID: ${patient.id}, Profile: ${patient.profile_id}, Phone: ${patient.phone || 'N/A'}`);
    });

    if (providers.length < 2 || patients.length < 3) {
      console.log('Need at least 2 providers and 3 patients to make assignments');
      return;
    }

    // Check existing assignments (using patient_assignments table)
    let existingAssignments = [];
    const { data: existingAssignmentsData, error: assignError } = await supabase
      .from('patient_assignments')
      .select('provider_id, patient_id');

    if (assignError) {
      console.error('Error fetching existing assignments:', assignError);
      // If table doesn't exist, create empty array
      if (assignError.code === 'PGRST205') {
        console.log('No existing assignments table found, creating new assignments');
        existingAssignments = [];
      } else {
        return;
      }
    } else {
      existingAssignments = existingAssignmentsData;
    }

    console.log(`\nExisting assignments: ${existingAssignments.length}`);

    // Find providers that don't have many assignments
    const assignmentsByProvider = {};
    existingAssignments.forEach(assignment => {
      if (!assignmentsByProvider[assignment.provider_id]) {
        assignmentsByProvider[assignment.provider_id] = 0;
      }
      assignmentsByProvider[assignment.provider_id]++;
    });

    // Take the first 2 providers for assignment
    const providersToAssign = providers.slice(0, 2);

    console.log(`\nProviders to assign patients to: ${providersToAssign.length}`);
    providersToAssign.forEach(p => {
      console.log(`- ID: ${p.id} (${p.specialty}) - current assignments: ${assignmentsByProvider[p.id] || 0}`);
    });

    // Create new assignments
    const newAssignments = [];
    let patientIndex = 0;

    // Assign 3 patients to each provider
    for (const provider of providersToAssign) {
      for (let i = 0; i < 3 && patientIndex < patients.length; i++) {
        // Check if this assignment already exists
        const existsAlready = existingAssignments.some(existing => 
          existing.provider_id === provider.id && existing.patient_id === patients[patientIndex].id
        );

        if (!existsAlready) {
          newAssignments.push({
            provider_id: provider.id,
            patient_id: patients[patientIndex].id,
            assigned_date: new Date().toISOString().split('T')[0]
          });
        }
        patientIndex++;
      }
    }

    console.log(`\nCreating ${newAssignments.length} new assignments...`);
    
    if (newAssignments.length > 0) {
      const { data: insertData, error: insertError } = await supabase
        .from('patient_assignments')
        .insert(newAssignments)
        .select();

      if (insertError) {
        console.error('Error creating assignments:', insertError);
        
        // If table doesn't exist, let's create it first
        if (insertError.code === 'PGRST205') {
          console.log('Creating patient_assignments table...');
          
          const { error: createError } = await supabase.rpc('exec_sql', {
            sql: `
              CREATE TABLE IF NOT EXISTS patient_assignments (
                id SERIAL PRIMARY KEY,
                provider_id UUID REFERENCES providers(id),
                patient_id UUID REFERENCES patients(id),
                assigned_date DATE DEFAULT CURRENT_DATE,
                created_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(provider_id, patient_id)
              );
            `
          });
          
          if (createError) {
            console.error('Error creating table:', createError);
          } else {
            console.log('Table created, retrying assignments...');
            
            const { data: retryData, error: retryError } = await supabase
              .from('patient_assignments')
              .insert(newAssignments)
              .select();
              
            if (retryError) {
              console.error('Retry error:', retryError);
            } else {
              console.log('Successfully created assignments:', retryData.length);
            }
          }
        }
        return;
      }

      console.log('Successfully created assignments:', insertData.length);
    } else {
      console.log('No new assignments needed');
    }

    // Verify final assignments
    console.log('\nVerifying final assignments...');
    const { data: finalAssignments, error: finalError } = await supabase
      .from('patient_assignments')
      .select('provider_id, patient_id');

    if (finalError) {
      console.error('Error fetching final assignments:', finalError);
      return;
    }

    const assignmentsByProviderFinal = {};
    finalAssignments.forEach(assignment => {
      const providerId = assignment.provider_id;
      if (!assignmentsByProviderFinal[providerId]) {
        assignmentsByProviderFinal[providerId] = [];
      }
      assignmentsByProviderFinal[providerId].push(assignment.patient_id);
    });

    console.log('\n=== FINAL ASSIGNMENT SUMMARY ===');
    Object.keys(assignmentsByProviderFinal).forEach(providerId => {
      const provider = providers.find(p => p.id === providerId);
      console.log(`\nProvider ${provider?.specialty || providerId}: ${assignmentsByProviderFinal[providerId].length} patients`);
      assignmentsByProviderFinal[providerId].forEach((patientId, index) => {
        const patient = patients.find(p => p.id === patientId);
        console.log(`  ${index + 1}. Patient ${patient?.profile_id || patientId}`);
      });
    });

    console.log('\n✅ Provider assignment completed successfully!');
    console.log('You can now test the provider patient tables with different provider accounts.');
    console.log('Check the local Supabase Studio at: http://127.0.0.1:54323/project/default/editor');

  } catch (error) {
    console.error('Script error:', error);
  }
}

assignPatientsToLocalProviders();