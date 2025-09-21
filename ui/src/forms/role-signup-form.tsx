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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/select"

interface RoleSignupFormProps {
  className?: string
  onSubmit?: (data: SignupFormData) => void
  loading?: boolean
  error?: string
  showLoginLink?: boolean
  loginLink?: string
  minPasswordLength?: number
}

export interface SignupFormData {
  email: string
  password: string
  firstName: string
  lastName: string
  role: 'patient' | 'admin' | 'provider'
  dateOfBirth?: string
  phone?: string
  specialty?: string
  licenseNumber?: string
}

export function RoleSignupForm({
  className,
  onSubmit,
  loading = false,
  error,
  showLoginLink = true,
  loginLink = "/login",
  minPasswordLength = 6,
  ...props
}: RoleSignupFormProps) {
  const [formData, setFormData] = React.useState<SignupFormData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'patient',
    dateOfBirth: '',
    phone: '',
    specialty: '',
    licenseNumber: ''
  })
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [localError, setLocalError] = React.useState('')

  const handleInputChange = (field: keyof SignupFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')

    if (formData.password !== confirmPassword) {
      setLocalError('Passwords do not match')
      return
    }

    if (formData.password.length < minPasswordLength) {
      setLocalError(`Password must be at least ${minPasswordLength} characters`)
      return
    }

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setLocalError('First name and last name are required')
      return
    }

    if (formData.role === 'provider' && (!formData.specialty || !formData.licenseNumber)) {
      setLocalError('Specialty and license number are required for providers')
      return
    }

    onSubmit?.(formData)
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
            <div className="flex flex-col gap-4">
              {/* Role Selection */}
              <div className="grid gap-3">
                <Label htmlFor="role">Account Type</Label>
                <Select value={formData.role} onValueChange={(value: 'patient' | 'admin' | 'provider') => handleInputChange('role', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="patient">Patient</SelectItem>
                    <SelectItem value="provider">Healthcare Provider</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Personal Information */}
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-3">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="John"
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
                    placeholder="Doe"
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
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>

              {/* Optional Phone */}
              <div className="grid gap-3">
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>

              {/* Patient-specific fields */}
              {formData.role === 'patient' && (
                <div className="grid gap-3">
                  <Label htmlFor="dateOfBirth">Date of Birth (Optional)</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  />
                </div>
              )}

              {/* Provider-specific fields */}
              {formData.role === 'provider' && (
                <>
                  <div className="grid gap-3">
                    <Label htmlFor="specialty">Medical Specialty</Label>
                    <Input
                      id="specialty"
                      type="text"
                      placeholder="Family Medicine"
                      value={formData.specialty}
                      onChange={(e) => handleInputChange('specialty', e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="licenseNumber">License Number</Label>
                    <Input
                      id="licenseNumber"
                      type="text"
                      placeholder="MD123456"
                      value={formData.licenseNumber}
                      onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                      required
                    />
                  </div>
                </>
              )}

              {/* Password fields */}
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
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required 
                />
              </div>

              {displayError && (
                <div className="text-destructive text-sm text-center">{displayError}</div>
              )}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
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