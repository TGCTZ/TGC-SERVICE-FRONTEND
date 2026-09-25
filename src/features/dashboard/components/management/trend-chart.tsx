import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from 'recharts'
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
} from '@/components/ui/chart'
import { type Granularity } from '../../data/analytics'
import { formatPeriod, formatPeriodLong } from '../../data/format'

/** The slice of Recharts' tooltip props these tooltips read. */
export type TooltipProps = {
  active?: boolean
  label?: unknown
  payload?: readonly {
    dataKey?: unknown
    value?: unknown
    color?: string
    payload?: { name?: string }
  }[]
}

export type Series = {
  key: string
  label: string
  color: { theme: { light: string; dark: string } }
}

type TrendChartProps = {
  data: ({ period: string } & Record<string, unknown>)[]
  series: Series[]
  granularity: Granularity
  /** `line` for a trend, `bar` to compare two series side by side, `stacked` for parts of a whole. */
  kind?: 'line' | 'bar' | 'stacked'
  /** The full value, for the tooltip. */
  format: (value: number) => string
  /** A short value for the y-axis ticks. */
  formatTick?: (value: number) => string
}

/**
 * One or two series over the period's buckets, on a single y-axis.
 *
 * Marks follow the dataviz specs: 2px lines, bars at most 24px wide with a
 * 4px rounded end, hairline horizontal grid only, and a 2px surface gap
 * between touching bars. Lines are straight between points: a smoothed curve
 * would invent values between buckets, including dips below zero.
 */
export function TrendChart({
  data,
  series,
  granularity,
  kind = 'line',
  format,
  formatTick = format,
}: TrendChartProps) {
  const config = Object.fromEntries(
    series.map((entry) => [entry.key, { label: entry.label, ...entry.color }])
  ) satisfies ChartConfig

  const chrome = [
    <CartesianGrid key='grid' vertical={false} />,
    <XAxis
      key='x'
      dataKey='period'
      tickLine={false}
      axisLine={false}
      tickMargin={8}
      minTickGap={16}
      tickFormatter={(period: string) => formatPeriod(period, granularity)}
    />,
    <YAxis
      key='y'
      tickLine={false}
      axisLine={false}
      width={88}
      tickFormatter={(value: number) => formatTick(value)}
    />,
    <ChartTooltip
      key='tooltip'
      cursor={kind === 'line' ? true : { fill: 'var(--muted)', opacity: 0.6 }}
      content={({ active, payload, label }) => (
        <SeriesTooltip
          active={active}
          payload={payload}
          label={label}
          series={series}
          granularity={granularity}
          format={format}
        />
      )}
    />,
    ...(series.length > 1
      ? [<ChartLegend key='legend' content={<ChartLegendContent />} />]
      : []),
  ]

  return (
    <ChartContainer config={config} className='aspect-auto h-64 w-full'>
      {kind === 'line' ? (
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0 }}>
          {chrome}
          {series.map((entry) => (
            <Line
              key={entry.key}
              dataKey={entry.key}
              type='linear'
              stroke={`var(--color-${entry.key})`}
              strokeWidth={2}
              strokeLinecap='round'
              strokeLinejoin='round'
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--card)' }}
            />
          ))}
        </LineChart>
      ) : (
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0 }} barGap={2}>
          {chrome}
          {series.map((entry, index) => {
            const top = kind === 'bar' || index === series.length - 1
            return (
              <Bar
                key={entry.key}
                dataKey={entry.key}
                fill={`var(--color-${entry.key})`}
                maxBarSize={24}
                radius={top ? [4, 4, 0, 0] : 0}
                {...(kind === 'stacked' && {
                  stackId: 'total',
                  // The surface-coloured edge is the 2px gap between segments.
                  stroke: 'var(--card)',
                  strokeWidth: 2,
                })}
              />
            )
          })}
        </BarChart>
      )}
    </ChartContainer>
  )
}

/**
 * Every series at the hovered bucket: the value leads, the name follows, and
 * a short line in the series colour keys it.
 */
function SeriesTooltip({
  active,
  payload,
  label,
  series,
  granularity,
  format,
}: TooltipProps & {
  series: Series[]
  granularity: Granularity
  format: (value: number) => string
}) {
  if (!active || !payload?.length) return null

  return (
    <div className='grid min-w-40 gap-1.5 rounded-lg border bg-background px-2.5 py-1.5 text-xs shadow-xl'>
      <div className='text-muted-foreground'>
        {formatPeriodLong(String(label), granularity)}
      </div>
      {payload.map((item) => (
        <div key={String(item.dataKey)} className='flex items-center gap-2'>
          <span
            aria-hidden
            className='h-0.5 w-3 shrink-0 rounded-full'
            style={{ background: item.color }}
          />
          <span className='font-medium text-foreground tabular-nums'>
            {item.value == null ? '—' : format(Number(item.value))}
          </span>
          <span className='text-muted-foreground'>
            {series.find((entry) => entry.key === item.dataKey)?.label}
          </span>
        </div>
      ))}
    </div>
  )
}
