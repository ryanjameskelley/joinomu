import { supabase } from '../config/supabase.js'

export interface VisitAddendum {
  id: string
  visit_id: string
  provider_id: string
  content: string
  created_at: string
}

export interface CreateAddendumData {
  visit_id: string
  provider_id: string
  content: string
}

export class AddendumService {
  
  static async createAddendum(data: CreateAddendumData): Promise<VisitAddendum> {
    const { data: addendum, error } = await supabase
      .from('visit_addendums')
      .insert({
        visit_id: data.visit_id,
        provider_id: data.provider_id,
        content: data.content.trim(),
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create addendum: ${error.message}`)
    }

    return addendum
  }

  static async getAddendumsByVisitId(visitId: string): Promise<VisitAddendum[]> {
    const { data: addendums, error } = await supabase
      .from('visit_addendums')
      .select('*')
      .eq('visit_id', visitId)
      .order('created_at', { ascending: false }) // Most recent first

    if (error) {
      throw new Error(`Failed to get addendums: ${error.message}`)
    }

    return addendums || []
  }

  static async deleteAddendum(id: string): Promise<void> {
    const { error } = await supabase
      .from('visit_addendums')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete addendum: ${error.message}`)
    }
  }

  static async getAddendumsByProviderId(providerId: string): Promise<VisitAddendum[]> {
    const { data: addendums, error } = await supabase
      .from('visit_addendums')
      .select('*')
      .eq('provider_id', providerId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to get provider addendums: ${error.message}`)
    }

    return addendums || []
  }
}