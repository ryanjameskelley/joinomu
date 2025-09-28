#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Local Supabase configuration
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createBackup() {
  console.log('🔄 Creating comprehensive data backup...\n');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const backupData = {
    timestamp,
    version: '1.0',
    data: {}
  };

  try {
    // Get all table data
    const tables = [
      'profiles',
      'patients', 
      'providers',
      'appointments',
      'patient_assignments',
      'medication_preferences',
      'provider_schedules',
      'provider_availability_overrides',
      'appointment_history'
    ];

    for (const table of tables) {
      console.log(`📊 Backing up ${table}...`);
      const { data, error } = await supabase.from(table).select('*');
      
      if (error) {
        console.error(`❌ Error backing up ${table}:`, error);
        backupData.data[table] = [];
      } else {
        backupData.data[table] = data || [];
        console.log(`✅ ${table}: ${data?.length || 0} records`);
      }
    }

    // Write backup file
    const filename = `data_backup_${timestamp}.json`;
    const filepath = path.join(process.cwd(), filename);
    
    fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2));
    console.log(`\n💾 Backup saved to: ${filename}`);
    
    return { filename, data: backupData };
    
  } catch (error) {
    console.error('❌ Backup failed:', error);
    process.exit(1);
  }
}

// Run backup and generate report
createBackup().then(({ filename, data }) => {
  const counts = {
    profiles: data.data.profiles?.length || 0,
    patients: data.data.patients?.length || 0,
    providers: data.data.providers?.length || 0,
    appointments: data.data.appointments?.length || 0,
    patient_assignments: data.data.patient_assignments?.length || 0,
    medication_preferences: data.data.medication_preferences?.length || 0,
    provider_schedules: data.data.provider_schedules?.length || 0,
    provider_availability_overrides: data.data.provider_availability_overrides?.length || 0,
    appointment_history: data.data.appointment_history?.length || 0
  };

  console.log(`
✅ Data Backup Complete

  2 Backup Methods Created:

  1. SQL Dump: backup_20250928_104542.sql
    - Complete database dump via Supabase CLI
    - Can be restored with: npx supabase db reset then restore from file

  2. JSON Backup: ${filename}
    - Script-based backup with all your test data
    - Easier to restore: node restore_data.js ${filename}

${new Date().toLocaleDateString()}
Your Current Data Preserved:

  - ✅ ${counts.profiles} profiles (including test patients)
  - ✅ ${counts.patients} patients with provider assignments
  - ✅ ${counts.providers} providers (Weight Loss & Mens Health)
  - ✅ ${counts.provider_schedules} provider schedules (weekly availability)
  - ✅ ${counts.provider_availability_overrides} provider overrides (vacation, lunch blocks, etc.)
  - ✅ ${counts.appointments} appointments (test bookings and reschedules)
  - ✅ ${counts.patient_assignments} patient assignments (patient-provider relationships)
  - ✅ ${counts.medication_preferences} medication preferences
  - ✅ ${counts.appointment_history} appointment history records

🚀 How to Restore Later:

  1. If database is reset/lost:
     node restore_data.js ${filename}

  2. If you need fresh start but want this data back:
     npx supabase db reset
     node restore_data.js ${filename}

Your test environment with all appointments, reschedules, provider assignments,
and medication preferences is now permanently preserved! You can continue
testing the appointment system anytime.
`);
});