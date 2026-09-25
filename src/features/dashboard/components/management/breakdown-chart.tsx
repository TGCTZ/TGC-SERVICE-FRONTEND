import { Bar, BarChart, Cell, LabelList, XAxis, YAxis } from 'recharts'
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
} from '@/components/ui/chart'
import { type Ranked } from '../../data/analytics'
import { formatCount } from '../../data/format'
import { PRIMARY } from './chart-palette'
import { type TooltipProps } from './trend-chart'

type BreakdownChartProps = {
  data: Ranked[]
  /** What a bar measures, e.g. "Reports"; names the value in the tooltip. */
  measure: string
  format?: (value: number) => string
}

/**
 * A ranked list as horizontal bars, value at each bar's tip.
 *
 * One colour for every bar: the categories have no order of their own, so a
 * darker-where-bigger ramp would only repeat what the bar length says. The
 * folded "Other" bar is grey, since it is a remainder rather than a category.
 */
export function BreakdownChart({
  data,
  measure,
  format = formatCount,
}: BreakdownChartProps) {
  const config = { count: { label: measure, ...PRIMARY } } satisfies ChartConfig

  return (
    <ChartContainer
      config={config}
      className='aspect-auto w-full'
      style={{ height: data.length * 32 + 8 }}
    >
      <BarChart
        data={data}
        layout='vertical'
        margin={{ top: 4, right: 56, bottom: 4, left: 0 }}
        barCategoryGap={6}
      >
        <XAxis type='number' dataKey='count' hide />
        <YAxis
          type='category'
          dataKey='name'
          tickLine={false}
          axisLine={false}
          width={150}
          interval={0}
        />
        <ChartTooltip
          cursor={{ fill: 'var(--muted)', opacity: 0.6 }}
          content={({ active, payload }) => (
            <RankedTooltip
              active={active}
              payload={payload}
              measure={measure}
              format={format}
            />
          )}
        />
        <Bar dataKey='count' radius={[0, 4, 4, 0]} maxBarSize={20}>
          {data.map((row) => (
            <Cell
              key={row.name}
              fill={
                row.name === 'Other' ? 'var(--chart-6)' : 'var(--color-count)'
              }
            />
          ))}
          <LabelList
            dataKey='count'
            position='right'
            className='fill-foreground'
            fontSize={12}
            formatter={(value) => format(Number(value))}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}

function RankedTooltip({
  active,
  payload,
  measure,
  format,
}: TooltipProps & {
  measure: string
  format: (value: number) => string
}) {
  const item = payload?.[0]
  if (!active || !item) return null

  return (
    <div className='grid gap-1 rounded-lg border bg-background px-2.5 py-1.5 text-xs shadow-xl'>
      <div className='text-muted-foreground'>{item.payload?.name}</div>
      <div>
        <span className='font-medium text-foreground tabular-nums'>
          {format(Number(item.value))}
        </span>{' '}
        <span className='text-muted-foreground'>{measure.toLowerCase()}</span>
      </div>
    </div>
  )
}
