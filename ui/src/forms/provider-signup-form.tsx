import { useState } from 'react'
import { Button } from '../components/button'
import { Input } from '../components/input'
import { Label } from '../components/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/card'
import { Alert, AlertDescription } from '../components/alert'
import { Link } from 'react-router-dom'

interface ProviderSignupFormProps {
  onSubmit: (data: {
    email: string
    password: string
    firstName: string
    lastName: string
    licenseNumber: string
    specialty: string
    phone: string
  }) => Promise<void>
  loading?: boolean
  error?: string
  showLoginLink?: boolean
  loginLink?: string
}

export function ProviderSignupForm({ 
  onSubmit, 
  loading = false, 
  error = '',
  showLoginLink = true,
  loginLink = '/provider/login'
}: ProviderSignupFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    licenseNumber: '',
    specialty: '',
    phone: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email) newErrors.email = 'Email is required'
    if (!formData.password) newErrors.password = 'Password is required'
    if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters'
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    if (!formData.firstName) newErrors.firstName = 'First name is required'
    if (!formData.lastName) newErrors.lastName = 'Last name is required'
    if (!formData.licenseNumber) newErrors.licenseNumber = 'License number is required'
    if (!formData.specialty) newErrors.specialty = 'Specialty is required'
    if (!formData.phone) newErrors.phone = 'Phone number is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    const { confirmPassword, ...submitData } = formData
    await onSubmit(submitData)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Provider Registration</CardTitle>
        <CardDescription className="text-center">
          Create your healthcare provider account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                type="text"
                placeholder="John"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                required
                disabled={loading}
              />
              {errors.firstName && (
                <p className="text-sm text-destructive">{errors.firstName}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Doe"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                required
                disabled={loading}
              />
              {errors.lastName && (
                <p className="text-sm text-destructive">{errors.lastName}</p>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="provider@example.com"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
              disabled={loading}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimum 8 characters"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required
                disabled={loading}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                required
                disabled={loading}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="licenseNumber">License Number</Label>
              <Input
                id="licenseNumber"
                type="text"
                placeholder="MD123456"
                value={formData.licenseNumber}
                onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                required
                disabled={loading}
              />
              {errors.licenseNumber && (
                <p className="text-sm text-destructive">{errors.licenseNumber}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialty">Specialty</Label>
              <Input
                id="specialty"
                type="text"
                placeholder="Internal Medicine"
                value={formData.specialty}
                onChange={(e) => handleInputChange('specialty', e.target.value)}
                required
                disabled={loading}
              />
              {errors.specialty && (
                <p className="text-sm text-destructive">{errors.specialty}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="(555) 123-4567"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              required
              disabled={loading}
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone}</p>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Provider Account'}
          </Button>
        </form>
      </CardContent>
      {showLoginLink && (
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Already have a provider account?{' '}
            <Link to={loginLink} className="text-primary hover:underline">
              Sign in here
            </Link>
          </p>
        </CardFooter>
      )}
    </Card>
  )
}