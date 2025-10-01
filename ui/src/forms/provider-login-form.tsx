import { useState } from 'react'
import { Button } from '../components/button'
import { Input } from '../components/input'
import { Label } from '../components/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/card'
import { Alert, AlertDescription } from '../components/alert'
import { Link } from 'react-router-dom'

interface ProviderLoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void>
  loading?: boolean
  error?: string
  showSignupLink?: boolean
  signupLink?: string
}

export function ProviderLoginForm({ 
  onSubmit, 
  loading = false, 
  error = '',
  showSignupLink = true,
  signupLink = '/provider/signup'
}: ProviderLoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    await onSubmit(email, password)
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Provider Login</CardTitle>
        <CardDescription className="text-center">
          Access your provider dashboard
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="provider@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || !email || !password}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </CardContent>
      {showSignupLink && (
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Don't have a provider account?{' '}
            <Link to={signupLink} className="text-primary hover:underline">
              Sign up here
            </Link>
          </p>
        </CardFooter>
      )}
    </Card>
  )
}