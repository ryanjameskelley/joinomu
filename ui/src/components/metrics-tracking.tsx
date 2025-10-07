"use client"

import * as React from "react"
import {
  CircleDashed,
  CalendarIcon,
  ChevronDown,
  Check,
} from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./breadcrumb"
import { Button } from "./button"
import { Input } from "./input"
import { Calendar } from "./calendar"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "./dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "./sidebar"

const metricsData = {
  nav: [
    { name: "Weight", unit: "lbs", key: "weight" },
    { name: "Steps", unit: "steps", key: "steps" },
    { name: "Sleep", unit: "hours", key: "sleep" },
    { name: "Calories", unit: "kcal", key: "calories" },
    { name: "Protein", unit: "grams", key: "protein" },
    { name: "Sugar", unit: "grams", key: "sugar" },
    { name: "Water", unit: "fl oz", key: "water" },
    { name: "Average Heart Rate", unit: "bpm", key: "averageHeartRate" },
  ],
}

interface MetricsTrackingProps {
  defaultOpen?: boolean
  selectedMetric?: string
  patientId?: string
  onSave?: (metrics: Record<string, number>, date: string) => Promise<void>
}

interface MetricValues {
  weight: number
  weightUnit: 'lbs' | 'kg'
  steps: number
  sleep: number
  calories: number
  protein: number
  sugar: number
  water: number
  averageHeartRate: number
}

export function MetricsTracking({ 
  defaultOpen = true, 
  selectedMetric = "Weight",
  patientId,
  onSave
}: MetricsTrackingProps) {
  const [open, setOpen] = React.useState(defaultOpen)
  const [activeMetric, setActiveMetric] = React.useState(selectedMetric)
  const [saving, setSaving] = React.useState(false)

  // Mobile dropdown for metric selection
  const [mobileMetric, setMobileMetric] = React.useState(selectedMetric)

  // Date selector state
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date())

  // Form values for each metric
  const [values, setValues] = React.useState<MetricValues>({
    weight: 0,
    weightUnit: 'lbs',
    steps: 0,
    sleep: 0,
    calories: 0,
    protein: 0,
    sugar: 0,
    water: 0,
    averageHeartRate: 0,
  })

  // Helper function to check if a metric has a valid value entered
  const hasValue = (key: string): boolean => {
    if (key === 'weight') return values.weight > 0
    if (key === 'steps') return values.steps > 0
    if (key === 'sleep') return values.sleep > 0
    if (key === 'calories') return values.calories > 0
    if (key === 'protein') return values.protein > 0
    if (key === 'sugar') return values.sugar > 0
    if (key === 'water') return values.water > 0
    if (key === 'averageHeartRate') return values.averageHeartRate > 0
    return false
  }

  // Get the appropriate icon for each metric - matching onboarding style
  const getMetricIcon = (key: string) => {
    if (hasValue(key)) {
      // Create a custom component that matches the onboarding completion style
      return ({ className }: { className?: string }) => (
        <div className={`relative ${className}`}>
          <div className="h-4 w-4 rounded-full bg-primary border-2 border-primary flex items-center justify-center">
            <Check className="h-2.5 w-2.5 text-primary-foreground" />
          </div>
        </div>
      )
    }
    return CircleDashed
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, currentMetric: string) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const currentIndex = metricsData.nav.findIndex(item => item.name === currentMetric)
      const nextIndex = (currentIndex + 1) % metricsData.nav.length
      const nextMetric = metricsData.nav[nextIndex]
      setActiveMetric(nextMetric.name)
      setMobileMetric(nextMetric.name)
      
      // Focus the next input after a short delay
      setTimeout(() => {
        const nextInput = document.querySelector(`input[data-metric="${nextMetric.key}"]`) as HTMLInputElement
        nextInput?.focus()
      }, 100)
    }
  }

  const handleSaveMetrics = async () => {
    if (!onSave || !selectedDate) return
    
    setSaving(true)
    try {
      // Prepare metrics data - only include metrics with values > 0
      const metricsToSave: Record<string, number> = {}
      
      if (values.weight > 0) metricsToSave.weight = values.weight
      if (values.steps > 0) metricsToSave.steps = values.steps
      if (values.sleep > 0) metricsToSave.sleep = values.sleep
      if (values.calories > 0) metricsToSave.calories = values.calories
      if (values.protein > 0) metricsToSave.protein = values.protein
      if (values.sugar > 0) metricsToSave.sugar = values.sugar
      if (values.water > 0) metricsToSave.water = values.water
      if (values.averageHeartRate > 0) metricsToSave.averageHeartRate = values.averageHeartRate

      await onSave(metricsToSave, selectedDate.toISOString().split('T')[0])
    } catch (error) {
      console.error('Error saving metrics:', error)
    } finally {
      setSaving(false)
    }
  }

  // Format date for display
  const formatDateDisplay = () => {
    if (!selectedDate) return "Select date"
    
    return selectedDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const currentMetric = metricsData.nav.find(item => item.name === activeMetric) || metricsData.nav[0]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Open Metrics Tracking</Button>
      </DialogTrigger>
      <DialogContent className="overflow-hidden p-0 md:max-h-[500px] md:max-w-[700px] lg:max-w-[800px]">
        <DialogTitle className="sr-only">Metrics Tracking</DialogTitle>
        <DialogDescription className="sr-only">
          Track and monitor your health metrics here.
        </DialogDescription>
        <SidebarProvider className="items-start">
          <Sidebar collapsible="none" className="hidden md:flex border-r border-sidebar-border dark:border-transparent">
            <SidebarHeader>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formatDateDisplay()}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="bg-transparent p-4"
                  />
                </PopoverContent>
              </Popover>
              <Button onClick={handleSaveMetrics} className="w-full" disabled={saving}>
                {saving ? 'Saving...' : 'Save Metrics'}
              </Button>
            </SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {metricsData.nav.map((item) => {
                      const IconComponent = getMetricIcon(item.key)
                      return (
                        <SidebarMenuItem key={item.name}>
                          <SidebarMenuButton
                            asChild
                            isActive={item.name === activeMetric}
                            onClick={() => setActiveMetric(item.name)}
                          >
                            <button className="w-full">
                              <IconComponent className="w-4 h-4" />
                              <span>{item.name}</span>
                            </button>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
          <main className="flex h-[480px] flex-1 flex-col overflow-hidden">
            <header className="flex h-12 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
              <div className="flex items-center gap-2 px-4 w-full">
                <Breadcrumb className="hidden md:flex">
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink href="#">Metrics</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{currentMetric.name}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
                
                {/* Mobile dropdown */}
                <div className="md:hidden flex-1">
                  <Select value={mobileMetric} onValueChange={(value) => {
                    setMobileMetric(value)
                    setActiveMetric(value)
                  }}>
                    <SelectTrigger className="w-full border-0 shadow-none [&>svg]:hidden pl-0 focus:ring-0 focus:border-0 focus-visible:ring-0 focus-visible:ring-offset-0">
                      <div className="flex items-center gap-2">
                        {React.createElement(getMetricIcon(currentMetric.key || 'weight'), { 
                          className: "w-4 h-4"
                        })}
                        <SelectValue placeholder="Select metric" />
                        <ChevronDown className="h-4 w-4 shrink-0" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {metricsData.nav.map((item) => (
                        <SelectItem key={item.name} value={item.name}>
                          <span>{item.name}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 pt-0 relative">
              {/* Input Form for Current Metric */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="font-semibold">{currentMetric.name} Entry</h3>
                </div>
                
                {activeMetric === 'Weight' && (
                  <div>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Enter weight"
                        value={values.weight || ''}
                        onChange={(e) => setValues(prev => ({ ...prev, weight: Number(e.target.value) }))}
                        onKeyDown={(e) => handleKeyDown(e, 'Weight')}
                        data-metric="weight"
                        className="flex-1 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                        min="1"
                        max="1000"
                      />
                      <Select value={values.weightUnit} onValueChange={(value: 'lbs' | 'kg') => setValues(prev => ({ ...prev, weightUnit: value }))}>
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lbs">lbs</SelectItem>
                          <SelectItem value="kg">kg</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">⏎ Next</p>
                  </div>
                )}
                
                {activeMetric === 'Steps' && (
                  <div>
                    <Input
                      type="number"
                      placeholder="Enter step count"
                      value={values.steps || ''}
                      onChange={(e) => setValues(prev => ({ ...prev, steps: Number(e.target.value) }))}
                      onKeyDown={(e) => handleKeyDown(e, 'Steps')}
                      data-metric="steps"
                      className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                      min="0"
                      max="100000"
                    />
                    <p className="text-xs text-muted-foreground mt-1">⏎ Next</p>
                  </div>
                )}
                
                {activeMetric === 'Sleep' && (
                  <div>
                    <Input
                      type="number"
                      placeholder="Enter hours of sleep"
                      value={values.sleep || ''}
                      onChange={(e) => setValues(prev => ({ ...prev, sleep: Number(e.target.value) }))}
                      onKeyDown={(e) => handleKeyDown(e, 'Sleep')}
                      data-metric="sleep"
                      className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                      min="0"
                      max="24"
                      step="0.5"
                    />
                    <p className="text-xs text-muted-foreground mt-1">⏎ Next</p>
                  </div>
                )}
                
                {activeMetric === 'Calories' && (
                  <div>
                    <Input
                      type="number"
                      placeholder="Enter calories"
                      value={values.calories || ''}
                      onChange={(e) => setValues(prev => ({ ...prev, calories: Number(e.target.value) }))}
                      onKeyDown={(e) => handleKeyDown(e, 'Calories')}
                      data-metric="calories"
                      className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                      min="0"
                      max="10000"
                    />
                    <p className="text-xs text-muted-foreground mt-1">⏎ Next</p>
                  </div>
                )}
                
                {activeMetric === 'Protein' && (
                  <div>
                    <Input
                      type="number"
                      placeholder="Enter protein in grams"
                      value={values.protein || ''}
                      onChange={(e) => setValues(prev => ({ ...prev, protein: Number(e.target.value) }))}
                      onKeyDown={(e) => handleKeyDown(e, 'Protein')}
                      data-metric="protein"
                      className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                      min="0"
                      max="1000"
                    />
                    <p className="text-xs text-muted-foreground mt-1">⏎ Next</p>
                  </div>
                )}
                
                {activeMetric === 'Sugar' && (
                  <div>
                    <Input
                      type="number"
                      placeholder="Enter sugar in grams"
                      value={values.sugar || ''}
                      onChange={(e) => setValues(prev => ({ ...prev, sugar: Number(e.target.value) }))}
                      onKeyDown={(e) => handleKeyDown(e, 'Sugar')}
                      data-metric="sugar"
                      className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                      min="0"
                      max="1000"
                    />
                    <p className="text-xs text-muted-foreground mt-1">⏎ Next</p>
                  </div>
                )}
                
                {activeMetric === 'Water' && (
                  <div>
                    <Input
                      type="number"
                      placeholder="Enter fluid ounces"
                      value={values.water || ''}
                      onChange={(e) => setValues(prev => ({ ...prev, water: Number(e.target.value) }))}
                      onKeyDown={(e) => handleKeyDown(e, 'Water')}
                      data-metric="water"
                      className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                      min="0"
                      max="500"
                    />
                    <p className="text-xs text-muted-foreground mt-1">⏎ Next</p>
                  </div>
                )}
                
                {activeMetric === 'Average Heart Rate' && (
                  <div>
                    <Input
                      type="number"
                      placeholder="Enter BPM"
                      value={values.averageHeartRate || ''}
                      onChange={(e) => setValues(prev => ({ ...prev, averageHeartRate: Number(e.target.value) }))}
                      onKeyDown={(e) => handleKeyDown(e, 'Average Heart Rate')}
                      data-metric="averageHeartRate"
                      className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                      min="30"
                      max="220"
                    />
                    <p className="text-xs text-muted-foreground mt-1">⏎ Next</p>
                  </div>
                )}
              </div>

              {/* Mobile Date Selector and Save Button */}
              <div className="md:hidden fixed bottom-4 left-4 right-4 z-10 flex flex-col gap-2">
                <p className="text-[10px] text-muted-foreground text-center mb-1">
                  Make sure to fill out all the categories you're tracking before saving!
                </p>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formatDateDisplay()}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      className="bg-transparent p-4"
                    />
                  </PopoverContent>
                </Popover>
                <Button onClick={handleSaveMetrics} className="w-full" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Metrics'}
                </Button>
              </div>
            </div>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  )
}