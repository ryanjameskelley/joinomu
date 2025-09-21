import * as React from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { format } from 'date-fns'
import { cn } from "../lib/utils"

export interface ChartDataPoint {
  date: string
  value: number
  unit?: string
  source?: string
  label?: string
}

export interface HealthChartProps {
  data: ChartDataPoint[]
  title?: string
  description?: string
  type?: 'line' | 'area' | 'bar' | 'pie'
  height?: number
  color?: string
  showGrid?: boolean
  showTooltip?: boolean
  dateFormat?: string
  valueFormatter?: (value: number) => string
  className?: string
  loading?: boolean
  error?: string
  targetValue?: number
  targetLabel?: string
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--accent))',
  'hsl(var(--muted))',
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff7300',
  '#00c49f',
  '#ffbb28'
]

export function HealthChart({
  data,
  title,
  description,
  type = 'line',
  height = 300,
  color = 'hsl(var(--primary))',
  showGrid = true,
  showTooltip = true,
  dateFormat = 'MMM dd',
  valueFormatter,
  className,
  loading = false,
  error,
  targetValue,
  targetLabel = 'Target'
}: HealthChartProps) {
  // Format data for charts
  const chartData = React.useMemo(() => {
    return data.map(point => ({
      ...point,
      formattedDate: format(new Date(point.date), dateFormat),
      displayValue: valueFormatter ? valueFormatter(point.value) : point.value
    }))
  }, [data, dateFormat, valueFormatter])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <div className="grid gap-2">
            <div className="font-medium">{label}</div>
            <div className="grid gap-1">
              {payload.map((entry: any, index: number) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <div 
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-muted-foreground">{entry.name}:</span>
                  <span className="font-medium">
                    {data.displayValue} {data.unit}
                  </span>
                </div>
              ))}
              {data.source && (
                <div className="text-xs text-muted-foreground">
                  Source: {data.source}
                </div>
              )}
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        {title && (
          <div>
            <h3 className="text-lg font-medium">{title}</h3>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        )}
        <div 
          className="flex items-center justify-center rounded-lg border bg-muted/50"
          style={{ height }}
        >
          <div className="text-sm text-muted-foreground">Loading chart...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn("space-y-4", className)}>
        {title && (
          <div>
            <h3 className="text-lg font-medium">{title}</h3>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        )}
        <div 
          className="flex items-center justify-center rounded-lg border border-destructive/50 bg-destructive/10"
          style={{ height }}
        >
          <div className="text-sm text-destructive">{error}</div>
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className={cn("space-y-4", className)}>
        {title && (
          <div>
            <h3 className="text-lg font-medium">{title}</h3>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        )}
        <div 
          className="flex items-center justify-center rounded-lg border bg-muted/50"
          style={{ height }}
        >
          <div className="text-sm text-muted-foreground">No data available</div>
        </div>
      </div>
    )
  }

  const renderChart = () => {
    switch (type) {
      case 'area':
        return (
          <AreaChart data={chartData}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.3} />}
            <XAxis 
              dataKey="formattedDate"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={valueFormatter}
            />
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              fill={color}
              fillOpacity={0.2}
              strokeWidth={2}
              name="Value"
            />
            {targetValue && (
              <Line
                type="monotone"
                dataKey={() => targetValue}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="5 5"
                strokeWidth={1}
                dot={false}
                name={targetLabel}
              />
            )}
          </AreaChart>
        )

      case 'bar':
        return (
          <BarChart data={chartData}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.3} />}
            <XAxis 
              dataKey="formattedDate"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={valueFormatter}
            />
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            <Bar
              dataKey="value"
              fill={color}
              radius={[4, 4, 0, 0]}
              name="Value"
            />
          </BarChart>
        )

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill={color}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
          </PieChart>
        )

      default: // line
        return (
          <LineChart data={chartData}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.3} />}
            <XAxis 
              dataKey="formattedDate"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={valueFormatter}
            />
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={{ fill: color, strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, stroke: color, strokeWidth: 2, fill: "hsl(var(--background))" }}
              name="Value"
            />
            {targetValue && (
              <Line
                type="monotone"
                dataKey={() => targetValue}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="5 5"
                strokeWidth={1}
                dot={false}
                name={targetLabel}
              />
            )}
          </LineChart>
        )
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {title && (
        <div>
          <h3 className="text-lg font-medium">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      <div className="rounded-lg border p-4">
        <ResponsiveContainer width="100%" height={height}>
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  )
}