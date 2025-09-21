import * as React from "react"
import { cn } from "../lib/utils"
import { Button } from "../components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/card"
import { Input } from "../components/input"
import { Label } from "../components/label"

interface SignupFormProps {
  className?: string
  onSubmit?: (email: string, password: string) => void
  loading?: boolean
  error?: string
  showGoogleSignup?: boolean
  showLoginLink?: boolean
  loginLink?: string
  minPasswordLength?: number
}

export function SignupForm({
  className,
  onSubmit,
  loading = false,
  error,
  showGoogleSignup = true,
  showLoginLink = true,
  loginLink = "/login",
  minPasswordLength = 6,
  ...props
}: SignupFormProps) {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [localError, setLocalError] = React.useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match')
      return
    }

    if (password.length < minPasswordLength) {
      setLocalError(`Password must be at least ${minPasswordLength} characters`)
      return
    }

    onSubmit?.(email, password)
  }

  const displayError = error || localError

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>
            Enter your information below to create your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input 
                  id="confirmPassword" 
                  type="password" 
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required 
                />
              </div>
              {displayError && (
                <div className="text-destructive text-sm text-center">{displayError}</div>
              )}
              <div className="flex flex-col gap-3">
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>
                {showGoogleSignup && (
                  <Button variant="outline" className="w-full">
                    Sign up with Google
                  </Button>
                )}
              </div>
            </div>
            {showLoginLink && (
              <div className="mt-4 text-center text-sm">
                Already have an account?{" "}
                <a href={loginLink} className="underline underline-offset-4">
                  Sign in
                </a>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}