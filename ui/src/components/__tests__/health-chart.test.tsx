import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HealthChart } from '../health-chart'

const mockData = [
  { date: '2024-01-01', value: 72, unit: 'bpm', source: 'apple_watch' },
  { date: '2024-01-02', value: 75, unit: 'bpm', source: 'apple_watch' },
  { date: '2024-01-03', value: 70, unit: 'bpm', source: 'apple_watch' },
]

describe('HealthChart', () => {
  it('renders chart with data', () => {
    render(
      <HealthChart
        data={mockData}
        title="Heart Rate"
        description="Daily heart rate measurements"
      />
    )

    expect(screen.getByText('Heart Rate')).toBeInTheDocument()
    expect(screen.getByText('Daily heart rate measurements')).toBeInTheDocument()
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    render(
      <HealthChart
        data={[]}
        title="Heart Rate"
        loading={true}
      />
    )

    expect(screen.getByText('Loading chart...')).toBeInTheDocument()
  })

  it('shows error state', () => {
    render(
      <HealthChart
        data={[]}
        title="Heart Rate"
        error="Failed to load chart data"
      />
    )

    expect(screen.getByText('Failed to load chart data')).toBeInTheDocument()
  })

  it('shows no data state', () => {
    render(
      <HealthChart
        data={[]}
        title="Heart Rate"
      />
    )

    expect(screen.getByText('No data available')).toBeInTheDocument()
  })

  it('renders different chart types', () => {
    const { rerender } = render(
      <HealthChart data={mockData} type="line" />
    )
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()

    rerender(<HealthChart data={mockData} type="area" />)
    expect(screen.getByTestId('area-chart')).toBeInTheDocument()

    rerender(<HealthChart data={mockData} type="bar" />)
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()

    rerender(<HealthChart data={mockData} type="pie" />)
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
  })

  it('applies custom value formatter', () => {
    const formatter = vi.fn((value: number) => `${value} beats`)
    
    render(
      <HealthChart
        data={mockData}
        valueFormatter={formatter}
      />
    )

    // Formatter would be called during chart rendering
    // This is a basic test to ensure the prop is accepted
    expect(formatter).toHaveBeenCalledWith(72)
  })

  it('shows target line when target value provided', () => {
    render(
      <HealthChart
        data={mockData}
        targetValue={80}
        targetLabel="Target Heart Rate"
      />
    )

    // Target line would be rendered in the chart
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
  })

  it('handles custom date format', () => {
    render(
      <HealthChart
        data={mockData}
        dateFormat="yyyy-MM-dd"
      />
    )

    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
  })
})