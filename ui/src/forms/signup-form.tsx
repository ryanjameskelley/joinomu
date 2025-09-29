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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select"

export type UserRole = 'patient' | 'provider' | 'admin'

interface SignupFormData {
  email: string
  password: string
  confirmPassword: string
  firstName: string
  lastName: string
  role: UserRole
  specialty?: string
  licenseNumber?: string
  phone?: string
}

interface SignupFormProps extends React.ComponentPropsWithoutRef<"div"> {
  onSubmit?: (data: SignupFormData) => void
  loading?: boolean
  error?: string
  userRole: UserRole
  showLoginLink?: boolean
  loginLink?: string
}

export function SignupForm({
  className,
  onSubmit,
  loading = false,
  error,
  userRole,
  showLoginLink = false,
  loginLink = "/login",
  ...props
}: SignupFormProps) {
  const [formData, setFormData] = React.useState<SignupFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: userRole,
    specialty: '',
    licenseNumber: '',
    phone: ''
  })
  const [localError, setLocalError] = React.useState('')

  const handleInputChange = (field: keyof SignupFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')

    if (formData.password !== formData.confirmPassword) {
      setLocalError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setLocalError('Password must be at least 6 characters')
      return
    }

    if (!formData.firstName || !formData.lastName) {
      setLocalError('First name and last name are required')
      return
    }

    onSubmit?.(formData)
  }

  const displayError = error || localError

  const getRoleTitle = () => {
    switch (userRole) {
      case 'patient':
        return 'Create Patient Account'
      case 'provider':
        return 'Create Provider Account'
      case 'admin':
        return 'Create Admin Account'
      default:
        return 'Create Account'
    }
  }

  const getRoleDescription = () => {
    switch (userRole) {
      case 'patient':
        return 'Join JoinOmu to manage your health journey'
      case 'provider':
        return 'Join JoinOmu as a healthcare provider'
      case 'admin':
        return 'Request admin access to the JoinOmu platform'
      default:
        return 'Create your account to get started'
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
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-3">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="First name"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Last name"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    required
                  />
                </div>
              </div>

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

              {userRole === 'provider' && (
                <>
                  <div className="grid gap-3">
                    <Label htmlFor="specialty">Specialty</Label>
                    <Input
                      id="specialty"
                      type="text"
                      placeholder="Your medical specialty"
                      value={formData.specialty}
                      onChange={(e) => handleInputChange('specialty', e.target.value)}
                    />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="licenseNumber">License Number</Label>
                    <Input
                      id="licenseNumber"
                      type="text"
                      placeholder="Your medical license number"
                      value={formData.licenseNumber}
                      onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                    />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Your phone number"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="grid gap-3">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required 
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input 
                  id="confirmPassword" 
                  type="password" 
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
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