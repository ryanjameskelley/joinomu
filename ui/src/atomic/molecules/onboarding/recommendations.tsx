import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/card'
import { Button } from '../../../components/button'
import { Badge } from '../../../components/badge'
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

// CheckCircle Icon Component
function CheckCircle({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
    </svg>
  )
}

// How Medication Helps Component
function HowMedicationHelpsCard({ onReturnClick }: { onReturnClick: () => void }) {
  return (
    <div className="space-y-8">
      {/* Experience Section */}
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold bg-gradient-to-b from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Experience
          </h3>
          <p className="text-sm text-muted-foreground">
            If you've tried it all and found that nothing has worked
          </p>
        </div>
        
        <div className="space-y-3">
          <p className="text-sm font-medium">Medication can help because it:</p>
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-gradient-to-b from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 mt-2 flex-shrink-0"></div>
              <span className="text-sm text-muted-foreground">Makes you feel fuller quicker and longer</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-gradient-to-b from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 mt-2 flex-shrink-0"></div>
              <span className="text-sm text-muted-foreground">Doesn't involve restrictive diets</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-gradient-to-b from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 mt-2 flex-shrink-0"></div>
              <span className="text-sm text-muted-foreground">Is trusted and developed by Doctors experienced in weight loss</span>
            </div>
          </div>
        </div>
      </div>

      {/* Nutrition Section */}
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold bg-gradient-to-b from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Nutrition
          </h3>
          <p className="text-sm text-muted-foreground">
            Food noise is a constant distraction in your life
          </p>
        </div>
        
        <div className="space-y-3">
          <p className="text-sm font-medium">Medication can help because it:</p>
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-gradient-to-b from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 mt-2 flex-shrink-0"></div>
              <span className="text-sm text-muted-foreground">Eliminates cravings and overeating</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-gradient-to-b from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 mt-2 flex-shrink-0"></div>
              <span className="text-sm text-muted-foreground">Silences the food noise caused by your brain's appetite center</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-gradient-to-b from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 mt-2 flex-shrink-0"></div>
              <span className="text-sm text-muted-foreground">Helps you build a healthier relationship with food</span>
            </div>
          </div>
        </div>
      </div>

      {/* Return Link */}
      <div className="flex justify-center pt-4">
        <Button 
          variant="link" 
          className="text-sm text-muted-foreground underline p-0 h-auto"
          onClick={onReturnClick}
        >
          Return
        </Button>
      </div>
    </div>
  )
}

// BMI Card Component following the design
function BMICard({ bmi, height, weight, onHowMedicationHelpsClick }: { bmi: number; height: string; weight: string; onHowMedicationHelpsClick: () => void }) {
  const bmiPosition = ((bmi - 18.5) / (40 - 18.5)) * 100
  const medicationZoneStart = ((25 - 18.5) / (40 - 18.5)) * 100
  const medicationZoneWidth = ((35 - 25) / (40 - 18.5)) * 100

  return (
    <div className="space-y-6">

      {/* BMI Display */}
      <div className="space-y-1.5">
        <p className="text-muted-foreground text-sm">
          Your BMI
        </p>
        <div 
          className="font-bold bg-gradient-to-b from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent"
          style={{ fontSize: '102px', lineHeight: '1' }}
        >
          {bmi}
        </div>
        <div className="flex gap-2 mb-6">
          <Badge variant="secondary" className="text-xs">6'0"</Badge>
          <Badge variant="secondary" className="text-xs">{weight}</Badge>
        </div>

        {/* Rectangle and Scale Labels */}
        <div className="space-y-2">
          {/* Triangle indicator */}
          <div className="w-full flex justify-end">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path 
                d="M4 8 L12 16 L20 8 Z" 
                fill="#C85A15" 
                stroke="#C85A15" 
                strokeWidth="4"
                strokeLinejoin="round"
                strokeLinecap="round"
                rx="8"
              />
            </svg>
          </div>
          <div 
            className="relative"
            style={{ 
              height: '30px', 
              width: '100%', 
              backgroundColor: '#d1d5db', 
              borderRadius: '15px' 
            }}
          >
            {/* Medication Zone - right 75% */}
            <div 
              className="absolute right-0 h-full flex items-center justify-center"
              style={{ 
                width: '75%', 
                background: 'linear-gradient(to bottom, #374151, #1f2937)',
                borderRadius: '15px'
              }}
            >
              <span className="text-white text-sm font-medium">Medication Zone</span>
            </div>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>18.5</span>
            <span>40</span>
          </div>
        </div>
      </div>

      {/* Confirmation */}
      <div className="space-y-3">
        <div className="flex items-center justify-center gap-3">
          <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(to bottom, #111827, #374151)' }}>
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-sm bg-gradient-to-b from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Your BMI qualifies for weight loss medication</span>
        </div>
        
        <div className="flex justify-center">
          <Button 
            variant="link" 
            className="text-sm text-muted-foreground underline p-0 h-auto"
            onClick={onHowMedicationHelpsClick}
          >
            How medication helps
          </Button>
        </div>
      </div>
    </div>
  )
}

export interface MedicationRecommendationProps {
  onContinue?: () => void
  onSignInClick?: () => void
  onHowMedicationHelpsClick?: () => void
  progress?: number
  title?: string
  subtitle?: string
  bmi?: number
  height?: string
  weight?: string
  showBMICard?: boolean
  showHowMedicationHelps?: boolean
  className?: string
}

export function MedicationRecommendation({
  onContinue,
  onSignInClick,
  onHowMedicationHelpsClick,
  progress = 100,
  title = "Medication may be right for you based on what you've shared.",
  subtitle = "Here's why:",
  bmi = 41,
  height = "6.0",
  weight = "300 lbs",
  showBMICard = true,
  showHowMedicationHelps = false,
  className
}: MedicationRecommendationProps) {
  const [isFlipped, setIsFlipped] = useState(showHowMedicationHelps)
  
  // Sync with prop changes
  useEffect(() => {
    setIsFlipped(showHowMedicationHelps)
  }, [showHowMedicationHelps])
  
  const handleShowHowMedicationHelps = () => {
    if (onHowMedicationHelpsClick) {
      onHowMedicationHelpsClick()
    } else {
      setIsFlipped(true)
    }
  }
  
  const handleReturnToBMI = () => {
    setIsFlipped(false)
  }

  return (
    <div className={cn("min-h-screen relative", className)}>
      {/* CSS for flip animation is now handled via inline styles */}
      
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
          <div className="h-[calc(100vh-120px)] flex flex-col">
            {/* Flip Card Container */}
            <div 
              className="flip-card flex-1" 
              style={{ perspective: '1000px' }}
            >
              <div 
                className="flip-card-inner relative w-full h-full transition-transform duration-1000 ease-in-out"
                style={{ 
                  transformStyle: 'preserve-3d',
                  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                }}
              >
                {/* Front Side - BMI Card */}
                <div 
                  className="flip-card-front absolute inset-0"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <Card className="border border-white/20 dark:border-none bg-white/60 dark:bg-[#0e0e0e]/60 backdrop-blur-md shadow-none h-full flex flex-col">
                    <CardHeader className="text-left">
                      <CardTitle className="text-2xl bg-gradient-to-b from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                        {title}
                      </CardTitle>
                      <CardDescription className="text-muted-foreground">
                        {subtitle}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <BMICard 
                        bmi={bmi} 
                        height={height} 
                        weight={weight} 
                        onHowMedicationHelpsClick={handleShowHowMedicationHelps}
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* Back Side - How Medication Helps */}
                <div 
                  className="flip-card-back absolute inset-0"
                  style={{ 
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)'
                  }}
                >
                  <Card className="border border-white/20 dark:border-none bg-white/60 dark:bg-[#0e0e0e]/60 backdrop-blur-md shadow-none h-full flex flex-col">
                    <CardHeader className="text-left">
                      <CardTitle className="text-2xl bg-gradient-to-b from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                        How medication helps
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <div className="overflow-y-auto pr-2 h-full">
                        <HowMedicationHelpsCard onReturnClick={handleReturnToBMI} />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            {/* Continue Button and Sign In - Outside flip card */}
            <div className="space-y-4 mt-4">
              <Button 
                onClick={onContinue}
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
          </div>
        </div>
      </div>
    </div>
  )
}