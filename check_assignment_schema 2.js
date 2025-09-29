#!/usr/bin/env node

/**
 * Check patient_assignments table schema
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkSchema() {
  console.log('🔍 Checking patient_assignments table schema...')
  
  try {
    // Get a sample record to see the columns
    const { data: sample, error: sampleError } = await supabase
      .from('patient_assignments')
      .select('*')
      .limit(1)
    
    if (sampleError) {
      console.log('❌ Error or no data:', sampleError)
    } else {
      console.log('✅ Sample record:', sample)
      if (sample && sample.length > 0) {
        console.log('📋 Available columns:', Object.keys(sample[0]))
      }
    }
    
    // Also check providers table to see what columns it has
    console.log('\n🔍 Checking providers table...')
    const { data: providerSample, error: providerError } = await supabase
      .from('providers')
      .select('*')
      .limit(1)
    
    if (providerError) {
      console.log('❌ Provider error:', providerError)
    } else {
      console.log('✅ Provider sample:', providerSample)
      if (providerSample && providerSample.length > 0) {
        console.log('📋 Provider columns:', Object.keys(providerSample[0]))
      }
    }
    
    // Check patients table
    console.log('\n🔍 Checking patients table...')
    const { data: patientSample, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .limit(1)
    
    if (patientError) {
      console.log('❌ Patient error:', patientError)
    } else {
      console.log('✅ Patient sample:', patientSample)
      if (patientSample && patientSample.length > 0) {
        console.log('📋 Patient columns:', Object.keys(patientSample[0]))
      }
    }
    
  } catch (error) {
    console.error('💥 Error:', error)
  }
}

checkSchema()
