#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Local Supabase configuration
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function restoreBackup(filename) {
  if (!filename) {
    console.error('❌ Please provide backup filename: node restore_data.js <filename>');
    process.exit(1);
  }

  const filepath = path.join(process.cwd(), filename);
  
  if (!fs.existsSync(filepath)) {
    console.error(`❌ Backup file not found: ${filename}`);
    process.exit(1);
  }

  console.log(`🔄 Restoring data from ${filename}...\n`);

  try {
    const backupData = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    
    // Order is important due to foreign key constraints
    const restoreOrder = [
      'profiles',
      'providers',
      'patients',
      'patient_assignments',
      'medication_preferences',
      'provider_schedules',
      'provider_availability_overrides',
      'appointments',
      'appointment_history'
    ];

    let totalRestored = 0;

    for (const table of restoreOrder) {
      const tableData = backupData.data[table] || [];
      
      if (tableData.length === 0) {
        console.log(`⏭️  Skipping ${table} (no data)`);
        continue;
      }

      console.log(`📥 Restoring ${table} (${tableData.length} records)...`);
      
      // Insert data in batches to avoid timeout
      const batchSize = 100;
      let restored = 0;
      
      for (let i = 0; i < tableData.length; i += batchSize) {
        const batch = tableData.slice(i, i + batchSize);
        
        const { error } = await supabase
          .from(table)
          .upsert(batch, { 
            onConflict: 'id',
            ignoreDuplicates: false 
          });
        
        if (error) {
          console.error(`❌ Error restoring ${table} batch:`, error);
        } else {
          restored += batch.length;
        }
      }
      
      console.log(`✅ ${table}: ${restored} records restored`);
      totalRestored += restored;
    }

    console.log(`\n🎉 Restore Complete!`);
    console.log(`📊 Total records restored: ${totalRestored}`);
    console.log(`🕐 Backup timestamp: ${backupData.timestamp}`);
    
  } catch (error) {
    console.error('❌ Restore failed:', error);
    process.exit(1);
  }
}

// Get filename from command line argument
const filename = process.argv[2];
restoreBackup(filename);
