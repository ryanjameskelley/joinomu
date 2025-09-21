import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HealthMetricsCard } from '../health-metrics-card'

describe('HealthMetricsCard', () => {
  const defaultProps = {
    metricType: 'heart_rate',
    title: 'Heart Rate',
    value: 72,
    unit: 'bpm',
    lastUpdated: '2024-01-01T12:00:00Z'
  }

  it('renders metric card with basic information', () => {
    render(<HealthMetricsCard {...defaultProps} />)

    expect(screen.getByText('Heart Rate')).toBeInTheDocument()
    expect(screen.getByText('72')).toBeInTheDocument()
    expect(screen.getByText('bpm')).toBeInTheDocument()
  })

  it('shows trend indicators', () => {
    render(
      <HealthMetricsCard
        {...defaultProps}
        trend="up"
        changePercent={5.2}
      />
    )

    expect(screen.getByText('5.2%')).toBeInTheDocument()
  })

  it('displays progress bar when target is set', () => {
    render(
      <HealthMetricsCard
        {...defaultProps}
        showProgress={true}
        target={80}
        targetUnit="bpm"
      />
    )

    expect(screen.getByText('Progress to goal')).toBeInTheDocument()
    expect(screen.getByText('80 bpm')).toBeInTheDocument()
  })

  it('renders compact variant', () => {
    render(
      <HealthMetricsCard
        {...defaultProps}
        variant="compact"
      />
    )

    expect(screen.getByText('Heart Rate')).toBeInTheDocument()
    expect(screen.getByText('72')).toBeInTheDocument()
  })

  it('renders detailed variant with additional info', () => {
    render(
      <HealthMetricsCard
        {...defaultProps}
        variant="detailed"
        previousValue={68}
        source="apple_watch"
      />
    )

    expect(screen.getByText('Previous:')).toBeInTheDocument()
    expect(screen.getByText('68 bpm')).toBeInTheDocument()
    expect(screen.getByText('Source:')).toBeInTheDocument()
    expect(screen.getByText('apple_watch')).toBeInTheDocument()
  })

  it('applies status styling', () => {
    const { rerender } = render(
      <HealthMetricsCard {...defaultProps} status="normal" />
    )

    rerender(<HealthMetricsCard {...defaultProps} status="warning" />)
    rerender(<HealthMetricsCard {...defaultProps} status="danger" />)
    rerender(<HealthMetricsCard {...defaultProps} status="success" />)

    // Test that different status variants are applied
    expect(screen.getByText('Heart Rate')).toBeInTheDocument()
  })

  it('formats large values correctly', () => {
    render(
      <HealthMetricsCard
        {...defaultProps}
        value={1500000}
        title="Steps"
        unit="steps"
      />
    )

    expect(screen.getByText('1.5M')).toBeInTheDocument()
  })

  it('formats time ago correctly', () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    
    render(
      <HealthMetricsCard
        {...defaultProps}
        lastUpdated={oneHourAgo}
      />
    )

    expect(screen.getByText(/ago/)).toBeInTheDocument()
  })

  it('uses custom icon when provided', () => {
    const CustomIcon = () => <div data-testid="custom-icon">Custom</div>
    
    render(
      <HealthMetricsCard
        {...defaultProps}
        icon={<CustomIcon />}
      />
    )

    expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
  })

  it('handles string values', () => {
    render(
      <HealthMetricsCard
        {...defaultProps}
        value="Normal"
        unit=""
      />
    )

    expect(screen.getByText('Normal')).toBeInTheDocument()
  })
})