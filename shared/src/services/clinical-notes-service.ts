import { supabase } from '../config/supabase.js'

export interface ClinicalNote {
  id: string
  appointment_id: string
  patient_id: string
  provider_id: string
  allergies: string[]
  previous_medications: string[]
  current_medications: string[]
  clinical_note: string
  internal_note: string
  visit_summary: string
  created_at: string
  updated_at: string
  created_by?: string
  last_updated_by?: string
}

export interface CreateClinicalNoteData {
  appointment_id: string
  patient_id: string
  provider_id: string
  allergies?: string[]
  previous_medications?: string[]
  current_medications?: string[]
  clinical_note?: string
  internal_note?: string
  visit_summary?: string
  created_by?: string
}

export interface UpdateClinicalNoteData {
  allergies?: string[]
  previous_medications?: string[]
  current_medications?: string[]
  clinical_note?: string
  internal_note?: string
  visit_summary?: string
  last_updated_by?: string
}

export interface VisitInteraction {
  id: string
  clinical_note_id: string
  appointment_id: string
  interaction_type: 'medication_adjustment' | 'treatment_plan_update' | 'follow_up_scheduled' | 'referral_made' | 'lab_ordered'
  medication_id?: string
  medication_name?: string
  previous_dosage?: string
  new_dosage?: string
  previous_frequency?: string
  new_frequency?: string
  previous_status?: string
  new_status?: 'pending' | 'approved' | 'denied' | 'discontinued'
  details?: string
  provider_notes?: string
  created_at: string
  performed_by: string
}

export interface CreateVisitInteractionData {
  clinical_note_id: string
  appointment_id: string
  interaction_type: 'medication_adjustment' | 'treatment_plan_update' | 'follow_up_scheduled' | 'referral_made' | 'lab_ordered'
  medication_id?: string
  medication_name?: string
  previous_dosage?: string
  new_dosage?: string
  previous_frequency?: string
  new_frequency?: string
  previous_status?: string
  new_status?: 'pending' | 'approved' | 'denied' | 'discontinued'
  details?: string
  provider_notes?: string
  performed_by: string
}

export class ClinicalNotesService {
  // Clinical Notes CRUD operations
  
  static async createClinicalNote(data: CreateClinicalNoteData): Promise<ClinicalNote> {
    const { data: clinicalNote, error } = await supabase
      .from('clinical_notes')
      .insert({
        ...data,
        allergies: data.allergies || [],
        previous_medications: data.previous_medications || [],
        current_medications: data.current_medications || [],
        clinical_note: data.clinical_note || '',
        internal_note: data.internal_note || '',
        visit_summary: data.visit_summary || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create clinical note: ${error.message}`)
    }

    return clinicalNote
  }

  static async getClinicalNoteByAppointmentId(appointmentId: string): Promise<ClinicalNote | null> {
    const { data: clinicalNote, error } = await supabase
      .from('clinical_notes')
      .select('*')
      .eq('appointment_id', appointmentId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null
      }
      throw new Error(`Failed to get clinical note: ${error.message}`)
    }

    return clinicalNote
  }

  static async getClinicalNoteById(id: string): Promise<ClinicalNote | null> {
    const { data: clinicalNote, error } = await supabase
      .from('clinical_notes')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null
      }
      throw new Error(`Failed to get clinical note: ${error.message}`)
    }

    return clinicalNote
  }

  static async updateClinicalNote(id: string, updates: UpdateClinicalNoteData): Promise<ClinicalNote> {
    const { data: clinicalNote, error } = await supabase
      .from('clinical_notes')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update clinical note: ${error.message}`)
    }

    return clinicalNote
  }

  static async upsertClinicalNote(appointmentId: string, data: CreateClinicalNoteData | UpdateClinicalNoteData): Promise<ClinicalNote> {
    // First, try to get existing clinical note for this appointment
    const existingNote = await this.getClinicalNoteByAppointmentId(appointmentId)
    
    if (existingNote) {
      // Update existing clinical note
      return await this.updateClinicalNote(existingNote.id, data as UpdateClinicalNoteData)
    } else {
      // Create new clinical note
      return await this.createClinicalNote(data as CreateClinicalNoteData)
    }
  }

  static async getClinicalNotesByPatientId(patientId: string): Promise<ClinicalNote[]> {
    const { data: clinicalNotes, error } = await supabase
      .from('clinical_notes')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to get clinical notes: ${error.message}`)
    }

    return clinicalNotes || []
  }

  static async getClinicalNotesByProviderId(providerId: string): Promise<ClinicalNote[]> {
    const { data: clinicalNotes, error } = await supabase
      .from('clinical_notes')
      .select('*')
      .eq('provider_id', providerId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to get clinical notes: ${error.message}`)
    }

    return clinicalNotes || []
  }

  static async deleteClinicalNote(id: string): Promise<void> {
    const { error } = await supabase
      .from('clinical_notes')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete clinical note: ${error.message}`)
    }
  }

  // Visit Interactions CRUD operations

  static async createVisitInteraction(data: CreateVisitInteractionData): Promise<VisitInteraction> {
    const { data: interaction, error } = await supabase
      .from('visit_interactions')
      .insert({
        ...data,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create visit interaction: ${error.message}`)
    }

    return interaction
  }

  static async getVisitInteractionsByAppointmentId(appointmentId: string): Promise<VisitInteraction[]> {
    const { data: interactions, error } = await supabase
      .from('visit_interactions')
      .select('*')
      .eq('appointment_id', appointmentId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to get visit interactions: ${error.message}`)
    }

    return interactions || []
  }

  static async getVisitInteractionsByClinicalNoteId(clinicalNoteId: string): Promise<VisitInteraction[]> {
    const { data: interactions, error } = await supabase
      .from('visit_interactions')
      .select('*')
      .eq('clinical_note_id', clinicalNoteId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to get visit interactions: ${error.message}`)
    }

    return interactions || []
  }

  static async getMedicationInteractionsByAppointmentId(appointmentId: string): Promise<VisitInteraction[]> {
    const { data: interactions, error } = await supabase
      .from('visit_interactions')
      .select('*')
      .eq('appointment_id', appointmentId)
      .eq('interaction_type', 'medication_adjustment')
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to get medication interactions: ${error.message}`)
    }

    return interactions || []
  }

  // Combined operations for convenience

  static async saveClinicalNoteWithInteractions(
    appointmentId: string,
    clinicalNoteData: CreateClinicalNoteData | UpdateClinicalNoteData,
    interactions: CreateVisitInteractionData[] = []
  ): Promise<{ clinicalNote: ClinicalNote; interactions: VisitInteraction[] }> {
    // Save clinical note
    const clinicalNote = await this.upsertClinicalNote(appointmentId, clinicalNoteData)

    // Save interactions
    const savedInteractions: VisitInteraction[] = []
    for (const interactionData of interactions) {
      const interaction = await this.createVisitInteraction({
        ...interactionData,
        clinical_note_id: clinicalNote.id,
        appointment_id: appointmentId
      })
      savedInteractions.push(interaction)
    }

    return { clinicalNote, interactions: savedInteractions }
  }

  static async getClinicalNoteWithInteractions(appointmentId: string): Promise<{
    clinicalNote: ClinicalNote | null
    interactions: VisitInteraction[]
  }> {
    const clinicalNote = await this.getClinicalNoteByAppointmentId(appointmentId)
    const interactions = await this.getVisitInteractionsByAppointmentId(appointmentId)

    return { clinicalNote, interactions }
  }
}