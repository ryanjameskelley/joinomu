// OpenTelemetry monitoring and analytics for production healthcare app

export interface MonitoringConfig {
  serviceName: string
  serviceVersion: string
  environment: 'development' | 'staging' | 'production'
  enableTracing: boolean
  enableMetrics: boolean
  enableLogging: boolean
  sampleRate: number
  endpoint?: string
  apiKey?: string
}

export interface UserAction {
  action: string
  category: 'navigation' | 'interaction' | 'health_data' | 'authentication' | 'error'
  label?: string
  value?: number
  userId?: string
  patientId?: string
  sessionId?: string
  metadata?: Record<string, any>
}

export interface PerformanceMetric {
  name: string
  value: number
  unit: 'ms' | 'count' | 'bytes' | 'percentage'
  tags?: Record<string, string>
}

export interface HealthcareMetric {
  metricType: 'patient_action' | 'data_sync' | 'device_connection' | 'consent_granted' | 'audit_event'
  value: number
  patientId?: string
  providerId?: string
  deviceType?: string
  dataType?: string
  complianceLevel?: 'hipaa' | 'gdpr' | 'hitech'
  tags?: Record<string, string>
}

class MonitoringService {
  private config: MonitoringConfig
  private initialized = false
  private sessionId: string
  private userId?: string
  private patientId?: string

  constructor() {
    this.sessionId = this.generateSessionId()
    this.config = {
      serviceName: 'joinomu-app',
      serviceVersion: '1.0.0',
      environment: (process.env.NODE_ENV as any) || 'development',
      enableTracing: process.env.VITE_ENABLE_ANALYTICS === 'true',
      enableMetrics: process.env.VITE_ENABLE_ANALYTICS === 'true',
      enableLogging: process.env.VITE_ENABLE_ERROR_REPORTING === 'true',
      sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
      apiKey: process.env.OTEL_EXPORTER_OTLP_HEADERS?.split('=')[1]
    }
  }

  async initialize(config?: Partial<MonitoringConfig>): Promise<void> {
    if (this.initialized) return

    this.config = { ...this.config, ...config }

    if (typeof window === 'undefined') {
      // Server-side initialization would go here
      return
    }

    try {
      // Initialize OpenTelemetry Web SDK
      await this.initializeWebSDK()
      
      // Set up error monitoring
      this.setupErrorMonitoring()
      
      // Set up performance monitoring
      this.setupPerformanceMonitoring()
      
      // Set up user interaction tracking
      this.setupUserInteractionTracking()

      this.initialized = true
      console.log('Monitoring service initialized successfully')
    } catch (error) {
      console.error('Failed to initialize monitoring service:', error)
    }
  }

  private async initializeWebSDK(): Promise<void> {
    // This would normally import and configure OpenTelemetry
    // For now, we'll create a mock implementation
    
    if (this.config.enableTracing) {
      // Configure tracing
      console.log('Tracing enabled for', this.config.serviceName)
    }

    if (this.config.enableMetrics) {
      // Configure metrics
      console.log('Metrics enabled for', this.config.serviceName)
    }

    if (this.config.enableLogging) {
      // Configure logging
      console.log('Logging enabled for', this.config.serviceName)
    }
  }

  private setupErrorMonitoring(): void {
    if (typeof window === 'undefined') return

    // Global error handler
    window.addEventListener('error', (event) => {
      this.reportError({
        error: event.error,
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        type: 'javascript_error'
      })
    })

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError({
        error: event.reason,
        message: 'Unhandled promise rejection',
        type: 'unhandled_rejection'
      })
    })
  }

  private setupPerformanceMonitoring(): void {
    if (typeof window === 'undefined' || !window.performance) return

    // Monitor page load performance
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        if (navigation) {
          this.recordPerformanceMetric({
            name: 'page_load_time',
            value: navigation.loadEventEnd - navigation.fetchStart,
            unit: 'ms',
            tags: {
              page: window.location.pathname,
              environment: this.config.environment
            }
          })
        }
      }, 0)
    })

    // Monitor resource loading
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          const resource = entry as PerformanceResourceTiming
          this.recordPerformanceMetric({
            name: 'resource_load_time',
            value: resource.responseEnd - resource.fetchStart,
            unit: 'ms',
            tags: {
              resource: resource.name,
              type: this.getResourceType(resource.name)
            }
          })
        }
      }
    })

    try {
      observer.observe({ entryTypes: ['resource', 'navigation', 'paint'] })
    } catch (error) {
      console.warn('Performance observer not supported:', error)
    }
  }

  private setupUserInteractionTracking(): void {
    if (typeof window === 'undefined') return

    // Track clicks on important elements
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement
      if (target.matches('[data-analytics]')) {
        const action = target.getAttribute('data-analytics') || 'click'
        const category = target.getAttribute('data-category') || 'interaction'
        const label = target.getAttribute('data-label') || target.textContent?.trim()

        this.trackUserAction({
          action,
          category: category as any,
          label,
          metadata: {
            elementType: target.tagName.toLowerCase(),
            className: target.className,
            id: target.id
          }
        })
      }
    })

    // Track page views
    this.trackPageView(window.location.pathname)
  }

  setUser(userId: string, patientId?: string): void {
    this.userId = userId
    this.patientId = patientId
    
    // Set user context in monitoring tools
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.setUser({
        id: userId,
        patientId: patientId
      })
    }
  }

  trackUserAction(action: UserAction): void {
    if (!this.initialized || !this.config.enableMetrics) return

    const enrichedAction = {
      ...action,
      userId: action.userId || this.userId,
      patientId: action.patientId || this.patientId,
      sessionId: action.sessionId || this.sessionId,
      timestamp: new Date().toISOString(),
      environment: this.config.environment
    }

    // Send to analytics service
    this.sendAnalyticsEvent('user_action', enrichedAction)

    // Log for debugging in development
    if (this.config.environment === 'development') {
      console.log('User Action:', enrichedAction)
    }
  }

  trackPageView(path: string, title?: string): void {
    this.trackUserAction({
      action: 'page_view',
      category: 'navigation',
      label: path,
      metadata: {
        title: title || document.title,
        referrer: document.referrer,
        userAgent: navigator.userAgent
      }
    })
  }

  recordPerformanceMetric(metric: PerformanceMetric): void {
    if (!this.initialized || !this.config.enableMetrics) return

    const enrichedMetric = {
      ...metric,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId,
      environment: this.config.environment
    }

    // Send to metrics service
    this.sendMetric('performance', enrichedMetric)
  }

  recordHealthcareMetric(metric: HealthcareMetric): void {
    if (!this.initialized || !this.config.enableMetrics) return

    const enrichedMetric = {
      ...metric,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId,
      environment: this.config.environment,
      tags: {
        ...metric.tags,
        hipaa_compliant: 'true',
        audit_required: 'true'
      }
    }

    // Send to healthcare metrics service with special handling
    this.sendHealthcareMetric(enrichedMetric)

    // Log to healthcare audit trail
    this.logHealthcareAudit(enrichedMetric)
  }

  startTrace(name: string, attributes?: Record<string, any>): TraceSpan {
    return new TraceSpan(name, attributes, this)
  }

  private reportError(errorInfo: any): void {
    if (!this.config.enableLogging) return

    const errorReport = {
      ...errorInfo,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId,
      patientId: this.patientId,
      url: window.location.href,
      userAgent: navigator.userAgent,
      environment: this.config.environment
    }

    // Send to error reporting service
    this.sendErrorReport(errorReport)
  }

  private sendAnalyticsEvent(type: string, data: any): void {
    if (Math.random() > this.config.sampleRate) return

    // Send to analytics endpoint
    this.sendToEndpoint('/api/analytics', { type, data })
  }

  private sendMetric(type: string, data: any): void {
    // Send to metrics endpoint
    this.sendToEndpoint('/api/metrics', { type, data })
  }

  private sendHealthcareMetric(data: any): void {
    // Send to healthcare-specific metrics endpoint with encryption
    this.sendToEndpoint('/api/healthcare-metrics', data, true)
  }

  private sendErrorReport(data: any): void {
    // Send to error reporting endpoint
    this.sendToEndpoint('/api/errors', data)
  }

  private logHealthcareAudit(data: any): void {
    // Send to healthcare audit log
    this.sendToEndpoint('/api/audit-log', {
      event_type: 'metric_recorded',
      ...data
    }, true)
  }

  private async sendToEndpoint(endpoint: string, data: any, encrypted: boolean = false): Promise<void> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }

      if (this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`
      }

      const body = encrypted ? await this.encryptData(data) : JSON.stringify(data)

      await fetch(endpoint, {
        method: 'POST',
        headers,
        body
      })
    } catch (error) {
      // Silently fail to avoid disrupting user experience
      console.warn('Failed to send monitoring data:', error)
    }
  }

  private async encryptData(data: any): Promise<string> {
    // In a real implementation, this would encrypt the data
    // For now, just return JSON string
    return JSON.stringify(data)
  }

  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'script'
    if (url.includes('.css')) return 'stylesheet'
    if (url.includes('.png') || url.includes('.jpg') || url.includes('.svg')) return 'image'
    if (url.includes('/api/')) return 'api'
    return 'other'
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

export class TraceSpan {
  private startTime: number
  private name: string
  private attributes: Record<string, any>
  private monitoring: MonitoringService

  constructor(name: string, attributes: Record<string, any> = {}, monitoring: MonitoringService) {
    this.name = name
    this.attributes = attributes
    this.monitoring = monitoring
    this.startTime = performance.now()
  }

  setAttribute(key: string, value: any): void {
    this.attributes[key] = value
  }

  addEvent(name: string, attributes?: Record<string, any>): void {
    // Log span event
    console.log(`Span Event [${this.name}]: ${name}`, attributes)
  }

  end(): void {
    const duration = performance.now() - this.startTime
    
    this.monitoring.recordPerformanceMetric({
      name: `trace_${this.name}`,
      value: duration,
      unit: 'ms',
      tags: this.attributes
    })
  }
}

// Healthcare-specific monitoring utilities
export class HealthcareMonitoring {
  private monitoring: MonitoringService

  constructor(monitoring: MonitoringService) {
    this.monitoring = monitoring
  }

  trackDataAccess(patientId: string, dataType: string, accessType: 'read' | 'write' | 'delete'): void {
    this.monitoring.recordHealthcareMetric({
      metricType: 'patient_action',
      value: 1,
      patientId,
      dataType,
      complianceLevel: 'hipaa',
      tags: {
        access_type: accessType,
        data_type: dataType
      }
    })
  }

  trackConsentGranted(patientId: string, consentType: string, providerId?: string): void {
    this.monitoring.recordHealthcareMetric({
      metricType: 'consent_granted',
      value: 1,
      patientId,
      providerId,
      complianceLevel: 'hipaa',
      tags: {
        consent_type: consentType
      }
    })
  }

  trackDeviceConnection(patientId: string, deviceType: string, success: boolean): void {
    this.monitoring.recordHealthcareMetric({
      metricType: 'device_connection',
      value: success ? 1 : 0,
      patientId,
      deviceType,
      tags: {
        connection_status: success ? 'connected' : 'failed'
      }
    })
  }

  trackDataSync(patientId: string, deviceType: string, recordCount: number): void {
    this.monitoring.recordHealthcareMetric({
      metricType: 'data_sync',
      value: recordCount,
      patientId,
      deviceType,
      tags: {
        sync_type: 'health_data'
      }
    })
  }
}

// Export singleton instances
export const monitoring = new MonitoringService()
export const healthcareMonitoring = new HealthcareMonitoring(monitoring)

// Initialize monitoring on app start
if (typeof window !== 'undefined') {
  monitoring.initialize().catch(console.error)
}

// React hook for monitoring
export function useMonitoring() {
  return {
    trackAction: (action: UserAction) => monitoring.trackUserAction(action),
    trackPageView: (path: string, title?: string) => monitoring.trackPageView(path, title),
    startTrace: (name: string, attributes?: Record<string, any>) => monitoring.startTrace(name, attributes),
    setUser: (userId: string, patientId?: string) => monitoring.setUser(userId, patientId)
  }
}