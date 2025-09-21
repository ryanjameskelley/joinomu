import { supabase } from '@/utils/supabase/client'

// Utility function to create missing patient records
export async function createMissingPatientRecord(email: string, firstName: string, lastName: string = '') {
  try {
    // First, get the user from auth by email
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      console.error('Error fetching users:', listError)
      return { success: false, error: listError.message }
    }

    const user = users.find(u => u.email === email)
    if (!user) {
      return { success: false, error: `User with email ${email} not found in auth` }
    }

    // Check if patient record already exists
    const { data: existingPatient } = await supabase
      .from('patients')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (existingPatient) {
      return { success: false, error: 'Patient record already exists' }
    }

    // Create the missing patient record
    const { data, error } = await supabase
      .from('patients')
      .insert([
        {
          user_id: user.id,
          email: email,
          first_name: firstName,
          last_name: lastName,
          has_completed_intake: false
        }
      ])
      .select()

    if (error) {
      console.error('Error creating patient record:', error)
      return { success: false, error: error.message }
    }

    console.log('Patient record created successfully:', data)
    return { success: true, data }

  } catch (error: any) {
    console.error('Unexpected error:', error)
    return { success: false, error: error.message }
  }
}

// Usage example:
// createMissingPatientRecord('ryan@gmail.com', 'Ryan', 'Kelley')