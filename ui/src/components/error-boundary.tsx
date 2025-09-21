import * as React from "react"
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import { cn } from "../lib/utils"
import { Button } from "./button"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { Alert, AlertDescription, AlertTitle } from "./alert"

export interface ErrorInfo {
  componentStack: string
  errorBoundary?: string
  errorBoundaryStack?: string
}

export interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  eventId: string | null
}

export interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  isolate?: boolean
  showDetails?: boolean
  resetKeys?: Array<string | number>
  resetOnPropsChange?: boolean
  level?: 'page' | 'section' | 'component'
  context?: string
}

export interface ErrorFallbackProps {
  error: Error
  errorInfo: ErrorInfo
  resetErrorBoundary: () => void
  eventId: string | null
  level: 'page' | 'section' | 'component'
  context?: string
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Generate a unique event ID for tracking
    const eventId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    return {
      hasError: true,
      error,
      eventId
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      errorInfo
    })

    // Log error for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    // Report to error monitoring service
    this.reportError(error, errorInfo)

    // Call onError prop if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys, resetOnPropsChange } = this.props
    const { hasError } = this.state

    if (hasError && prevProps.resetKeys !== resetKeys) {
      if (resetKeys?.some((resetKey, idx) => prevProps.resetKeys?.[idx] !== resetKey)) {
        this.resetErrorBoundary()
      }
    }

    if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
      this.resetErrorBoundary()
    }
  }

  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      window.clearTimeout(this.resetTimeoutId)
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null
    })
  }

  private reportError(error: Error, errorInfo: ErrorInfo) {
    // Report to external error tracking service
    if (typeof window !== 'undefined') {
      // Sentry integration
      if ((window as any).Sentry) {
        (window as any).Sentry.captureException(error, {
          contexts: {
            react: {
              componentStack: errorInfo.componentStack
            }
          },
          tags: {
            errorBoundary: true,
            level: this.props.level || 'component',
            context: this.props.context
          }
        })
      }

      // Custom error reporting
      const errorReport = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        level: this.props.level || 'component',
        context: this.props.context,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      }

      // Send to your error reporting endpoint
      fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(errorReport)
      }).catch(() => {
        // Silently fail if error reporting fails
      })
    }
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      
      return (
        <FallbackComponent
          error={this.state.error!}
          errorInfo={this.state.errorInfo!}
          resetErrorBoundary={this.resetErrorBoundary}
          eventId={this.state.eventId}
          level={this.props.level || 'component'}
          context={this.props.context}
        />
      )
    }

    return this.props.children
  }
}

// Default error fallback components for different levels
export function DefaultErrorFallback({
  error,
  errorInfo,
  resetErrorBoundary,
  eventId,
  level,
  context
}: ErrorFallbackProps) {
  const isProduction = process.env.NODE_ENV === 'production'

  if (level === 'page') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 text-destructive">
              <AlertTriangle className="h-full w-full" />
            </div>
            <CardTitle className="text-xl">Something went wrong</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              We're sorry, but something unexpected happened. Our team has been notified.
            </p>
            
            <div className="flex flex-col gap-2">
              <Button onClick={resetErrorBoundary} className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/'} className="w-full">
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            </div>

            {!isProduction && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-muted-foreground">
                  Technical Details
                </summary>
                <div className="mt-2 p-3 bg-muted rounded text-xs">
                  <div><strong>Error:</strong> {error.message}</div>
                  <div><strong>Event ID:</strong> {eventId}</div>
                  {context && <div><strong>Context:</strong> {context}</div>}
                  {error.stack && (
                    <details className="mt-2">
                      <summary>Stack Trace</summary>
                      <pre className="mt-1 whitespace-pre-wrap text-xs">
                        {error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              </details>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (level === 'section') {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Section Error</AlertTitle>
        <AlertDescription className="mt-2 space-y-2">
          <p>This section encountered an error and couldn't load properly.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={resetErrorBoundary}
            className="mt-2"
          >
            <RefreshCw className="mr-2 h-3 w-3" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  // Component level (default)
  return (
    <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
        <div className="flex-1 space-y-2">
          <h4 className="text-sm font-medium text-destructive">
            Component Error
          </h4>
          <p className="text-sm text-muted-foreground">
            This component failed to render properly.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={resetErrorBoundary}
          >
            <RefreshCw className="mr-2 h-3 w-3" />
            Retry
          </Button>
        </div>
      </div>
    </div>
  )
}

// Specialized error boundaries for different contexts
export function HealthDataErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      level="section"
      context="health-data"
      fallback={HealthDataErrorFallback}
      onError={(error, errorInfo) => {
        // Special handling for health data errors
        console.error('Health data error:', error, errorInfo)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

function HealthDataErrorFallback({ resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Health Data Error</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>Unable to load your health data. This might be a temporary issue.</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={resetErrorBoundary}>
            <RefreshCw className="mr-2 h-3 w-3" />
            Retry
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}

export function AuthErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      level="section"
      context="authentication"
      fallback={AuthErrorFallback}
      onError={(error, errorInfo) => {
        // Special handling for auth errors
        console.error('Authentication error:', error, errorInfo)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

function AuthErrorFallback({ resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Authentication Error</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>There was a problem with authentication. You may need to log in again.</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={resetErrorBoundary}>
            <RefreshCw className="mr-2 h-3 w-3" />
            Retry
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/login'}>
            Go to Login
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}

// Hook for programmatic error handling
export function useErrorHandler() {
  return React.useCallback((error: Error, errorInfo?: ErrorInfo) => {
    console.error('Manual error report:', error, errorInfo)
    
    // Report to monitoring service
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        extra: errorInfo
      })
    }
  }, [])
}

// Higher-order component for adding error boundaries
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Partial<ErrorBoundaryProps>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}