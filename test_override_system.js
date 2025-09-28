const { createClient } = require('@supabase/supabase-js')
const supabase = createClient('http://127.0.0.1:54321', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU')

async function testOverrideSystem() {
  const providerId = 'a44b32bb-00a5-460d-a18b-4468d59d0318'
  
  console.log('🧪 Testing 3-Layer Availability System')
  console.log('=' .repeat(50))
  
  // Clear any existing override test data
  await supabase
    .from('provider_availability_overrides')
    .delete()
    .eq('provider_id', providerId)
  
  // Test Case 1: Block an entire day (available=false, no times)
  console.log('1️⃣ Creating full day block for 2025-09-30 (vacation)')
  await supabase.from('provider_availability_overrides').insert({
    provider_id: providerId,
    date: '2025-09-30',
    start_time: null,
    end_time: null,
    available: false,
    reason: 'Provider vacation day'
  })
  
  // Test Case 2: Block specific time slots (available=false, with times)
  console.log('2️⃣ Creating partial block for 2025-10-01 12:00-14:00 (lunch meeting)')
  await supabase.from('provider_availability_overrides').insert({
    provider_id: providerId,
    date: '2025-10-01',
    start_time: '12:00:00',
    end_time: '14:00:00',
    available: false,
    reason: 'Extended lunch meeting'
  })
  
  // Test Case 3: Add custom availability (available=true, with times)
  console.log('3️⃣ Creating custom availability for 2025-10-02 19:00-21:00 (evening hours)')
  await supabase.from('provider_availability_overrides').insert({
    provider_id: providerId,
    date: '2025-10-02',
    start_time: '19:00:00',
    end_time: '21:00:00',
    available: true,
    reason: 'Special evening availability'
  })
  
  console.log('✅ Test override data created')
  
  // Show what was created
  const { data: overrides } = await supabase
    .from('provider_availability_overrides')
    .select('*')
    .eq('provider_id', providerId)
    .order('date')
  
  console.log('\n📋 Created Override Schedule:')
  overrides.forEach(override => {
    const dateStr = override.date
    const timeStr = override.start_time && override.end_time 
      ? `${override.start_time}-${override.end_time}` 
      : 'Full day'
    const typeStr = override.available ? '✅ AVAILABLE' : '🚫 BLOCKED'
    
    console.log(`   ${dateStr} ${timeStr} ${typeStr}: ${override.reason}`)
  })
  
  console.log('\n🧪 Now test the appointment booking system to see the 3-layer filtering in action!')
  console.log('- 2025-09-30: Should show NO slots (full day blocked)')
  console.log('- 2025-10-01: Should show normal slots EXCEPT 12:00-14:00 range (partial block)')
  console.log('- 2025-10-02: Should show normal slots PLUS 19:00-21:00 slots (custom availability)')
}

testOverrideSystem()