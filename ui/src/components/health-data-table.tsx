import * as React from "react"
import { format } from 'date-fns'
import { ChevronDown, ChevronUp, Filter, Download, Search } from 'lucide-react'
import { cn } from "../lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { Button } from "./button"
import { Input } from "./input"
import { Badge } from "./badge"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "./dropdown-menu"

export interface HealthDataRow {
  id: string
  metricType: string
  value: number
  unit: string
  recordedAt: string
  source: string
  metadata?: Record<string, any>
}

export interface HealthDataTableProps {
  data: HealthDataRow[]
  title?: string
  className?: string
  loading?: boolean
  error?: string
  searchable?: boolean
  filterable?: boolean
  exportable?: boolean
  pageSize?: number
  sortable?: boolean
  onRowClick?: (row: HealthDataRow) => void
  onExport?: (data: HealthDataRow[]) => void
}

type SortField = 'recordedAt' | 'metricType' | 'value' | 'source'
type SortDirection = 'asc' | 'desc'

const METRIC_TYPE_LABELS: Record<string, string> = {
  'heart_rate': 'Heart Rate',
  'steps': 'Steps',
  'sleep_duration': 'Sleep Duration',
  'weight': 'Weight',
  'blood_pressure_systolic': 'Blood Pressure (Systolic)',
  'blood_pressure_diastolic': 'Blood Pressure (Diastolic)',
  'blood_glucose': 'Blood Glucose',
  'exercise_time': 'Exercise Time',
  'water_intake': 'Water Intake',
  'body_temperature': 'Body Temperature'
}

const SOURCE_COLORS: Record<string, string> = {
  'healthkit': 'bg-blue-100 text-blue-800',
  'apple_watch': 'bg-gray-100 text-gray-800',
  'fitbit': 'bg-green-100 text-green-800',
  'garmin': 'bg-red-100 text-red-800',
  'manual': 'bg-yellow-100 text-yellow-800',
  'provider': 'bg-purple-100 text-purple-800'
}

export function HealthDataTable({
  data,
  title,
  className,
  loading = false,
  error,
  searchable = true,
  filterable = true,
  exportable = true,
  pageSize = 20,
  sortable = true,
  onRowClick,
  onExport
}: HealthDataTableProps) {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [sortField, setSortField] = React.useState<SortField>('recordedAt')
  const [sortDirection, setSortDirection] = React.useState<SortDirection>('desc')
  const [currentPage, setCurrentPage] = React.useState(1)
  const [selectedMetricTypes, setSelectedMetricTypes] = React.useState<string[]>([])
  const [selectedSources, setSelectedSources] = React.useState<string[]>([])

  // Get unique metric types and sources for filters
  const metricTypes = React.useMemo(() => {
    return Array.from(new Set(data.map(row => row.metricType)))
  }, [data])

  const sources = React.useMemo(() => {
    return Array.from(new Set(data.map(row => row.source)))
  }, [data])

  // Filter and sort data
  const filteredData = React.useMemo(() => {
    let filtered = data

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(row => 
        METRIC_TYPE_LABELS[row.metricType]?.toLowerCase().includes(query) ||
        row.metricType.toLowerCase().includes(query) ||
        row.value.toString().includes(query) ||
        row.unit.toLowerCase().includes(query) ||
        row.source.toLowerCase().includes(query)
      )
    }

    // Apply metric type filter
    if (selectedMetricTypes.length > 0) {
      filtered = filtered.filter(row => selectedMetricTypes.includes(row.metricType))
    }

    // Apply source filter
    if (selectedSources.length > 0) {
      filtered = filtered.filter(row => selectedSources.includes(row.source))
    }

    // Apply sorting
    if (sortable) {
      filtered.sort((a, b) => {
        let aValue: any = a[sortField]
        let bValue: any = b[sortField]

        if (sortField === 'recordedAt') {
          aValue = new Date(aValue).getTime()
          bValue = new Date(bValue).getTime()
        } else if (sortField === 'value') {
          aValue = Number(aValue)
          bValue = Number(bValue)
        } else {
          aValue = String(aValue).toLowerCase()
          bValue = String(bValue).toLowerCase()
        }

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
        return 0
      })
    }

    return filtered
  }, [data, searchQuery, selectedMetricTypes, selectedSources, sortField, sortDirection, sortable])

  // Paginate data
  const paginatedData = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredData.slice(startIndex, startIndex + pageSize)
  }, [filteredData, currentPage, pageSize])

  const totalPages = Math.ceil(filteredData.length / pageSize)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const handleExport = () => {
    if (onExport) {
      onExport(filteredData)
    } else {
      // Default CSV export
      const headers = ['Date', 'Metric', 'Value', 'Unit', 'Source']
      const csvContent = [
        headers.join(','),
        ...filteredData.map(row => [
          format(new Date(row.recordedAt), 'yyyy-MM-dd HH:mm:ss'),
          METRIC_TYPE_LABELS[row.metricType] || row.metricType,
          row.value,
          row.unit,
          row.source
        ].join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `health-data-${format(new Date(), 'yyyy-MM-dd')}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-4 w-4" /> : 
      <ChevronDown className="h-4 w-4" />
  }

  if (loading) {
    return (
      <Card className={className}>
        {title && (
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-sm text-muted-foreground">Loading health data...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        {title && (
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-sm text-destructive">{error}</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="space-y-4">
          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              {searchable && (
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search health data..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 w-64"
                  />
                </div>
              )}

              {filterable && (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Filter className="mr-2 h-4 w-4" />
                        Metrics
                        {selectedMetricTypes.length > 0 && (
                          <Badge variant="secondary" className="ml-2">
                            {selectedMetricTypes.length}
                          </Badge>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                      <DropdownMenuLabel>Filter by Metric Type</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {metricTypes.map(type => (
                        <DropdownMenuCheckboxItem
                          key={type}
                          checked={selectedMetricTypes.includes(type)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedMetricTypes([...selectedMetricTypes, type])
                            } else {
                              setSelectedMetricTypes(selectedMetricTypes.filter(t => t !== type))
                            }
                          }}
                        >
                          {METRIC_TYPE_LABELS[type] || type}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Filter className="mr-2 h-4 w-4" />
                        Sources
                        {selectedSources.length > 0 && (
                          <Badge variant="secondary" className="ml-2">
                            {selectedSources.length}
                          </Badge>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48">
                      <DropdownMenuLabel>Filter by Source</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {sources.map(source => (
                        <DropdownMenuCheckboxItem
                          key={source}
                          checked={selectedSources.includes(source)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedSources([...selectedSources, source])
                            } else {
                              setSelectedSources(selectedSources.filter(s => s !== source))
                            }
                          }}
                        >
                          {source}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>

            {exportable && (
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            )}
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleSort('recordedAt')}
                        className="p-0 h-auto font-medium"
                      >
                        Date & Time
                        <SortIcon field="recordedAt" />
                      </Button>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleSort('metricType')}
                        className="p-0 h-auto font-medium"
                      >
                        Metric
                        <SortIcon field="metricType" />
                      </Button>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleSort('value')}
                        className="p-0 h-auto font-medium"
                      >
                        Value
                        <SortIcon field="value" />
                      </Button>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleSort('source')}
                        className="p-0 h-auto font-medium"
                      >
                        Source
                        <SortIcon field="source" />
                      </Button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                        No health data found
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((row) => (
                      <tr 
                        key={row.id}
                        className={cn(
                          "border-b transition-colors hover:bg-muted/50",
                          onRowClick && "cursor-pointer"
                        )}
                        onClick={() => onRowClick?.(row)}
                      >
                        <td className="px-4 py-3">
                          <div className="text-sm">
                            {format(new Date(row.recordedAt), 'MMM dd, yyyy')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(row.recordedAt), 'HH:mm:ss')}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium">
                            {METRIC_TYPE_LABELS[row.metricType] || row.metricType}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium">
                            {row.value.toLocaleString()} {row.unit}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge 
                            variant="secondary"
                            className={cn(
                              "text-xs",
                              SOURCE_COLORS[row.source] || "bg-gray-100 text-gray-800"
                            )}
                          >
                            {row.source}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} results
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1
                    const isCurrentPage = page === currentPage
                    return (
                      <Button
                        key={page}
                        variant={isCurrentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-8 h-8 p-0"
                      >
                        {page}
                      </Button>
                    )
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}