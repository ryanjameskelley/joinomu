import { supabase } from '../config/supabase.js'

export interface Provider {
  id: string
  user_id: string
  email: string
  first_name: string
  last_name: string
  license_number: string
  specialty: string
  phone: string
  active: boolean
  licensed: string[]
  created_at: string
  updated_at: string
}

export interface CreateProviderData {
  user_id: string
  email: string
  first_name: string
  last_name: string
  license_number: string
  specialty: string
  phone: string
  licensed?: string[]
  active?: boolean
}

export interface UpdateProviderData {
  first_name?: string
  last_name?: string
  license_number?: string
  specialty?: string
  phone?: string
  licensed?: string[]
  active?: boolean
}

export class ProvidersService {
  static async createProvider(data: CreateProviderData): Promise<Provider> {
    const { data: provider, error } = await supabase
      .from('providers')
      .insert({
        ...data,
        active: data.active ?? false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create provider: ${error.message}`)
    }

    return provider
  }

  static async getProviderByUserId(userId: string): Promise<Provider | null> {
    console.log('🚨 ProvidersService.getProviderByUserId called for userId:', userId)
    console.trace('🚨 ProvidersService.getProviderByUserId call stack')
    const { data: provider, error } = await supabase
      .from('providers')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null
      }
      throw new Error(`Failed to get provider: ${error.message}`)
    }

    return provider
  }

  static async getProviderByEmail(email: string): Promise<Provider | null> {
    const { data: provider, error } = await supabase
      .from('providers')
      .select('*')
      .eq('email', email)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null
      }
      throw new Error(`Failed to get provider: ${error.message}`)
    }

    return provider
  }

  static async getProviderById(id: string): Promise<Provider | null> {
    const { data: provider, error } = await supabase
      .from('providers')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null
      }
      throw new Error(`Failed to get provider: ${error.message}`)
    }

    return provider
  }

  static async updateProvider(id: string, updates: UpdateProviderData): Promise<Provider> {
    const { data: provider, error } = await supabase
      .from('providers')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update provider: ${error.message}`)
    }

    return provider
  }

  static async activateProvider(id: string): Promise<Provider> {
    return this.updateProvider(id, { active: true })
  }

  static async deactivateProvider(id: string): Promise<Provider> {
    return this.updateProvider(id, { active: false })
  }

  static async getAllProviders(): Promise<Provider[]> {
    const { data: providers, error } = await supabase
      .from('providers')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to get providers: ${error.message}`)
    }

    return providers || []
  }

  static async getActiveProviders(): Promise<Provider[]> {
    const { data: providers, error } = await supabase
      .from('providers')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to get active providers: ${error.message}`)
    }

    return providers || []
  }

  static async deleteProvider(id: string): Promise<void> {
    const { error } = await supabase
      .from('providers')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete provider: ${error.message}`)
    }
  }
}