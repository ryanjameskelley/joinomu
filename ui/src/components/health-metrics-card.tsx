import * as React from "react"
import { TrendingUp, TrendingDown, Minus, Activity, Heart, Footprints, Moon } from 'lucide-react'
import { cn } from "../lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { Badge } from "./badge"
import { Progress } from "./progress"

export interface HealthMetricsCardProps {
  metricType: string
  title: string
  value: number | string
  unit?: string
  previousValue?: number
  trend?: 'up' | 'down' | 'stable'
  changePercent?: number
  lastUpdated?: string
  source?: string
  target?: number
  targetUnit?: string
  className?: string
  showProgress?: boolean
  variant?: 'default' | 'compact' | 'detailed'
  icon?: React.ReactNode
  status?: 'normal' | 'warning' | 'danger' | 'success'
}

const METRIC_ICONS: Record<string, React.ReactNode> = {
  'heart_rate': <Heart className="h-4 w-4" />,
  'steps': <Footprints className="h-4 w-4" />,
  'sleep_duration': <Moon className="h-4 w-4" />,
  'weight': <Activity className="h-4 w-4" />,
  'blood_pressure_systolic': <Activity className="h-4 w-4" />,
  'blood_pressure_diastolic': <Activity className="h-4 w-4" />,
  'blood_glucose': <Activity className="h-4 w-4" />,
  'exercise_time': <Activity className="h-4 w-4" />,
  'water_intake': <Activity className="h-4 w-4" />,
  'body_temperature': <Activity className="h-4 w-4" />
}

const STATUS_COLORS = {
  normal: 'text-foreground',
  success: 'text-green-600',
  warning: 'text-yellow-600',
  danger: 'text-red-600'
}

const STATUS_BACKGROUNDS = {
  normal: 'bg-background',
  success: 'bg-green-50 border-green-200',
  warning: 'bg-yellow-50 border-yellow-200',
  danger: 'bg-red-50 border-red-200'
}

export function HealthMetricsCard({
  metricType,
  title,
  value,
  unit,
  previousValue,
  trend,
  changePercent,
  lastUpdated,
  source,
  target,
  targetUnit,
  className,
  showProgress = false,
  variant = 'default',
  icon,
  status = 'normal'
}: HealthMetricsCardProps) {
  const displayIcon = icon || METRIC_ICONS[metricType] || <Activity className="h-4 w-4" />
  
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-600" />
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-600" />
      case 'stable':
        return <Minus className="h-3 w-3 text-muted-foreground" />
      default:
        return null
    }
  }

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      case 'stable':
        return 'text-muted-foreground'
      default:
        return 'text-muted-foreground'
    }
  }

  const formatValue = (val: number | string) => {
    if (typeof val === 'string') return val
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`
    if (val >= 1000) return `${(val / 1000).toFixed(1)}K`
    return val.toLocaleString()
  }

  const getProgressPercentage = () => {
    if (!target || typeof value !== 'number') return 0
    return Math.min(100, Math.max(0, (value / target) * 100))
  }

  const formatLastUpdated = (dateString?: string) => {
    if (!dateString) return 'Never'
    
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  if (variant === 'compact') {
    return (
      <Card className={cn("p-4", STATUS_BACKGROUNDS[status], className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("text-muted-foreground", STATUS_COLORS[status])}>
              {displayIcon}
            </div>
            <div>
              <div className="text-sm font-medium">{title}</div>
              <div className="text-xs text-muted-foreground">
                {formatLastUpdated(lastUpdated)}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className={cn("text-lg font-bold", STATUS_COLORS[status])}>
              {formatValue(value)}
              {unit && <span className="text-sm font-normal ml-1">{unit}</span>}
            </div>
            {trend && changePercent !== undefined && (
              <div className={cn("flex items-center gap-1 text-xs", getTrendColor())}>
                {getTrendIcon()}
                <span>{Math.abs(changePercent).toFixed(1)}%</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className={cn(STATUS_BACKGROUNDS[status], className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={cn("text-muted-foreground", STATUS_COLORS[status])}>
          {displayIcon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-baseline gap-2">
            <div className={cn("text-2xl font-bold", STATUS_COLORS[status])}>
              {formatValue(value)}
            </div>
            {unit && (
              <div className="text-sm text-muted-foreground">{unit}</div>
            )}
            {trend && changePercent !== undefined && (
              <div className={cn("flex items-center gap-1 text-sm", getTrendColor())}>
                {getTrendIcon()}
                <span>{Math.abs(changePercent).toFixed(1)}%</span>
              </div>
            )}
          </div>

          {showProgress && target && typeof value === 'number' && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progress to goal</span>
                <span>{target} {targetUnit || unit}</span>
              </div>
              <Progress 
                value={getProgressPercentage()} 
                className="h-2"
              />
            </div>
          )}

          {variant === 'detailed' && (
            <div className="space-y-2">
              {previousValue !== undefined && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Previous:</span>
                  <span>{formatValue(previousValue)} {unit}</span>
                </div>
              )}
              
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Last updated:</span>
                <span>{formatLastUpdated(lastUpdated)}</span>
              </div>
              
              {source && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Source:</span>
                  <Badge variant="secondary" className="text-xs">
                    {source}
                  </Badge>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}