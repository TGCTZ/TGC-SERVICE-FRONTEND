import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  analyticsQuery,
  type Period,
  type PeriodChoice,
} from '../../data/analytics'
import { KpiRow } from './kpi-row'
import { MarketSection } from './market-section'
import { PeriodPicker } from './period-picker'
import { RevenueSection } from './revenue-section'
import { TurnaroundSection } from './turnaround-section'
import { VolumeSection } from './volume-section'

/**
 * The Management tab: how the lab is doing over a period.
 *
 * One period filter scopes everything below it. Each section fetches its own
 * endpoint, so a slow one (turnaround reads the whole status history) never
 * holds up the rest.
 */
export function ManagementStatistics({
  period,
  onPeriodChange,
}: {
  period: Period
  onPeriodChange: (choice: PeriodChoice) => void
}) {
  const range = useMemo(
    () => ({ from: period.from, to: period.to }),
    [period.from, period.to]
  )
  const summary = useQuery(analyticsQuery('summary', range))

  return (
    <div className='space-y-8'>
      <div className='space-y-4'>
        <PeriodPicker
          period={period}
          onChange={onPeriodChange}
          previous={summary.data?.previous_range}
        />
        <KpiRow query={summary} />
      </div>
      <VolumeSection range={range} />
      <RevenueSection range={range} />
      <TurnaroundSection range={range} />
      <MarketSection range={range} />
    </div>
  )
}
