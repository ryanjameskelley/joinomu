// Comprehensive security utilities for healthcare application

export interface SecurityConfig {
  enableRateLimiting: boolean
  enableCSP: boolean
  enableHSTS: boolean
  enableXSSProtection: boolean
  enableClickjacking: boolean
  sessionTimeout: number // minutes
  maxLoginAttempts: number
  lockoutDuration: number // minutes
  passwordPolicy: PasswordPolicy
  auditLogging: boolean
  hipaaCompliance: boolean
}

export interface PasswordPolicy {
  minLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumbers: boolean
  requireSpecialChars: boolean
  prohibitCommonPasswords: boolean
  maxAge: number // days
}

export interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  message?: string
}

export interface SecurityHeaders {
  'Content-Security-Policy'?: string
  'Strict-Transport-Security'?: string
  'X-Content-Type-Options'?: string
  'X-Frame-Options'?: string
  'X-XSS-Protection'?: string
  'Referrer-Policy'?: string
  'Permissions-Policy'?: string
}

class SecurityService {
  private config: SecurityConfig
  private rateLimiters: Map<string, RateLimiter> = new Map()
  private loginAttempts: Map<string, LoginAttemptTracker> = new Map()
  private sessionTimers: Map<string, NodeJS.Timeout> = new Map()

  constructor() {
    this.config = {
      enableRateLimiting: true,
      enableCSP: true,
      enableHSTS: true,
      enableXSSProtection: true,
      enableClickjacking: true,
      sessionTimeout: 30, // 30 minutes
      maxLoginAttempts: 5,
      lockoutDuration: 15, // 15 minutes
      passwordPolicy: {
        minLength: 12,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        prohibitCommonPasswords: true,
        maxAge: 90 // 90 days
      },
      auditLogging: true,
      hipaaCompliance: true
    }

    this.initialize()
  }

  private initialize(): void {
    if (typeof window !== 'undefined') {
      this.setupClientSecurity()
    }
  }

  private setupClientSecurity(): void {
    // Set up Content Security Policy
    if (this.config.enableCSP) {
      this.setupCSP()
    }

    // Set up session management
    this.setupSessionManagement()

    // Set up form protection
    this.setupFormProtection()

    // Set up clipboard protection for sensitive data
    this.setupClipboardProtection()
  }

  private setupCSP(): void {
    // Healthcare-specific CSP for HIPAA compliance
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self' https://*.supabase.co https://api.sentry.io",
      "media-src 'self'",
      "object-src 'none'",
      "frame-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests"
    ]

    const csp = cspDirectives.join('; ')
    
    // Set CSP via meta tag if not set by server
    if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
      const meta = document.createElement('meta')
      meta.httpEquiv = 'Content-Security-Policy'
      meta.content = csp
      document.head.appendChild(meta)
    }
  }

  private setupSessionManagement(): void {
    // Auto-logout on session timeout
    this.resetSessionTimer()

    // Track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    events.forEach(event => {
      document.addEventListener(event, () => {
        this.resetSessionTimer()
      }, { passive: true })
    })

    // Handle visibility change (tab switching)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseSessionTimer()
      } else {
        this.resumeSessionTimer()
      }
    })
  }

  private setupFormProtection(): void {
    // Add CSRF protection to forms
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement
      if (!form.querySelector('input[name="csrf_token"]')) {
        const csrfToken = this.generateCSRFToken()
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = 'csrf_token'
        input.value = csrfToken
        form.appendChild(input)
      }
    })

    // Prevent autocomplete on sensitive fields
    const sensitiveSelectors = [
      'input[type="password"]',
      'input[name*="ssn"]',
      'input[name*="social"]',
      'input[name*="credit"]',
      'input[name*="card"]'
    ]

    sensitiveSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(input => {
        (input as HTMLInputElement).autocomplete = 'off'
      })
    })
  }

  private setupClipboardProtection(): void {
    // Prevent copying of sensitive health data
    document.addEventListener('copy', (event) => {
      const selection = window.getSelection()?.toString()
      if (selection && this.containsSensitiveData(selection)) {
        event.preventDefault()
        this.logSecurityEvent('clipboard_copy_blocked', {
          reason: 'sensitive_data_detected'
        })
      }
    })

    // Clear clipboard after copying health data
    document.addEventListener('copy', () => {
      setTimeout(() => {
        if (navigator.clipboard) {
          navigator.clipboard.writeText('').catch(() => {
            // Silently fail
          })
        }
      }, 30000) // Clear after 30 seconds
    })
  }

  // Rate limiting
  createRateLimiter(key: string, config: RateLimitConfig): RateLimiter {
    const limiter = new RateLimiter(config)
    this.rateLimiters.set(key, limiter)
    return limiter
  }

  async checkRateLimit(key: string, identifier: string): Promise<RateLimitResult> {
    const limiter = this.rateLimiters.get(key)
    if (!limiter) {
      throw new Error(`Rate limiter '${key}' not found`)
    }

    return limiter.check(identifier)
  }

  // Login attempt tracking
  trackLoginAttempt(identifier: string, success: boolean): LoginAttemptResult {
    let tracker = this.loginAttempts.get(identifier)
    if (!tracker) {
      tracker = new LoginAttemptTracker(this.config.maxLoginAttempts, this.config.lockoutDuration)
      this.loginAttempts.set(identifier, tracker)
    }

    const result = tracker.recordAttempt(success)
    
    if (result.locked) {
      this.logSecurityEvent('account_locked', {
        identifier,
        attempts: result.attempts,
        lockoutUntil: result.lockoutUntil
      })
    }

    return result
  }

  isAccountLocked(identifier: string): boolean {
    const tracker = this.loginAttempts.get(identifier)
    return tracker ? tracker.isLocked() : false
  }

  unlockAccount(identifier: string): void {
    const tracker = this.loginAttempts.get(identifier)
    if (tracker) {
      tracker.unlock()
      this.logSecurityEvent('account_unlocked', { identifier })
    }
  }

  // Password validation
  validatePassword(password: string, email?: string): PasswordValidationResult {
    const result: PasswordValidationResult = {
      isValid: true,
      errors: [],
      strength: 0
    }

    const { passwordPolicy } = this.config

    // Length check
    if (password.length < passwordPolicy.minLength) {
      result.errors.push(`Password must be at least ${passwordPolicy.minLength} characters long`)
      result.isValid = false
    } else {
      result.strength += 1
    }

    // Character requirements
    if (passwordPolicy.requireUppercase && !/[A-Z]/.test(password)) {
      result.errors.push('Password must contain at least one uppercase letter')
      result.isValid = false
    } else if (passwordPolicy.requireUppercase) {
      result.strength += 1
    }

    if (passwordPolicy.requireLowercase && !/[a-z]/.test(password)) {
      result.errors.push('Password must contain at least one lowercase letter')
      result.isValid = false
    } else if (passwordPolicy.requireLowercase) {
      result.strength += 1
    }

    if (passwordPolicy.requireNumbers && !/\d/.test(password)) {
      result.errors.push('Password must contain at least one number')
      result.isValid = false
    } else if (passwordPolicy.requireNumbers) {
      result.strength += 1
    }

    if (passwordPolicy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      result.errors.push('Password must contain at least one special character')
      result.isValid = false
    } else if (passwordPolicy.requireSpecialChars) {
      result.strength += 1
    }

    // Common password check
    if (passwordPolicy.prohibitCommonPasswords && this.isCommonPassword(password)) {
      result.errors.push('Password is too common, please choose a more unique password')
      result.isValid = false
    }

    // Email similarity check
    if (email && password.toLowerCase().includes(email.toLowerCase().split('@')[0])) {
      result.errors.push('Password should not contain your email address')
      result.isValid = false
    }

    return result
  }

  // Data sanitization
  sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove potential XSS characters
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/vbscript:/gi, '') // Remove vbscript: protocol
      .replace(/data:/gi, '') // Remove data: protocol for images/files
      .trim()
      .substring(0, 1000) // Limit length
  }

  sanitizeHealthData(data: any): any {
    if (typeof data === 'string') {
      return this.sanitizeInput(data)
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeHealthData(item))
    }

    if (typeof data === 'object' && data !== null) {
      const sanitized: any = {}
      for (const [key, value] of Object.entries(data)) {
        sanitized[this.sanitizeInput(key)] = this.sanitizeHealthData(value)
      }
      return sanitized
    }

    return data
  }

  // Session management
  private resetSessionTimer(): void {
    this.clearSessionTimer()
    
    const timer = setTimeout(() => {
      this.handleSessionTimeout()
    }, this.config.sessionTimeout * 60 * 1000)

    this.sessionTimers.set('main', timer)
  }

  private pauseSessionTimer(): void {
    // Implementation would pause the timer
  }

  private resumeSessionTimer(): void {
    // Implementation would resume the timer
    this.resetSessionTimer()
  }

  private clearSessionTimer(): void {
    const timer = this.sessionTimers.get('main')
    if (timer) {
      clearTimeout(timer)
      this.sessionTimers.delete('main')
    }
  }

  private handleSessionTimeout(): void {
    this.logSecurityEvent('session_timeout', {
      timestamp: new Date().toISOString()
    })

    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/login?reason=session_timeout'
    }
  }

  // Utility methods
  private generateCSRFToken(): string {
    return `csrf_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`
  }

  private containsSensitiveData(text: string): boolean {
    const sensitivePatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/, // Credit card
      /\b\d{3}-\d{3}-\d{4}\b/, // Phone number
      /patient\s+id/i,
      /medical\s+record/i,
      /diagnosis/i,
      /prescription/i
    ]

    return sensitivePatterns.some(pattern => pattern.test(text))
  }

  private isCommonPassword(password: string): boolean {
    const commonPasswords = [
      'password', '123456', 'password123', 'admin', 'qwerty',
      'letmein', 'welcome', 'monkey', '1234567890', 'abc123'
    ]
    
    return commonPasswords.includes(password.toLowerCase())
  }

  private logSecurityEvent(event: string, data: any): void {
    if (!this.config.auditLogging) return

    const logEntry = {
      event,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      url: typeof window !== 'undefined' ? window.location.href : '',
      ...data
    }

    // Send to security audit log
    console.log('Security Event:', logEntry)

    // In production, send to secure logging service
    if (typeof fetch !== 'undefined') {
      fetch('/api/security-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logEntry)
      }).catch(() => {
        // Silently fail
      })
    }
  }

  // Public API
  getSecurityHeaders(): SecurityHeaders {
    const headers: SecurityHeaders = {}

    if (this.config.enableCSP) {
      headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline'"
    }

    if (this.config.enableHSTS) {
      headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    }

    if (this.config.enableXSSProtection) {
      headers['X-XSS-Protection'] = '1; mode=block'
    }

    if (this.config.enableClickjacking) {
      headers['X-Frame-Options'] = 'DENY'
    }

    headers['X-Content-Type-Options'] = 'nosniff'
    headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    headers['Permissions-Policy'] = 'camera=(), microphone=(), geolocation=()'

    return headers
  }
}

// Rate limiter implementation
class RateLimiter {
  private requests: Map<string, number[]> = new Map()
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = config
  }

  async check(identifier: string): Promise<RateLimitResult> {
    const now = Date.now()
    const windowStart = now - this.config.windowMs
    
    let userRequests = this.requests.get(identifier) || []
    userRequests = userRequests.filter(time => time > windowStart)

    if (userRequests.length >= this.config.maxRequests) {
      const oldestRequest = Math.min(...userRequests)
      const resetTime = oldestRequest + this.config.windowMs

      return {
        allowed: false,
        remaining: 0,
        resetTime,
        retryAfter: Math.ceil((resetTime - now) / 1000)
      }
    }

    userRequests.push(now)
    this.requests.set(identifier, userRequests)

    return {
      allowed: true,
      remaining: this.config.maxRequests - userRequests.length,
      resetTime: now + this.config.windowMs,
      retryAfter: 0
    }
  }
}

// Login attempt tracker
class LoginAttemptTracker {
  private attempts: number = 0
  private lockoutUntil: number | null = null
  private maxAttempts: number
  private lockoutDuration: number

  constructor(maxAttempts: number, lockoutDurationMinutes: number) {
    this.maxAttempts = maxAttempts
    this.lockoutDuration = lockoutDurationMinutes * 60 * 1000
  }

  recordAttempt(success: boolean): LoginAttemptResult {
    if (this.isLocked()) {
      return {
        success: false,
        attempts: this.attempts,
        locked: true,
        lockoutUntil: this.lockoutUntil
      }
    }

    if (success) {
      this.reset()
      return {
        success: true,
        attempts: 0,
        locked: false,
        lockoutUntil: null
      }
    }

    this.attempts++

    if (this.attempts >= this.maxAttempts) {
      this.lockoutUntil = Date.now() + this.lockoutDuration
      return {
        success: false,
        attempts: this.attempts,
        locked: true,
        lockoutUntil: this.lockoutUntil
      }
    }

    return {
      success: false,
      attempts: this.attempts,
      locked: false,
      lockoutUntil: null
    }
  }

  isLocked(): boolean {
    if (!this.lockoutUntil) return false
    
    if (Date.now() >= this.lockoutUntil) {
      this.reset()
      return false
    }

    return true
  }

  unlock(): void {
    this.reset()
  }

  private reset(): void {
    this.attempts = 0
    this.lockoutUntil = null
  }
}

// Interfaces
export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  retryAfter: number
}

export interface LoginAttemptResult {
  success: boolean
  attempts: number
  locked: boolean
  lockoutUntil: number | null
}

export interface PasswordValidationResult {
  isValid: boolean
  errors: string[]
  strength: number
}

// Export singleton
export const security = new SecurityService()

// React hook for security
export function useSecurity() {
  return {
    validatePassword: (password: string, email?: string) => security.validatePassword(password, email),
    sanitizeInput: (input: string) => security.sanitizeInput(input),
    trackLoginAttempt: (identifier: string, success: boolean) => security.trackLoginAttempt(identifier, success),
    isAccountLocked: (identifier: string) => security.isAccountLocked(identifier)
  }
}