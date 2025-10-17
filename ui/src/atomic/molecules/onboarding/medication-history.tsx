import React, { useState, useEffect } from 'react'
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

export interface MedicationHistoryOption {
  value: string
  label: string
}

const medicationHistoryOptions: MedicationHistoryOption[] = [
  { value: 'currently-taking', label: 'I am currently taking a GLP-1 medication' },
  { value: 'taken-in-past', label: 'I have taken a GLP-1 medication in the past but I\'m not currently' },
  { value: 'never-taken', label: 'I have never taken a GLP-1 medication' }
]

export const yesNoOptions: MedicationHistoryOption[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' }
]

export const alcoholFrequencyOptions: MedicationHistoryOption[] = [
  { value: 'never', label: 'Never' },
  { value: 'few-times-year', label: 'A few times a year' },
  { value: 'once-month', label: 'Once a month' },
  { value: 'once-week', label: 'Once a week' },
  { value: 'daily-almost-daily', label: 'Daily or almost daily' }
]

export const recreationalDrugOptions: MedicationHistoryOption[] = [
  { value: 'cocaine', label: 'Cocaine' },
  { value: 'kratom', label: 'Kratom' },
  { value: 'opiates-opioids', label: 'Opiates/opioids' },
  { value: 'methamphetamine', label: 'Methamphetamine' },
  { value: 'cannabis', label: 'Cannabis' },
  { value: 'none', label: 'No, none of these' }
]

export const heartRateOptions: MedicationHistoryOption[] = [
  { value: 'dont-know', label: "I don't know" },
  { value: 'under-70', label: '<70 beats per minute' },
  { value: '70-79', label: '70 - 79 beats per minute' },
  { value: '80-99', label: '80 - 99 beats per minute' },
  { value: '100-plus', label: '100 or more beats per minute' }
]

export const gastrointestinalSymptomsOptions: MedicationHistoryOption[] = [
  { value: 'nausea', label: 'Nausea' },
  { value: 'vomiting', label: 'Vomiting' },
  { value: 'diarrhea', label: 'Diarrhea' },
  { value: 'constipation', label: 'Constipation' },
  { value: 'abdominal-pain', label: 'Abdominal pain or cramping' },
  { value: 'bloating-gas', label: 'Bloating or excessive gas' },
  { value: 'acid-reflux', label: 'Acid reflux or heartburn' },
  { value: 'difficulty-swallowing', label: 'Difficulty swallowing' },
  { value: 'loss-of-appetite', label: 'Loss of appetite' },
  { value: 'none', label: 'No, none of these' }
]

export const sideEffectsOptions: MedicationHistoryOption[] = [
  { value: 'gastrointestinal-issues', label: 'Gastrointestinal issues (like nausea, vomiting, diarrhea, constipation, and bloating)' },
  { value: 'abdominal-pain', label: 'Abdominal pain (like cramping and discomfort)' },
  { value: 'decreased-appetite', label: 'Decreased appetite' },
  { value: 'fatigue', label: 'Fatigue' },
  { value: 'dizziness', label: 'Dizziness' },
  { value: 'headaches', label: 'Headaches' },
  { value: 'no-side-effects', label: "I don't experience side effects" }
]

export const treatmentPlanOptions: MedicationHistoryOption[] = [
  { value: 'gastrointestinal-issues', label: 'Gastrointestinal issues (like nausea, vomiting, diarrhea, constipation, and bloating)' },
  { value: 'abdominal-pain', label: 'Abdominal pain (like cramping and discomfort)' },
  { value: 'decreased-appetite', label: 'Decreased appetite' },
  { value: 'fatigue', label: 'Fatigue' },
  { value: 'dizziness', label: 'Dizziness' },
  { value: 'headaches', label: 'Headaches' },
  { value: 'none', label: 'No, none of these' }
]

export const weightLossChallengesOptions: MedicationHistoryOption[] = [
  { value: 'food-noise', label: 'Food noise' },
  { value: 'motivation', label: 'Motivation' },
  { value: 'exercise', label: 'Exercise' },
  { value: 'dieting', label: 'Dieting' },
  { value: 'cost-programs', label: 'Cost of weight loss programs' },
  { value: 'medication-side-effects', label: 'Medication side effects' },
  { value: 'medical-conditions', label: 'Medical conditions that effect my weight loss' },
  { value: 'increased-appetite', label: 'Increased appetite caused by medications' },
  { value: 'other', label: 'Other' }
]

export const weightLossProgramStoppedOptions: MedicationHistoryOption[] = [
  { value: 'not-seeing-results', label: "I wasn't seeing results fast enough" },
  { value: 'couldnt-stick', label: "I couldn't stick with it" },
  { value: 'too-expensive', label: 'It became too expensive' },
  { value: 'side-effects', label: 'Side effects' },
  { value: 'stress-travel-family', label: 'Stress, travel, family obligations' },
  { value: 'other', label: 'Other' },
  { value: 'no-usually-consistent', label: "No, I'm usually consistent" }
]

export const weightLossProgramEasierOptions: MedicationHistoryOption[] = [
  { value: 'nutrition-movement', label: 'Nutrition and movement recommendations' },
  { value: 'convenient-meals', label: 'Convenient meal options' },
  { value: 'tracking-accountability', label: 'Tracking apps and accountability groups' },
  { value: 'personalized-dosage', label: 'Personalized dosage to address side effects' },
  { value: 'community-support', label: 'Stronger community support' },
  { value: 'other', label: 'Other' }
]

export const yesNoNotSureOptions: MedicationHistoryOption[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'not-sure', label: "I'm not sure" }
]

export interface MedicationHistoryScreeningProps {
  onOptionsSelect?: (option: string | string[]) => void
  onContinue?: () => void
  onSignInClick?: () => void
  progress?: number
  title?: string
  description?: string
  options?: MedicationHistoryOption[]
  multiSelect?: boolean
  selectedOption?: string
  selectedOptions?: string[]
  className?: string
}

export function MedicationHistoryScreening({
  onOptionsSelect,
  onContinue,
  onSignInClick,
  progress = 85,
  title = "Are you currently or have you ever taken a GLP-1 medication?",
  description = "GLP-1s can include compounded semaglutide, compounded tirzepatide, Ozempic, Wegovy, Mounjaro and Zepbound.",
  options = medicationHistoryOptions,
  multiSelect = false,
  selectedOption: externalSelectedOption,
  selectedOptions: externalSelectedOptions,
  className
}: MedicationHistoryScreeningProps) {
  const [selectedOption, setSelectedOption] = useState<string>(externalSelectedOption || '')
  const [selectedOptions, setSelectedOptions] = useState<string[]>(externalSelectedOptions || [])

  // Sync external props with internal state
  useEffect(() => {
    if (externalSelectedOption !== undefined) {
      setSelectedOption(externalSelectedOption)
    }
  }, [externalSelectedOption])

  useEffect(() => {
    if (externalSelectedOptions !== undefined) {
      setSelectedOptions(externalSelectedOptions)
    }
  }, [externalSelectedOptions])

  const handleOptionSelect = (optionValue: string) => {
    if (multiSelect) {
      let newSelectedOptions: string[]
      
      if (optionValue === 'none') {
        // If "none" is selected, clear all other selections and only select "none"
        newSelectedOptions = selectedOptions.includes('none') ? [] : ['none']
      } else {
        // If any other option is selected, remove "none" if it was selected
        const filteredOptions = selectedOptions.filter(s => s !== 'none')
        
        if (filteredOptions.includes(optionValue)) {
          newSelectedOptions = filteredOptions.filter(s => s !== optionValue)
        } else {
          newSelectedOptions = [...filteredOptions, optionValue]
        }
      }
      
      setSelectedOptions(newSelectedOptions)
      onOptionsSelect?.(newSelectedOptions)
    } else {
      setSelectedOption(optionValue)
      onOptionsSelect?.(optionValue)
    }
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
              {title}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {description}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Conditional scrollable container for multi-select or regular div for single-select */}
              <div className={cn(
                multiSelect 
                  ? "overflow-y-auto space-y-3 pr-2" 
                  : "space-y-3",
                multiSelect && description 
                  ? "h-[calc(100vh-480px)]" 
                  : multiSelect && !description 
                    ? "h-[calc(100vh-400px)]" 
                    : ""
              )}>
                {options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleOptionSelect(option.value)}
                    className={cn(
                      "w-full p-4 text-left border rounded-lg transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      multiSelect 
                        ? (selectedOptions.includes(option.value)
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-input bg-background hover:bg-accent")
                        : (selectedOption === option.value
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-input bg-background hover:bg-accent")
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{option.label}</span>
                      {(multiSelect ? selectedOptions.includes(option.value) : selectedOption === option.value) && (
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

            <div className="space-y-4">
              <Button 
                onClick={onContinue}
                disabled={multiSelect ? selectedOptions.length === 0 : selectedOption === ''}
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