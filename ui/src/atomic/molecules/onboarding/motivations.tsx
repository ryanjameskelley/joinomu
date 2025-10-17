import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/card'
import { Button } from '../../../components/button'
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

export interface Motivation {
  value: string
  label: string
}

const motivations: Motivation[] = [
  { value: 'energy', label: 'Having the energy to do the things I want' },
  { value: 'confidence', label: 'Having more confidence' },
  { value: 'healthier', label: 'Becoming healthier' },
  { value: 'clothes', label: 'Feeling good in clothes' },
  { value: 'own-skin', label: 'Feeling great in my own skin' }
]

export interface WeightLossMotivationsProps {
  selectedGoal?: string
  onMotivationsSelect?: (motivations: string[]) => void
  onContinue?: () => void
  onSignInClick?: () => void
  progress?: number
  className?: string
}

export function WeightLossMotivations({
  selectedGoal = '1-15',
  onMotivationsSelect,
  onContinue,
  onSignInClick,
  progress = 120,
  className
}: WeightLossMotivationsProps) {
  const [selectedMotivations, setSelectedMotivations] = useState<string[]>([])

  const handleMotivationToggle = (motivationValue: string) => {
    const newSelectedMotivations = selectedMotivations.includes(motivationValue)
      ? selectedMotivations.filter(motivation => motivation !== motivationValue)
      : [...selectedMotivations, motivationValue]
    
    setSelectedMotivations(newSelectedMotivations)
    onMotivationsSelect?.(newSelectedMotivations)
  }

  const getGoalLabel = (goalValue: string) => {
    const goalLabels: Record<string, string> = {
      '1-15': 'Losing 1-15 lbs',
      '16-50': 'Losing 16-50 lbs',
      '51+': 'Losing 51+ lbs',
      'not-sure': 'Not sure, I just need to lose weight'
    }
    return goalLabels[goalValue] || 'Losing 1-15 lbs'
  }

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
              What would reaching your goal weight mean for you?
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Select all that apply
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Example goal from entry/weight loss */}
              <div className="p-4 bg-muted/50 rounded-lg border border-muted">
                <div className="text-sm text-muted-foreground mb-2">Your goal:</div>
                <div className="text-sm font-medium">{getGoalLabel(selectedGoal)}</div>
              </div>
              
              {/* Motivations list */}
              <div className="space-y-3">
              {motivations.map((motivation) => (
                <button
                  key={motivation.value}
                  onClick={() => handleMotivationToggle(motivation.value)}
                  className={cn(
                    "w-full p-4 text-left border rounded-lg transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    selectedMotivations.includes(motivation.value)
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-input bg-background hover:bg-accent"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{motivation.label}</span>
                    {selectedMotivations.includes(motivation.value) && (
                      <div className="h-4 w-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
            </div>

            {/* Bottom section */}
            <div className="space-y-4">
              <Button 
                onClick={onContinue}
                disabled={selectedMotivations.length === 0}
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