const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const supabase = createClient('http://127.0.0.1:54321', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU')

async function restoreData() {
  const filename = process.argv[2]
  if (!filename) {
    console.log('❌ Please provide backup filename: node restore_data.js <filename>')
    process.exit(1)
  }

  if (!fs.existsSync(filename)) {
    console.log(`❌ Backup file not found: ${filename}`)
    process.exit(1)
  }

  console.log(`📦 Restoring data from: ${filename}`)
  
  const backupData = JSON.parse(fs.readFileSync(filename, 'utf8'))
  console.log(`📅 Backup created: ${backupData.timestamp}`)
  console.log(`📝 Description: ${backupData.description}`)
  
  // Order matters for foreign key constraints
  const restoreOrder = [
    'profiles',
    'patients',
    'providers', 
    'admins',
    'patient_assignments',
    'provider_schedules',
    'provider_availability_overrides',
    'patient_medication_preferences',
    'medication_approvals', 
    'medication_orders',
    'appointments',
    'appointment_history'
  ]

  console.log('\n🧹 Clearing existing data...')
  
  // Clear in reverse order
  for (const table of [...restoreOrder].reverse()) {
    if (backupData[table]) {
      try {
        await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000')
        console.log(`🗑️ Cleared ${table}`)
      } catch (err) {
        console.log(`⚠️ Could not clear ${table}:`, err.message)
      }
    }
  }

  console.log('\n📥 Restoring data...')
  
  for (const table of restoreOrder) {
    const data = backupData[table]
    if (data && data.length > 0) {
      try {
        const { error } = await supabase.from(table).insert(data)
        if (error) {
          console.log(`⚠️ Error restoring ${table}:`, error.message)
        } else {
          console.log(`✅ Restored ${table}: ${data.length} records`)
        }
      } catch (err) {
        console.log(`⚠️ Exception restoring ${table}:`, err.message)
      }
    }
  }

  console.log('\n✅ Data restoration completed!')
  console.log('🚀 Your test environment should now match the backed up state')
}

restoreData()