import { readFileSync } from 'fs'
import { execSync } from 'child_process'
import { promises as fs } from 'fs'

// Read the migration SQL file
const migrationSQL = readFileSync('./supabase/migrations/20251015025000_add_multi_treatment_eligibility_system.sql', 'utf8')

async function executeMigration() {
  console.log('🚀 Executing eligibility system migration via direct database connection...\n')
  
  try {
    // Write the SQL to a temporary file
    const tempSqlFile = './temp_eligibility_migration.sql'
    await fs.writeFile(tempSqlFile, migrationSQL, 'utf8')
    
    console.log('📝 Migration SQL written to temporary file')
    console.log('🔗 Connecting to local Supabase database...')
    
    // Execute the SQL file directly via psql using the local Supabase connection
    const dbUrl = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
    
    console.log('⚡ Executing migration...')
    
    // Use the database URL from Supabase status
    const result = execSync(`echo "${migrationSQL.replace(/"/g, '\\"')}" | docker exec -i supabase_db_joinomu-monorepo psql -U postgres -d postgres`, {
      encoding: 'utf8',
      stdio: 'pipe'
    })
    
    console.log('✅ Migration executed successfully!')
    console.log('📋 Output:', result)
    
    // Clean up temp file
    await fs.unlink(tempSqlFile)
    
    // Verify the tables were created
    console.log('\n🔍 Verifying tables were created...')
    
    const verifyResult = execSync(`echo "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND (tablename LIKE '%eligibility%' OR tablename LIKE '%treatment%');" | docker exec -i supabase_db_joinomu-monorepo psql -U postgres -d postgres`, {
      encoding: 'utf8'
    })
    
    console.log('📊 Tables found:')
    console.log(verifyResult)
    
    return true
    
  } catch (error) {
    console.log('❌ Error executing migration:')
    console.log(error.message)
    
    if (error.stdout) {
      console.log('📋 STDOUT:', error.stdout)
    }
    if (error.stderr) {
      console.log('🚨 STDERR:', error.stderr)
    }
    
    return false
  }
}

// Alternative approach using curl to the Studio API
async function executeViaStudio() {
  console.log('\n🔄 Trying alternative approach via Supabase Studio API...')
  
  try {
    const studioUrl = 'http://127.0.0.1:54323'
    
    // Try to execute via Studio's SQL editor endpoint
    const response = await fetch(`${studioUrl}/api/sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: migrationSQL
      })
    })
    
    if (response.ok) {
      const result = await response.json()
      console.log('✅ Migration executed via Studio API!')
      console.log('📋 Result:', result)
      return true
    } else {
      const error = await response.text()
      console.log('❌ Studio API error:', error)
      return false
    }
    
  } catch (err) {
    console.log('❌ Studio API failed:', err.message)
    return false
  }
}

// Main execution
async function main() {
  console.log('🎯 Multi-Treatment Eligibility System Migration\n')
  console.log('📄 Migration file: 20251015025000_add_multi_treatment_eligibility_system.sql')
  console.log('📏 SQL size:', migrationSQL.length, 'characters\n')
  
  // Try direct database execution first
  const directSuccess = await executeMigration()
  
  if (!directSuccess) {
    // Try via Studio API if direct execution fails
    const studioSuccess = await executeViaStudio()
    
    if (!studioSuccess) {
      console.log('\n❌ All migration methods failed')
      console.log('💡 Manual steps:')
      console.log('1. Open Supabase Studio at http://127.0.0.1:54323')
      console.log('2. Go to SQL Editor')
      console.log('3. Copy and paste the migration SQL from the file:')
      console.log('   supabase/migrations/20251015025000_add_multi_treatment_eligibility_system.sql')
      console.log('4. Execute the SQL')
      return
    }
  }
  
  console.log('\n🎉 Migration completed successfully!')
  console.log('💡 Next steps:')
  console.log('- Run verification script to confirm tables were created')
  console.log('- Test the new eligibility system functionality')
}

main().catch(console.error)