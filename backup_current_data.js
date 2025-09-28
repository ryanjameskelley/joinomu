const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const supabase = createClient('http://127.0.0.1:54321', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU')

async function backupCurrentData() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const backupData = {
    timestamp,
    description: 'Backup of current test data including appointments, overrides, and assignments'
  }

  console.log('📦 Backing up current database state...')
  
  // Key tables to backup
  const tables = [
    'profiles',
    'patients', 
    'providers',
    'admins',
    'patient_assignments',
    'provider_schedules',
    'provider_availability_overrides',
    'appointments',
    'appointment_history',
    'patient_medication_preferences',
    'medication_approvals',
    'medication_orders'
  ]

  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*')
      if (error) {
        console.log(`⚠️ Could not backup ${table}:`, error.message)
        backupData[table] = []
      } else {
        backupData[table] = data
        console.log(`✅ Backed up ${table}: ${data.length} records`)
      }
    } catch (err) {
      console.log(`⚠️ Error backing up ${table}:`, err.message)
      backupData[table] = []
    }
  }

  // Save to file
  const filename = `data_backup_${timestamp}.json`
  fs.writeFileSync(filename, JSON.stringify(backupData, null, 2))
  
  console.log(`\n✅ Data backup completed: ${filename}`)
  console.log('📊 Backup Summary:')
  
  tables.forEach(table => {
    const count = backupData[table]?.length || 0
    console.log(`   ${table}: ${count} records`)
  })
  
  console.log('\n💡 To restore this data later, run: node restore_data.js ' + filename)
}

backupCurrentData()