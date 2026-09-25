import { useQuery } from '@tanstack/react-query'
import { analyticsQuery, type DateRange } from '../../data/analytics'
import { formatCount, formatPercent, formatPeriodLong } from '../../data/format'
import { ChartCard } from './chart-card'
import { PRIMARY, SECONDARY } from './chart-palette'
import { FactsCard } from './facts-card'
import { Section } from './section'
import { TrendChart } from './trend-chart'

/** What came in at reception, what went out as certificates, and from whom. */
export function VolumeSection({ range }: { range: DateRange }) {
  const query = useQuery(analyticsQuery('volume', range))
  const data = query.data
  const granularity = data?.range.granularity ?? 'month'
  const series = data?.series ?? []
  const state = {
    isPending: query.isPending,
    isError: query.isError,
    isStale: query.isPlaceholderData,
  }

  return (
    <Section
      title='Volume & demand'
      description='Stones handed in at reception, certificates issued, and the customers behind them.'
    >
      <div className='grid gap-4 lg:grid-cols-3'>
        <ChartCard
          {...state}
          className='lg:col-span-2'
          title='Stones received and certified'
          description='Received by the date reception took them in; certified by the date the certificate was issued.'
          isEmpty={!!data && !data.totals.stones && !data.totals.certificates}
          table={{
            columns: [
              'Period',
              'Orders',
              'Stones received',
              'Certificates issued',
            ],
            rows: series.map((row) => [
              formatPeriodLong(row.period, granularity),
              row.orders,
              row.stones,
              row.certificates,
            ]),
          }}
        >
          <TrendChart
            data={series}
            granularity={granularity}
            format={formatCount}
            series={[
              { key: 'stones', label: 'Stones received', color: PRIMARY },
              {
                key: 'certificates',
                label: 'Certificates issued',
                color: SECONDARY,
              },
            ]}
          />
        </ChartCard>

        <FactsCard
          isPending={query.isPending}
          isStale={query.isPlaceholderData}
          title='Orders'
          facts={
            data
              ? [
                  {
                    label: 'Orders received',
                    value: formatCount(data.totals.orders),
                  },
                  {
                    label: 'On hold',
                    hint: 'Share of the period’s orders',
                    value: `${data.orders_on_hold} · ${formatPercent(data.hold_rate)}`,
                  },
                  {
                    label: 'Cancelled',
                    hint: 'Share of the period’s orders',
                    value: `${data.orders_cancelled} · ${formatPercent(data.cancel_rate)}`,
                  },
                  {
                    label: 'Certificates revoked',
                    hint: 'Of those issued in the period',
                    value: data.certificates_revoked,
                  },
                ]
              : []
          }
        />

        <ChartCard
          {...state}
          className='lg:col-span-2'
          title='New and returning customers'
          description='Customers who handed stones in; new when it was their first order ever.'
          isEmpty={
            !!data &&
            !data.totals.new_customers &&
            !data.totals.returning_customers
          }
          table={{
            columns: ['Period', 'New', 'Returning'],
            rows: series.map((row) => [
              formatPeriodLong(row.period, granularity),
              row.new_customers,
              row.returning_customers,
            ]),
          }}
        >
          <TrendChart
            kind='stacked'
            data={series}
            granularity={granularity}
            format={formatCount}
            series={[
              {
                key: 'returning_customers',
                label: 'Returning',
                color: PRIMARY,
              },
              { key: 'new_customers', label: 'New', color: SECONDARY },
            ]}
          />
        </ChartCard>

        <FactsCard
          isPending={query.isPending}
          isStale={query.isPlaceholderData}
          title='Customers'
          facts={
            data
              ? [
                  {
                    label: 'Customers served',
                    value: formatCount(
                      data.totals.new_customers +
                        data.totals.returning_customers
                    ),
                  },
                  {
                    label: 'New',
                    value: formatCount(data.totals.new_customers),
                  },
                  {
                    label: 'Returning',
                    hint: 'Came back after an earlier order',
                    value: formatPercent(
                      share(
                        data.totals.returning_customers,
                        data.totals.new_customers +
                          data.totals.returning_customers
                      )
                    ),
                  },
                ]
              : []
          }
        />
      </div>
    </Section>
  )
}

function share(part: number, whole: number): number | null {
  return whole ? part / whole : null
}
