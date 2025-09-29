import * as React from "react"
import { cn } from "@/utils/cn"
import { Button } from "@/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/card"
import { Input } from "@/ui/input"
import { Label } from "@/ui/label"

export type UserRole = 'patient' | 'provider' | 'admin'

interface LoginFormData {
  email: string
  password: string
}

interface LoginFormProps extends React.ComponentPropsWithoutRef<"div"> {
  onSubmit?: (data: LoginFormData) => void
  loading?: boolean
  error?: string
  userRole: UserRole
  showSignupLink?: boolean
  signupLink?: string
}

export function LoginForm({
  className,
  onSubmit,
  loading = false,
  error,
  userRole,
  showSignupLink = false,
  signupLink = "/signup",
  ...props
}: LoginFormProps) {
  const [formData, setFormData] = React.useState<LoginFormData>({
    email: '',
    password: ''
  })

  const handleInputChange = (field: keyof LoginFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit?.(formData)
  }

  const getRoleTitle = () => {
    switch (userRole) {
      case 'patient':
        return 'Patient Login'
      case 'provider':
        return 'Provider Login'
      case 'admin':
        return 'Admin Login'
      default:
        return 'Login'
    }
  }

  const getRoleDescription = () => {
    switch (userRole) {
      case 'patient':
        return 'Sign in to access your patient portal'
      case 'provider':
        return 'Sign in to access your provider dashboard'
      case 'admin':
        return 'Sign in to access the admin panel'
      default:
        return 'Enter your credentials to sign in'
    }
  }

  const getSignupText = () => {
    switch (userRole) {
      case 'patient':
        return "Don't have a patient account?"
      case 'provider':
        return "Don't have a provider account?"
      case 'admin':
        return "Need admin access?"
      default:
        return "Don't have an account?"
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{getRoleTitle()}</CardTitle>
          <CardDescription>
            {getRoleDescription()}
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
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required 
                />
              </div>

              {error && (
                <div className="text-destructive text-sm text-center">{error}</div>
              )}

              <div className="flex flex-col gap-3">
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </div>
            </div>

            {showSignupLink && (
              <div className="mt-4 text-center text-sm">
                {getSignupText()}{" "}
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