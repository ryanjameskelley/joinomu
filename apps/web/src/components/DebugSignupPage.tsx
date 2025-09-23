import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Button, Input, Label, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@joinomu/ui'
import { useAuth } from '@/hooks/useAuth'
import { authService } from '@joinomu/shared'

export function DebugSignupPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [debugLog, setDebugLog] = useState<string[]>([])

  const addLog = (message: string) => {
    console.log(message)
    setDebugLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    addLog('Form submitted')
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string

    addLog(`Form data: ${email}, ${firstName} ${lastName}`)

    try {
      addLog('Calling authService.signUp...')
      
      const result = await authService.signUp({
        email,
        password,
        firstName,
        lastName,
        role: 'patient'
      })

      addLog(`Auth service result: ${JSON.stringify(result)}`)

      if (result.error) {
        addLog(`Signup error: ${result.error.message}`)
        setError(result.error.message || 'Signup failed')
        return
      }

      addLog('Signup successful!')
      setSuccess(true)
    } catch (error: any) {
      addLog(`Exception caught: ${error.message}`)
      console.error('Signup error:', error)
      setError(error.message || 'An error occurred during signup')
    } finally {
      setLoading(false)
      addLog('Signup process completed')
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md">
          <h2 className="text-2xl font-bold">Account Created Successfully!</h2>
          <p className="text-muted-foreground">
            Your account has been created and you can now log in to access your dashboard.
          </p>
          <a 
            href="/login" 
            className="inline-block bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
          >
            Go to Login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Debug Signup Test</CardTitle>
            <CardDescription>
              Simple signup form with debug logging
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="test@example.com"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    placeholder="John"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    placeholder="Doe"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="password123"
                    required
                  />
                </div>
                
                {error && (
                  <div className="text-red-500 text-sm">{error}</div>
                )}
                
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Debug Log */}
        <Card>
          <CardHeader>
            <CardTitle>Debug Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 p-4 rounded text-xs font-mono max-h-40 overflow-y-auto">
              {debugLog.length === 0 ? (
                <div>No logs yet...</div>
              ) : (
                debugLog.map((log, index) => (
                  <div key={index}>{log}</div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}