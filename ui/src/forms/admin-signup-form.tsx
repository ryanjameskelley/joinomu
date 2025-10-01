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

interface AdminSignupFormProps {
  className?: string
  onSubmit?: (email: string, password: string, firstName: string, lastName: string) => void
  loading?: boolean
  error?: string
}

export function AdminSignupForm({
  className,
  onSubmit,
  loading = false,
  error
}: AdminSignupFormProps) {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [firstName, setFirstName] = React.useState('')
  const [lastName, setLastName] = React.useState('')
  const [localError, setLocalError] = React.useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters')
      return
    }

    onSubmit?.(email, password, firstName, lastName)
  }

  const displayError = error || localError

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Admin Account Request</CardTitle>
          <CardDescription>
            Request admin access to the JoinOmu platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-3">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@joinomu.com"
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
                  {loading ? 'Creating Account...' : 'Request Admin Access'}
                </Button>
              </div>
            </div>
            <div className="mt-4 text-center text-sm">
              Already have admin access?{" "}
              <a href="/admin-login" className="underline underline-offset-4">
                Sign in
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export type { AdminSignupFormProps }