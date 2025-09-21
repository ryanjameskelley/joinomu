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

interface LoginFormProps {
  className?: string
  onSubmit?: (email: string, password: string) => void
  loading?: boolean
  error?: string
  showForgotPassword?: boolean
  showGoogleLogin?: boolean
  showSignupLink?: boolean
  signupLink?: string
}

export function LoginForm({
  className,
  onSubmit,
  loading = false,
  error,
  showForgotPassword = true,
  showGoogleLogin = true,
  showSignupLink = true,
  signupLink = "/signup",
  ...props
}: LoginFormProps) {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit?.(email, password)
  }
  
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
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
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  {showForgotPassword && (
                    <a
                      href="#"
                      className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                    >
                      Forgot your password?
                    </a>
                  )}
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
              {error && (
                <div className="text-destructive text-sm text-center">{error}</div>
              )}
              <div className="flex flex-col gap-3">
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Signing in...' : 'Login'}
                </Button>
                {showGoogleLogin && (
                  <Button variant="outline" className="w-full">
                    Login with Google
                  </Button>
                )}
              </div>
            </div>
            {showSignupLink && (
              <div className="mt-4 text-center text-sm">
                Don&apos;t have an account?{" "}
                <a href={signupLink} className="underline underline-offset-4">
                  Sign up
                </a>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}