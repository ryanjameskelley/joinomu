// API utilities and error handling

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  code?: string
  details?: any
}

export interface PaginationOptions {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export class ApiUtils {
  /**
   * Standardize API responses
   */
  static createResponse<T>(
    success: boolean, 
    data?: T, 
    error?: string, 
    code?: string
  ): ApiResponse<T> {
    return {
      success,
      data,
      error,
      code
    }
  }

  /**
   * Handle Supabase errors and convert to standardized format
   */
  static handleSupabaseError(error: any): { error: string; code?: string } {
    if (!error) {
      return { error: 'Unknown error occurred' }
    }

    // Common Supabase error codes
    const errorMappings: Record<string, string> = {
      '23505': 'A record with this information already exists',
      '23503': 'Referenced record does not exist',
      '42501': 'Insufficient permissions',
      'PGRST116': 'No records found',
      'PGRST301': 'Invalid request format'
    }

    const code = error.code || error.error_code
    const message = errorMappings[code] || error.message || 'An unexpected error occurred'

    console.error('Supabase error:', { code, message, details: error })

    return {
      error: message,
      code
    }
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Validate phone number format (US)
   */
  static isValidPhoneNumber(phone: string): boolean {
    const phoneRegex = /^\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/
    return phoneRegex.test(phone)
  }

  /**
   * Validate zip code format (US)
   */
  static isValidZipCode(zipCode: string): boolean {
    const zipRegex = /^\d{5}(-\d{4})?$/
    return zipRegex.test(zipCode)
  }

  /**
   * Sanitize and validate user input
   */
  static sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential XSS characters
      .substring(0, 1000) // Limit length
  }

  /**
   * Generate pagination metadata
   */
  static generatePagination(
    page: number,
    limit: number,
    total: number
  ): PaginatedResponse<any>['pagination'] {
    const totalPages = Math.ceil(total / limit)
    
    return {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  }

  /**
   * Retry function with exponential backoff
   */
  static async retry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: any

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error
        
        if (attempt === maxRetries) {
          throw error
        }

        // Exponential backoff
        const delay = baseDelay * Math.pow(2, attempt - 1)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError
  }

  /**
   * Format date for API responses
   */
  static formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toISOString()
  }

  /**
   * Calculate BMI
   */
  static calculateBMI(weightPounds: number, heightInches: number): number {
    return Math.round(((weightPounds / (heightInches * heightInches)) * 703) * 10) / 10
  }

  /**
   * Convert height to inches
   */
  static heightToInches(feet: number, inches: number): number {
    return (feet * 12) + inches
  }

  /**
   * Format currency for display
   */
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  /**
   * Mask sensitive data for logging
   */
  static maskSensitiveData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data
    }

    const sensitiveFields = ['password', 'ssn', 'credit_card', 'token', 'secret']
    const masked = { ...data }

    for (const key in masked) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        masked[key] = '***MASKED***'
      } else if (key.toLowerCase().includes('email')) {
        // Partially mask email
        const email = masked[key]
        if (typeof email === 'string' && email.includes('@')) {
          const [username, domain] = email.split('@')
          masked[key] = `${username.substring(0, 2)}***@${domain}`
        }
      } else if (typeof masked[key] === 'object') {
        masked[key] = this.maskSensitiveData(masked[key])
      }
    }

    return masked
  }

  /**
   * Generate unique ID for tracking
   */
  static generateTrackingId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Validate required fields
   */
  static validateRequiredFields(
    data: Record<string, any>, 
    requiredFields: string[]
  ): { isValid: boolean; missingFields: string[] } {
    const missingFields = requiredFields.filter(field => {
      const value = data[field]
      return value === undefined || value === null || value === ''
    })

    return {
      isValid: missingFields.length === 0,
      missingFields
    }
  }

  /**
   * Sleep utility for delays
   */
  static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * Logger utility for consistent logging across services
 */
export class Logger {
  private static context: string = 'SharedServices'

  static setContext(context: string): void {
    this.context = context
  }

  static info(message: string, data?: any): void {
    console.log(`[${this.context}] INFO: ${message}`, data ? ApiUtils.maskSensitiveData(data) : '')
  }

  static warn(message: string, data?: any): void {
    console.warn(`[${this.context}] WARN: ${message}`, data ? ApiUtils.maskSensitiveData(data) : '')
  }

  static error(message: string, error?: any, data?: any): void {
    console.error(`[${this.context}] ERROR: ${message}`, {
      error: error?.message || error,
      stack: error?.stack,
      data: data ? ApiUtils.maskSensitiveData(data) : undefined
    })
  }

  static debug(message: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[${this.context}] DEBUG: ${message}`, data ? ApiUtils.maskSensitiveData(data) : '')
    }
  }
}

/**
 * Rate limiting utility for API calls
 */
export class RateLimiter {
  private static requests: Map<string, number[]> = new Map()

  static async checkLimit(
    key: string, 
    maxRequests: number, 
    windowMs: number
  ): Promise<{ allowed: boolean; resetTime?: number }> {
    const now = Date.now()
    const requests = this.requests.get(key) || []
    
    // Clean old requests outside window
    const validRequests = requests.filter(time => now - time < windowMs)
    
    if (validRequests.length >= maxRequests) {
      const oldestRequest = Math.min(...validRequests)
      const resetTime = oldestRequest + windowMs
      
      return { allowed: false, resetTime }
    }

    // Add current request
    validRequests.push(now)
    this.requests.set(key, validRequests)

    return { allowed: true }
  }

  static reset(key: string): void {
    this.requests.delete(key)
  }
}