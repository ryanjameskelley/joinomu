"use client"

import * as React from "react"
import { CalendarIcon, Plus, Check, ChevronDown, BadgeCheck, AreaChart as AreaChartIcon, BarChart4 } from "lucide-react"
import { DateRange } from "react-day-picker"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { Button } from "./button"
import { Calendar } from "./calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"
import { Checkbox } from "./checkbox"
import { Badge } from "./badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "./chart"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover"

const chartData = [
  { date: "2025-06-01", visitors: 178 },
  { date: "2025-06-02", visitors: 470 },
  { date: "2025-06-03", visitors: 103 },
  { date: "2025-06-04", visitors: 439 },
  { date: "2025-06-05", visitors: 88 },
  { date: "2025-06-06", visitors: 294 },
  { date: "2025-06-07", visitors: 323 },
  { date: "2025-06-08", visitors: 385 },
  { date: "2025-06-09", visitors: 438 },
  { date: "2025-06-10", visitors: 155 },
  { date: "2025-06-11", visitors: 92 },
  { date: "2025-06-12", visitors: 492 },
  { date: "2025-06-13", visitors: 81 },
  { date: "2025-06-14", visitors: 426 },
  { date: "2025-06-15", visitors: 307 },
  { date: "2025-06-16", visitors: 371 },
  { date: "2025-06-17", visitors: 475 },
  { date: "2025-06-18", visitors: 107 },
  { date: "2025-06-19", visitors: 341 },
  { date: "2025-06-20", visitors: 408 },
  { date: "2025-06-21", visitors: 169 },
  { date: "2025-06-22", visitors: 317 },
  { date: "2025-06-23", visitors: 480 },
  { date: "2025-06-24", visitors: 132 },
  { date: "2025-06-25", visitors: 141 },
  { date: "2025-06-26", visitors: 434 },
  { date: "2025-06-27", visitors: 448 },
  { date: "2025-06-28", visitors: 149 },
  { date: "2025-06-29", visitors: 103 },
  { date: "2025-06-30", visitors: 446 },
]

const total = chartData.reduce((acc, curr) => acc + curr.visitors, 0)

const chartConfig = {
  visitors: {
    label: "Value",
    color: "var(--color-primary)",
  },
} satisfies ChartConfig

export interface MedicationOption {
  id: string
  name: string
  dosage: string
}

export interface HealthMetricsData {
  date: string
  value: number
  unit: string
}

export interface MedicationTrackingEntry {
  id: string
  medication_preference_id: string
  taken_date: string
  taken_time: string
  notes?: string
  medication_preference?: {
    medications?: {
      name: string
    }
  }
}

export interface TrackingChartProps {
  title?: string
  description?: string
  className?: string
  selectedMetric?: string
  affirmation?: string
  subtext?: string
  medications?: MedicationOption[]
  selectedMedications?: string[]
  onMedicationSelectionChange?: (selected: string[]) => void
  onAddMetrics?: () => void
  hasMetrics?: boolean
  metricsData?: HealthMetricsData[]
  patientId?: string
  onRefresh?: () => void
  onMetricChange?: (metric: string) => void
  medicationTrackingEntries?: MedicationTrackingEntry[]
}

export function TrackingChart({
  title = "Tracking",
  description = "Your health journey",
  className,
  selectedMetric: initialSelectedMetric = "weight",
  affirmation = "Every small step you take is building a stronger, healthier you - consistency is your superpower.",
  subtext,
  medications = [],
  selectedMedications = [],
  onMedicationSelectionChange = () => {},
  onAddMetrics,
  hasMetrics = false,
  metricsData = [],
  patientId,
  onRefresh,
  onMetricChange,
  medicationTrackingEntries = []
}: TrackingChartProps) {
  const [range, setRange] = React.useState<DateRange | undefined>(() => {
    const today = new Date()
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(today.getDate() - 29) // 29 days ago + today = 30 days total
    return {
      from: thirtyDaysAgo,
      to: today,
    }
  })
  const [selectedMetric, setSelectedMetric] = React.useState<string>(initialSelectedMetric)
  const [isOpen, setIsOpen] = React.useState(false)
  const [hoveredMedication, setHoveredMedication] = React.useState<{med: any, position: {x: number, y: number}} | null>(null)
  const [chartType, setChartType] = React.useState<'area' | 'bar'>('area')

  // Handle metric change and trigger data reload
  const handleMetricChange = (newMetric: string) => {
    setSelectedMetric(newMetric)
    if (onMetricChange) {
      onMetricChange(newMetric)
    }
  }
  
  // Helper function to get metric display information
  const getMetricInfo = (metric: string) => {
    const metricMap: Record<string, { label: string; unit: string }> = {
      weight: { label: "Weight", unit: "lbs" },
      steps: { label: "Steps", unit: "steps" },
      sleep: { label: "Sleep", unit: "hours" },
      calories: { label: "Calories", unit: "kcal" },
      protein: { label: "Protein", unit: "grams" },
      sugar: { label: "Sugar", unit: "grams" },
      water: { label: "Water", unit: "fl oz" },
      "heart-rate": { label: "Heart Rate", unit: "bpm" }
    }
    return metricMap[metric] || { label: "Value", unit: "" }
  }

  // Helper function to create medication abbreviation
  const getMedicationAbbreviation = (medicationName: string): string => {
    // Common medication abbreviations
    const abbreviations: Record<string, string> = {
      "semaglutide": "SEM",
      "ozempic": "OZE", 
      "wegovy": "WEG",
      "tirzepatide": "TIR",
      "mounjaro": "MOU",
      "testosterone cypionate": "TC",
      "testosterone": "TEST"
    }
    
    const lowerName = medicationName.toLowerCase()
    
    // Check for exact matches first
    for (const [key, abbrev] of Object.entries(abbreviations)) {
      if (lowerName.includes(key)) {
        return abbrev
      }
    }
    
    // Fallback: create abbreviation from first letters of words
    const words = medicationName.split(/\s+/).filter(word => word.length > 0)
    if (words.length >= 2) {
      return words.slice(0, 3).map(word => word[0].toUpperCase()).join('')
    } else if (words.length === 1) {
      return words[0].substring(0, 3).toUpperCase()
    }
    
    return "MED"
  }

  // Helper function to get medications taken on a specific date
  const getMedicationsForDate = (date: string): Array<{id: string, name: string, abbreviation: string, dosage: string, dateTaken: string, timeTaken: string}> => {
    if (!medicationTrackingEntries) {
      console.log(`🔍 No medicationTrackingEntries for date ${date}`)
      return []
    }

    console.log(`🔍 Searching for medications on ${date}. Available entries:`, medicationTrackingEntries.map(e => `${e.taken_date} (${e.medication_preference_id})`))
    console.log(`🔍 Selected medications:`, selectedMedications)

    // For each medication entry, find the closest chart date and only show it there
    const medicationsForThisDate: Array<{id: string, name: string, abbreviation: string}> = []
    
    medicationTrackingEntries.forEach(entry => {
      if (!selectedMedications.includes(entry.medication_preference_id)) {
        return // Skip unselected medications
      }
      
      const entryDate = entry.taken_date
      const medicationDate = new Date(entryDate)
      const chartDate = new Date(date)
      
      // Find the closest chart date to this medication
      const allChartDates = filteredData.map(d => new Date(d.date))
      const closestChartDate = allChartDates.reduce((closest, current) => {
        const currentDiff = Math.abs(current.getTime() - medicationDate.getTime())
        const closestDiff = Math.abs(closest.getTime() - medicationDate.getTime())
        return currentDiff < closestDiff ? current : closest
      })
      
      // Only show this medication if the current chart date is the closest one
      if (closestChartDate.toISOString().split('T')[0] === date) {
        const medicationName = entry.medication_preference?.medications?.name || 'Unknown'
        const dosage = entry.medication_preference?.preferred_dosage || 'Unknown dosage'
        medicationsForThisDate.push({
          id: entry.medication_preference_id,
          name: medicationName,
          abbreviation: getMedicationAbbreviation(medicationName),
          dosage: dosage,
          dateTaken: entry.taken_date,
          timeTaken: entry.taken_time || 'Unknown time'
        })
      }
    })

    // Remove duplicates by medication ID for this specific date
    const uniqueMedications = medicationsForThisDate.filter((med, index, self) => 
      index === self.findIndex(m => m.id === med.id)
    )
    
    console.log(`🔍 Final medications for ${date}:`, uniqueMedications.map(m => m.abbreviation))
    return uniqueMedications
  }
  
  const handleMedicationToggle = (medicationId: string) => {
    const newSelection = selectedMedications.includes(medicationId)
      ? selectedMedications.filter(id => id !== medicationId)
      : [...selectedMedications, medicationId]
    onMedicationSelectionChange(newSelection)
  }
  
  const getSelectedMedicationsText = () => {
    if (selectedMedications.length === 0) return "Select medications"
    if (selectedMedications.length === 1) {
      const med = medications.find(m => m.id === selectedMedications[0])
      return med ? med.name : "1 medication"
    }
    return `${selectedMedications.length} medications`
  }

  const filteredData = React.useMemo(() => {
    // Use real metrics data if available, otherwise fallback to sample data
    const dataToUse = metricsData.length > 0 ? metricsData : chartData
    
    // Filter data by selected metric type (for real data)
    const filteredByMetric = dataToUse.filter((item) => {
      if (metricsData.length > 0) {
        // For real data, filter by the selected metric type
        // This assumes the parent component provides filtered data for the specific metric
        return true
      }
      // For sample data, show all items as "visitors"
      return true
    })
    
    // Filter by date range
    let dateFilteredData
    if (!range?.from && !range?.to) {
      dateFilteredData = filteredByMetric.map(item => ({
        date: item.date,
        visitors: metricsData.length > 0 ? item.value : (item as any).visitors
      }))
    } else {
      dateFilteredData = filteredByMetric.filter((item) => {
        const date = new Date(item.date)
        return date >= range.from! && date <= range.to!
      }).map(item => ({
        date: item.date,
        visitors: metricsData.length > 0 ? item.value : (item as any).visitors
      }))
    }

    // Create a comprehensive dataset by combining health metrics and medication tracking dates
    console.log('🔍 Creating comprehensive dataset - selectedMeds:', selectedMedications.length, 'trackingEntries:', medicationTrackingEntries?.length || 0)
    
    // Start with health metrics data
    const allDates = new Map<string, { date: string; visitors: number }>()
    
    // Add all health metrics data first
    dateFilteredData.forEach(item => {
      allDates.set(item.date, { date: item.date, visitors: item.visitors })
    })
    
    // Note: We don't add medication-only dates to avoid creating 0-value entries
    // Medications will be displayed as overlays on existing health data dates only
    
    // Convert back to array format
    const combinedData = Array.from(allDates.values())
    console.log('🔍 Combined data before aggregation:', combinedData.map(d => `${d.date}(${d.visitors})`))
    console.log(`🔍 Total combined data points: ${combinedData.length}`)
    
    // Aggregate multiple entries per day by taking the average value
    const aggregatedData = combinedData.reduce((acc, current) => {
      const existingIndex = acc.findIndex(item => item.date === current.date)
      if (existingIndex === -1) {
        // Date doesn't exist, add it with a count for averaging
        acc.push({ ...current, count: 1 })
      } else {
        // Date exists, aggregate the values
        const existing = acc[existingIndex]
        if (current.visitors > 0 && existing.visitors > 0) {
          // Both have values, calculate average
          const totalValue = (existing.visitors * existing.count) + current.visitors
          existing.count += 1
          existing.visitors = totalValue / existing.count
        } else if (current.visitors > 0 && existing.visitors === 0) {
          // Current has value, existing doesn't - use current value
          existing.visitors = current.visitors
          existing.count = 1
        }
        // If current.visitors is 0 (medication-only), keep existing value
        // If existing.visitors > 0 and current.visitors is 0, keep existing
      }
      return acc
    }, [] as (typeof dateFilteredData[0] & { count: number })[])
    
    // Remove the count property and return clean data
    const uniqueDateData = aggregatedData.map(({ count, ...item }) => item)
    
    console.log('🔍 After aggregating duplicates:', uniqueDateData.map(d => `${d.date}(${d.visitors})`))
    console.log(`🔍 Total data points for chart: ${uniqueDateData.length}`)
    
    // Sort data from earliest to latest date
    const sortedData = uniqueDateData.sort((a, b) => {
      const dateA = new Date(a.date)
      const dateB = new Date(b.date)
      return dateA.getTime() - dateB.getTime()
    })
    
    // Final verification - check for duplicates
    const uniqueDates = new Set(sortedData.map(d => d.date))
    if (uniqueDates.size !== sortedData.length) {
      console.error('🚨 DUPLICATE DATES DETECTED IN FINAL DATA!')
      console.error('🚨 Unique dates:', uniqueDates.size, 'Total data points:', sortedData.length)
      console.error('🚨 All dates:', sortedData.map(d => d.date))
    } else {
      console.log('✅ No duplicate dates in final data')
    }
    
    console.log(`🔍 Final sorted data (${sortedData.length} points):`, sortedData.map(d => d.date))
    console.log(`🔍 Date range: ${sortedData[0]?.date} to ${sortedData[sortedData.length - 1]?.date}`)
    
    return sortedData
  }, [range, metricsData, selectedMetric, medicationTrackingEntries, selectedMedications])

  // Dynamic date formatter based on number of data points and date range span
  const formatDate = React.useCallback((value: string) => {
    const date = new Date(value)
    const dataPointCount = filteredData.length
    
    // Calculate the span of the date range
    const sortedDates = filteredData.map(d => new Date(d.date)).sort((a, b) => a.getTime() - b.getTime())
    const spanInDays = sortedDates.length > 1 
      ? Math.ceil((sortedDates[sortedDates.length - 1].getTime() - sortedDates[0].getTime()) / (1000 * 60 * 60 * 24))
      : 1
    
    if (dataPointCount > 30 || spanInDays > 90) {
      // For very large ranges, use M/D format (month/day without year)
      console.log(`🔍 Using M/D date format (${dataPointCount} points, ${spanInDays} days span)`)
      return date.toLocaleDateString("en-US", {
        month: "numeric",
        day: "numeric"
      })
    } else if (dataPointCount > 10 || spanInDays > 30) {
      // For medium ranges, use M/D/YY format
      console.log(`🔍 Using M/D/YY date format (${dataPointCount} points, ${spanInDays} days span)`)
      return date.toLocaleDateString("en-US", {
        month: "numeric",
        day: "numeric",
        year: "2-digit"
      })
    } else {
      // For small ranges, use full MM/DD/YYYY format
      console.log(`🔍 Using MM/DD/YYYY date format (${dataPointCount} points, ${spanInDays} days span)`)
      return date.toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric"
      })
    }
  }, [filteredData])



  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="flex flex-col border-b">
        <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex flex-col space-y-2 md:flex-row md:items-center md:gap-2 md:space-y-0">
            {/* Top row on mobile: medications and metric selector */}
            <div className="flex items-center gap-2">
            {medications.length > 0 && (
              <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="w-[180px] justify-between border border-border hover:bg-muted"
                    onClick={() => setIsOpen(!isOpen)}
                  >
                    <span className="truncate">{getSelectedMedicationsText()}</span>
                    <ChevronDown className="h-4 w-4 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[180px] p-0" align="start">
                  <div className="p-2">
                    <div className="space-y-2">
                      {medications.map((medication) => (
                        <div 
                          key={medication.id} 
                          className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-accent rounded-sm"
                          onClick={() => handleMedicationToggle(medication.id)}
                        >
                          <Checkbox
                            checked={selectedMedications.includes(medication.id)}
                            onChange={() => handleMedicationToggle(medication.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{medication.name}</div>
                            <div className="text-xs text-muted-foreground">{medication.dosage}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}
            <Select value={selectedMetric} onValueChange={handleMetricChange}>
              <SelectTrigger className="w-[140px] bg-transparent hover:bg-muted border-border shadow-none focus:ring-0 focus:ring-offset-0 focus:border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weight">Weight</SelectItem>
                <SelectItem value="steps">Steps</SelectItem>
                <SelectItem value="sleep">Sleep</SelectItem>
                <SelectItem value="calories">Calories</SelectItem>
                <SelectItem value="protein">Protein</SelectItem>
                <SelectItem value="sugar">Sugar</SelectItem>
                <SelectItem value="water">Water</SelectItem>
                <SelectItem value="heart-rate">Average Heart Rate</SelectItem>
              </SelectContent>
            </Select>
            </div>
            {/* Bottom row on mobile: chart toggle and date range */}
            <div className="flex items-center gap-2">
              {/* Chart type toggle */}
              <div className="flex rounded-md border border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 px-2 rounded-r-none border-r border-border ${
                    chartType === 'area' ? 'bg-muted' : ''
                  }`}
                  onClick={() => setChartType('area')}
                >
                  <AreaChartIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 px-2 rounded-l-none ${
                    chartType === 'bar' ? 'bg-muted' : ''
                  }`}
                  onClick={() => setChartType('bar')}
                >
                  <BarChart4 className="h-4 w-4" />
                </Button>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" className="border border-border hover:bg-muted">
                    <CalendarIcon />
                    {range?.from && range?.to
                      ? `${range.from.toLocaleDateString()} - ${range.to.toLocaleDateString()}`
                      : "Last 10 days"}
                  </Button>
                </PopoverTrigger>
              <PopoverContent className="w-auto overflow-hidden p-0" align="end">
                <Calendar
                  className="w-full bg-white dark:bg-black"
                  mode="range"
                  defaultMonth={range?.from}
                  selected={range}
                  onSelect={setRange}
                  captionLayout="dropdown"
                  disabled={{
                    after: new Date(),
                  }}
                />
              </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4">
        {hasMetrics ? (
          <div className="relative">
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-[250px] w-full"
            >
              {chartType === 'area' ? (
                <AreaChart
                  accessibilityLayer
                  data={filteredData}
                  margin={{
                    left: 12,
                    right: 12,
                    top: 20,
                    bottom: 0,
                  }}
                >
                  <defs>
                    <linearGradient id="fillVisitors" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="#BBDDFF"
                        stopOpacity={0.8}
                      />
                      <stop
                        offset="95%"
                        stopColor="#BBDDFF"
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={5}
                    interval="preserveStartEnd"
                    tickFormatter={formatDate}
                  />
                  <ChartTooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const metricInfo = getMetricInfo(selectedMetric)
                        const date = new Date(label)
                        const formattedDate = date.toLocaleDateString("en-US", {
                          month: "2-digit",
                          day: "2-digit", 
                          year: "numeric"
                        })
                        return (
                          <div className="bg-background border border-border rounded-lg shadow-lg p-3 text-sm">
                            <div className="font-medium text-foreground">
                              {payload[0].value} {metricInfo.unit}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {formattedDate}
                            </div>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Area
                    dataKey="visitors"
                    type="monotone"
                    fill="url(#fillVisitors)"
                    stroke="#BBDDFF"
                    strokeWidth={2}
                  />
                </AreaChart>
              ) : (
                <BarChart
                  accessibilityLayer
                  data={filteredData}
                  margin={{
                    left: 12,
                    right: 12,
                    top: 20,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={5}
                    interval="preserveStartEnd"
                    tickFormatter={formatDate}
                  />
                  <ChartTooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const metricInfo = getMetricInfo(selectedMetric)
                        const date = new Date(label)
                        const formattedDate = date.toLocaleDateString("en-US", {
                          month: "2-digit",
                          day: "2-digit", 
                          year: "numeric"
                        })
                        return (
                          <div className="bg-background border border-border rounded-lg shadow-lg p-3 text-sm">
                            <div className="font-medium text-foreground">
                              {payload[0].value} {metricInfo.unit}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {formattedDate}
                            </div>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar 
                    dataKey="visitors" 
                    fill="#BBDDFF"
                    className="dark:fill-[#BBDDFF] fill-[var(--color-visitors)]"
                    radius={4} 
                  />
                </BarChart>
              )}
            </ChartContainer>
            
            {/* Medication abbreviations overlay */}
            {selectedMedications.length > 0 && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="relative h-full">
                  {filteredData.map((dataPoint, index) => {
                    const medications = getMedicationsForDate(dataPoint.date)
                    console.log(`🔍 Checking medications for date ${dataPoint.date}:`, medications)
                    if (medications.length === 0) return null
                    
                    const totalPoints = filteredData.length
                    const leftPosition = ((index + 0.5) / totalPoints) * 100
                    
                    return (
                      <div
                        key={dataPoint.date}
                        className="absolute flex flex-col items-center"
                        style={{
                          left: `${leftPosition}%`,
                          top: '5px',
                          transform: 'translateX(-50%)'
                        }}
                      >
                        {medications.map((med, medIndex) => {
                          const formattedDate = new Date(med.dateTaken).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })
                          const formattedTime = med.timeTaken && med.timeTaken !== 'Unknown time' 
                            ? new Date(`2000-01-01T${med.timeTaken}`).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                              })
                            : 'Time not recorded'
                          
                          return (
                            <div 
                              key={med.id} 
                              className="text-[10px] font-medium text-foreground bg-background/80 rounded px-1 mb-0.5 pointer-events-auto cursor-default select-none"
                              style={{
                                textShadow: '0 0 3px rgba(255,255,255,0.8)'
                              }}
                              onMouseEnter={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect()
                                setHoveredMedication({
                                  med: {
                                    name: med.name || 'Unknown medication',
                                    dosage: med.dosage && med.dosage !== 'Unknown dosage' ? med.dosage : '',
                                    dateTaken: formattedDate,
                                    timeTaken: formattedTime
                                  },
                                  position: { x: rect.left + rect.width / 2, y: rect.top }
                                })
                              }}
                              onMouseLeave={() => setHoveredMedication(null)}
                            >
                              {med.abbreviation}
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Custom medication tooltip */}
            {hoveredMedication && (
              <div
                className="fixed z-50 pointer-events-none"
                style={{
                  left: hoveredMedication.position.x,
                  top: hoveredMedication.position.y - 10,
                  transform: 'translateX(-50%) translateY(-100%)'
                }}
              >
                <div className="bg-background border border-border rounded-lg shadow-lg p-3 text-sm">
                  <div className="font-medium text-foreground">
                    {hoveredMedication.med.name}
                    {hoveredMedication.med.dosage && (
                      <span className="text-muted-foreground ml-1">
                        {hoveredMedication.med.dosage}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {hoveredMedication.med.dateTaken} at {hoveredMedication.med.timeTaken}
                  </div>
                </div>
              </div>
            )}

          </div>
        ) : (
          <div className="flex items-center justify-center h-[250px] text-muted-foreground">
            <div className="text-center">
              <div className="text-lg font-medium mb-2">No metrics logged yet</div>
              <div className="text-sm">Start tracking your health metrics to see your progress</div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t pt-0 md:pt-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full">
          <div className="order-2 md:order-1 text-sm text-left mt-4 md:mt-0">
            <div>{affirmation}</div>
            {subtext && (
              <div className="text-xs text-muted-foreground mt-2">
                {subtext}
              </div>
            )}
          </div>
          <Button 
            variant="default" 
            className="order-1 md:order-2 shrink-0 w-full md:w-auto mt-4 md:mt-0"
            onClick={onAddMetrics}
          >
            Add today's metrics
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}