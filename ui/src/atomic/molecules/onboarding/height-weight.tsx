import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/card'
import { Button } from '../../../components/button'
import { Input } from '../../../components/input'
import { Progress } from '@joinomu/ui'
import { cn } from '../../../lib/utils'

// JoinOmu Logo Component
function JoinOmuLogo({ className }: { className?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M12 18C12 21.3137 9.31371 24 6 24C2.68629 24 0 21.3137 0 18C0 14.6863 2.68629 12 6 12C9.31371 12 12 14.6863 12 18Z" fill="url(#paint0_linear_202_550)"/>
      <path d="M6 3C6 1.34315 7.34315 0 9 0C10.6569 0 12 1.34315 12 3V12H6V3Z" fill="url(#paint1_linear_202_550)"/>
      <path d="M12 3C12 1.34315 13.3431 0 15 0C16.6569 0 18 1.34315 18 3V12H12V3Z" fill="url(#paint2_linear_202_550)"/>
      <path d="M12 12H24V18C24 21.3137 21.3137 24 18 24C14.6863 24 12 21.3137 12 18V12Z" fill="url(#paint3_linear_202_550)"/>
      <defs>
        <linearGradient id="paint0_linear_202_550" x1="13.1184" y1="12" x2="22.8816" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#BBDDFF"/>
          <stop offset="1" stopColor="#C85A15"/>
        </linearGradient>
        <linearGradient id="paint1_linear_202_550" x1="13.1184" y1="12" x2="22.8816" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#BBDDFF"/>
          <stop offset="1" stopColor="#C85A15"/>
        </linearGradient>
        <linearGradient id="paint2_linear_202_550" x1="13.1184" y1="12" x2="22.8816" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#BBDDFF"/>
          <stop offset="1" stopColor="#C85A15"/>
        </linearGradient>
        <linearGradient id="paint3_linear_202_550" x1="13.1184" y1="12" x2="22.8816" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#BBDDFF"/>
          <stop offset="1" stopColor="#C85A15"/>
        </linearGradient>
      </defs>
    </svg>
  )
}

export interface HeightWeightProps {
  onHeightFeetChange?: (feet: string) => void
  onHeightInchesChange?: (inches: string) => void
  onWeightChange?: (weight: string) => void
  onContinue?: () => void
  onSignInClick?: () => void
  progress?: number
  title?: string
  description?: string
  className?: string
}

export function HeightWeight({
  onHeightFeetChange,
  onHeightInchesChange,
  onWeightChange,
  onContinue,
  onSignInClick,
  progress = 25,
  title = "Let's get your basic measurements",
  description = "This helps us determine your eligibility and recommend the right treatment plan.",
  className
}: HeightWeightProps) {
  const [heightFeet, setHeightFeet] = useState<string>('')
  const [heightInches, setHeightInches] = useState<string>('')
  const [weight, setWeight] = useState<string>('')

  const handleHeightFeetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Only allow numbers 3-8 for reasonable height range
    if (value === '' || (/^\d+$/.test(value) && parseInt(value) >= 3 && parseInt(value) <= 8)) {
      setHeightFeet(value)
      onHeightFeetChange?.(value)
    }
  }

  const handleHeightInchesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Only allow numbers 0-11 for inches
    if (value === '' || (/^\d+$/.test(value) && parseInt(value) >= 0 && parseInt(value) <= 11)) {
      setHeightInches(value)
      onHeightInchesChange?.(value)
    }
  }

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Allow decimal numbers for weight (no upper/lower limit during input, just format validation)
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setWeight(value)
      onWeightChange?.(value)
    }
  }

  const isFormValid = heightFeet !== '' && heightInches !== '' && weight !== '' && parseFloat(weight) > 0

  // Calculate BMI for display
  const calculateBMI = () => {
    if (heightFeet && heightInches && weight) {
      const totalInches = parseInt(heightFeet) * 12 + parseInt(heightInches)
      const weightNum = parseFloat(weight)
      const bmi = (weightNum / (totalInches * totalInches)) * 703
      return bmi.toFixed(1)
    }
    return null
  }

  const bmi = calculateBMI()

  return (
    <div className={cn("min-h-screen relative", className)}>
      {/* Progress bar and logo fixed to viewport */}
      <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
        <div className="space-y-4">
          <div className="relative">
            <Progress 
              value={progress} 
              className="bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-[#BBDDFF] [&>div]:to-[#C85A15]"
              style={{
                background: 'linear-gradient(to right, rgba(187, 221, 255, 0.2), rgba(200, 90, 21, 0.2))'
              }}
            />
          </div>
          <div className="flex items-center space-x-2">
            <JoinOmuLogo className="w-6 h-6" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">JoinOmu Healthcare</span>
          </div>
        </div>
      </div>
      
      {/* Background gradients */}
      <div 
        className="absolute inset-0" 
        style={{
          background: `
            radial-gradient(circle at 20% 30%, rgba(187, 221, 255, 0.3) 0%, transparent 20%),
            radial-gradient(circle at 70% 60%, rgba(200, 90, 21, 0.2) 0%, transparent 20%)
          `
        }}
      ></div>
      
      {/* Center container positioned below logo */}
      <div className="min-h-screen flex justify-center p-4 pt-24">
        <div className="w-full max-w-md mx-auto relative z-10">
          <Card className="border border-white/20 dark:border-none bg-white/60 dark:bg-[#0e0e0e]/60 backdrop-blur-md shadow-none h-[calc(100vh-120px)] flex flex-col">
            <CardHeader className="text-left">
              <CardTitle className="text-2xl bg-gradient-to-b from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                {title}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {description}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                {/* Height inputs */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Height</label>
                  <div className="flex space-x-3">
                    <div className="flex-1">
                      <Input
                        type="text"
                        placeholder="5"
                        value={heightFeet}
                        onChange={handleHeightFeetChange}
                      />
                      <div className="text-xs text-muted-foreground mt-1">feet</div>
                    </div>
                    <div className="flex-1">
                      <Input
                        type="text"
                        placeholder="8"
                        value={heightInches}
                        onChange={handleHeightInchesChange}
                      />
                      <div className="text-xs text-muted-foreground mt-1">inches</div>
                    </div>
                  </div>
                </div>

                {/* Weight input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Weight</label>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="150"
                      value={weight}
                      onChange={handleWeightChange}
                      className="pr-12"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                      lbs
                    </div>
                  </div>
                </div>

                {/* BMI display */}
                {bmi && (
                  <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-muted">
                    <div className="text-sm text-muted-foreground mb-2">Your BMI:</div>
                    <div className="text-lg font-semibold">{bmi}</div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <Button 
                  onClick={onContinue}
                  disabled={!isFormValid}
                  className="w-full"
                >
                  Continue
                </Button>

                <div className="text-center">
                  <span className="text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Button
                      variant="link"
                      onClick={onSignInClick}
                      className="p-0 h-auto text-sm underline text-muted-foreground"
                    >
                      Sign in
                    </Button>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}