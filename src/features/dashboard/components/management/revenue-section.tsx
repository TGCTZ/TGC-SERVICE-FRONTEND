import { useQuery } from '@tanstack/react-query'
import { StatusBadge } from '@/components/status-badge'
import {
  analyticsQuery,
  type CurrencyRevenue,
  type DateRange,
  type Granularity,
  type Revenue,
} from '../../data/analytics'
import {
  formatAmount,
  formatCount,
  formatDays,
  formatMoney,
  formatPercent,
  formatPeriodLong,
} from '../../data/format'
import { BreakdownChart } from './breakdown-chart'
import { ChartCard } from './chart-card'
import { PRIMARY, SECONDARY } from './chart-palette'
import { FactsCard } from './facts-card'
import { Section } from './section'
import { TrendChart } from './trend-chart'

/** Money billed and collected, and what is still owed - one block per currency. */
export function RevenueSection({ range }: { range: DateRange }) {
  const query = useQuery(analyticsQuery('revenue', range))
  const data = query.data
  const state = {
    isPending: query.isPending,
    isError: query.isError,
    isStale: query.isPlaceholderData,
  }

  return (
    <Section
      title='Revenue & collections'
      description='Bills issued and payments received in the period; what is still owed, as of today. Currencies are never added together.'
    >
      {data && data.by_currency.length > 0 ? (
        data.by_currency.map((currency) => (
          <CurrencyBlock
            key={currency.currency}
            currency={currency}
            revenue={data}
            granularity={data.range.granularity}
            isStale={query.isPlaceholderData}
          />
        ))
      ) : (
        <ChartCard
          {...state}
          title='Billed and collected'
          isEmpty
          table={{ columns: [], rows: [] }}
        >
          {null}
        </ChartCard>
      )}

      {data && data.channels.length > 0 && (
        <div className='grid gap-4 lg:grid-cols-3'>
          <ChartCard
            {...state}
            className='lg:col-span-2'
            title='Payment channels'
            description='Payments received in the period, by the bank or mobile network that took them.'
            table={{
              columns: ['Channel', 'Payments'],
              rows: data.channels.map((row) => [row.name, row.count]),
            }}
          >
            <BreakdownChart data={data.channels} measure='Payments' />
          </ChartCard>
        </div>
      )}
    </Section>
  )
}

function CurrencyBlock({
  currency,
  revenue,
  granularity,
  isStale,
}: {
  currency: CurrencyRevenue
  revenue: Revenue
  granularity: Granularity
  isStale: boolean
}) {
  const code = currency.currency
  const money = (value: number) => formatMoney(value, code)
  const owed = currency.outstanding
  const state = { isPending: false, isError: false, isStale }

  return (
    <div className='grid gap-4 lg:grid-cols-3'>
      <ChartCard
        {...state}
        className='lg:col-span-2'
        title={`Billed and collected · ${code}`}
        description='Billed by the date the bill was issued; collected by the date the payment was made.'
        isEmpty={!currency.billed && !currency.collected}
        table={{
          columns: ['Period', 'Billed', 'Collected'],
          rows: currency.series.map((row) => [
            formatPeriodLong(row.period, granularity),
            money(row.billed),
            money(row.collected),
          ]),
        }}
      >
        <TrendChart
          kind='bar'
          data={currency.series}
          granularity={granularity}
          format={money}
          formatTick={formatAmount}
          series={[
            { key: 'billed', label: 'Billed', color: SECONDARY },
            { key: 'collected', label: 'Collected', color: PRIMARY },
          ]}
        />
      </ChartCard>

      <FactsCard
        isPending={false}
        isStale={isStale}
        title={`Collections · ${code}`}
        facts={[
          { label: 'Collected', value: money(currency.collected) },
          { label: 'Billed', value: money(currency.billed) },
          {
            label: 'Collection rate',
            hint: 'Collected ÷ billed in the period',
            value: formatPercent(currency.collection_rate),
          },
          {
            label: 'Average fee per stone',
            value:
              currency.average_fee_per_stone === null
                ? '—'
                : money(currency.average_fee_per_stone),
          },
          {
            label: 'Time to pay',
            hint: 'Median days from bill to first payment · 9 in 10 within',
            value: `${formatDays(revenue.payment_lag_days.median)} · ${formatDays(revenue.payment_lag_days.p90)}`,
          },
          {
            label: 'Unprocessed payments',
            hint: 'Received but not yet matched to a bill',
            value:
              revenue.unprocessed_payments > 0 ? (
                <StatusBadge tone='danger'>
                  {formatCount(revenue.unprocessed_payments)} need attention
                </StatusBadge>
              ) : (
                0
              ),
          },
        ]}
      />

      <ChartCard
        {...state}
        className='lg:col-span-2'
        title={`Outstanding by age · ${code}`}
        description={
          owed
            ? `${money(owed.amount)} across ${owed.bills} open ${owed.bills === 1 ? 'bill' : 'bills'}, by how long ago each was issued.${owed.expired_bills ? ` Expired, not counted: ${money(owed.expired_amount)} on ${owed.expired_bills}.` : ''}`
            : 'Nothing is owed.'
        }
        isEmpty={!owed || owed.bills === 0}
        table={{
          columns: ['Issued', 'Amount', 'Bills'],
          rows: (owed?.aging ?? []).map((row) => [
            row.label,
            money(row.amount),
            row.bills,
          ]),
        }}
      >
        <BreakdownChart
          data={(owed?.aging ?? []).map((row) => ({
            name: row.label,
            count: row.amount,
          }))}
          measure='Owed'
          format={money}
        />
      </ChartCard>
    </div>
  )
}
