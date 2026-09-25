import { useQuery } from '@tanstack/react-query'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/status-badge'
import {
  type AgingRow,
  analyticsQuery,
  type DateRange,
} from '../../data/analytics'
import { formatCount, formatDays, formatPeriodLong } from '../../data/format'
import { BreakdownChart } from './breakdown-chart'
import { ChartCard, FigureTable } from './chart-card'
import { PRIMARY } from './chart-palette'
import { FactsCard } from './facts-card'
import { Section } from './section'
import { TrendChart } from './trend-chart'

/** How long the work takes, where it waits, what is waiting now, and who does it. */
export function TurnaroundSection({ range }: { range: DateRange }) {
  const query = useQuery(analyticsQuery('turnaround', range))
  const data = query.data
  const granularity = data?.range.granularity ?? 'month'
  const state = {
    isPending: query.isPending,
    isError: query.isError,
    isStale: query.isPlaceholderData,
  }
  const days = data?.turnaround_days

  return (
    <Section
      title='Turnaround & bottlenecks'
      description='From the order being registered to the stone being certified - and where along the way stones wait longest.'
    >
      <div className='grid gap-4 lg:grid-cols-3'>
        <ChartCard
          {...state}
          className='lg:col-span-2'
          title='Median turnaround'
          description='Days from registration to certificate, for stones certified in each period.'
          isEmpty={!!data && data.certified_stones === 0}
          table={{
            columns: ['Period', 'Median', 'Stones certified'],
            rows: (data?.series ?? []).map((row) => [
              formatPeriodLong(row.period, granularity),
              formatDays(row.median_days),
              row.stones,
            ]),
          }}
        >
          <TrendChart
            data={data?.series ?? []}
            granularity={granularity}
            format={formatDays}
            formatTick={(value) => `${value}d`}
            series={[
              {
                key: 'median_days',
                label: 'Median turnaround',
                color: PRIMARY,
              },
            ]}
          />
        </ChartCard>

        <FactsCard
          isPending={query.isPending}
          isStale={query.isPlaceholderData}
          title='Turnaround'
          facts={[
            {
              label: 'Stones certified',
              value: data ? formatCount(data.certified_stones) : '—',
            },
            { label: 'Median', value: formatDays(days?.median ?? null) },
            {
              label: 'Average',
              hint: 'Pulled up by the slowest few',
              value: formatDays(days?.average ?? null),
            },
            {
              label: '9 in 10 within',
              hint: '90th percentile',
              value: formatDays(days?.p90 ?? null),
            },
          ]}
        />

        <ChartCard
          {...state}
          className='lg:col-span-2'
          title='Where stones wait'
          description='Median days spent in each stage, for stones that moved on from it in the period.'
          isEmpty={!!data && data.stages.length === 0}
          table={{
            columns: ['Stage', 'Median', 'Average', 'Stones'],
            rows: (data?.stages ?? []).map((stage) => [
              stage.label,
              formatDays(stage.median_days),
              formatDays(stage.average_days),
              stage.stones,
            ]),
          }}
        >
          <BreakdownChart
            data={(data?.stages ?? []).map((stage) => ({
              name: stage.label,
              count: stage.median_days ?? 0,
            }))}
            measure='Median days'
            format={formatDays}
          />
        </ChartCard>

        <AgingCard
          isPending={query.isPending}
          isStale={query.isPlaceholderData}
          rows={data?.aging ?? []}
        />

        <ChartCard
          {...state}
          title='Findings finalized'
          description='Per gemmologist, in the period.'
          isEmpty={!!data && data.workload.reports.length === 0}
          table={{
            columns: ['Gemmologist', 'Reports'],
            rows: (data?.workload.reports ?? []).map((row) => [
              row.name,
              row.count,
            ]),
          }}
        >
          <BreakdownChart
            data={data?.workload.reports ?? []}
            measure='Reports'
          />
        </ChartCard>

        <ChartCard
          {...state}
          title='Certificates issued'
          description='Per issuing officer, in the period.'
          isEmpty={!!data && data.workload.certificates.length === 0}
          table={{
            columns: ['Officer', 'Certificates'],
            rows: (data?.workload.certificates ?? []).map((row) => [
              row.name,
              row.count,
            ]),
          }}
        >
          <BreakdownChart
            data={data?.workload.certificates ?? []}
            measure='Certificates'
          />
        </ChartCard>
      </div>
    </Section>
  )
}

const BADGE_TONES = { watch: 'warning', late: 'danger' } as const

/**
 * What is in the lab right now, by days waited in its current stage.
 *
 * A table rather than a chart: stages by age bands is a grid of small counts.
 * The bands and their statuses come from the API, cut around the usual one to
 * three days for the whole job; a count in a "watch" or "late" band is badged
 * where it sits, zeros recede, and the legend says what the badges mean so
 * colour is never the only signal.
 */
function AgingCard({
  rows,
  isPending,
  isStale,
}: {
  rows: AgingRow[]
  isPending: boolean
  isStale: boolean
}) {
  // Python source avoids the en dash; the page should not.
  const bands =
    rows[0]?.buckets.map((bucket) => bucket.label.replace('-', '–')) ?? []

  return (
    <Card className='gap-4 lg:col-span-3'>
      <CardHeader>
        <CardTitle className='text-sm font-medium'>
          Work in the lab now
        </CardTitle>
        <CardDescription className='text-xs'>
          Stones in each stage today, by how long they have waited in it. The
          whole job usually takes 1–3 days when payment is prompt, so each stage
          should clear within a day. Not affected by the period.
        </CardDescription>
      </CardHeader>
      <CardContent
        className={isStale ? 'opacity-60 transition-opacity' : undefined}
      >
        {isPending ? (
          <Skeleton className='h-32 w-full' />
        ) : rows.length === 0 ? (
          <p className='py-6 text-center text-sm text-muted-foreground'>
            Nothing is waiting.
          </p>
        ) : (
          <>
            <FigureTable
              columns={['Stage', ...bands, 'Total']}
              rows={rows.map((row) => [
                row.label,
                ...row.buckets.map((bucket) => {
                  if (bucket.count === 0) {
                    return <span className='text-muted-foreground'>0</span>
                  }
                  const tone =
                    bucket.status === 'normal'
                      ? null
                      : BADGE_TONES[bucket.status]
                  return tone ? (
                    <StatusBadge tone={tone}>{bucket.count}</StatusBadge>
                  ) : (
                    bucket.count
                  )
                }),
                row.total,
              ])}
            />
            <div className='flex flex-wrap gap-x-5 gap-y-2 pt-3 text-xs text-muted-foreground'>
              <span className='flex items-center gap-1.5'>
                <StatusBadge tone='warning'>2–3 days</StatusBadge>
                one stage alone has used the usual time for the whole job
              </span>
              <span className='flex items-center gap-1.5'>
                <StatusBadge tone='danger'>4+ days</StatusBadge>
                overdue - follow up
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
