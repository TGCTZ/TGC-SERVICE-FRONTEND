import { useQuery } from '@tanstack/react-query'
import {
  analyticsQuery,
  type DateRange,
  type Ranked,
} from '../../data/analytics'
import { BreakdownChart } from './breakdown-chart'
import { ChartCard } from './chart-card'
import { Section } from './section'

/** What the lab is seeing: the market behind the work. */
export function MarketSection({ range }: { range: DateRange }) {
  const query = useQuery(analyticsQuery('market', range))
  const data = query.data
  const state = {
    isPending: query.isPending,
    isError: query.isError,
    isStale: query.isPlaceholderData,
  }

  const findings = 'Findings finalized in the period.'
  const panels: {
    title: string
    description: string
    rows?: Ranked[]
    measure: string
  }[] = [
    {
      title: 'Species',
      description: findings,
      rows: data?.species,
      measure: 'Reports',
    },
    {
      title: 'Varieties',
      description: findings,
      rows: data?.varieties,
      measure: 'Reports',
    },
    {
      title: 'Origins',
      description: findings,
      rows: data?.origins,
      measure: 'Reports',
    },
    {
      title: 'Natural, treated or synthetic',
      description: findings,
      rows: data?.nature,
      measure: 'Reports',
    },
    {
      title: 'Treatments',
      description: findings,
      rows: data?.treatments,
      measure: 'Reports',
    },
    {
      title: 'Stone types',
      description: 'Stones identified in the period.',
      rows: data?.stone_types,
      measure: 'Stones',
    },
    {
      title: 'Customer regions',
      description: 'Stones received in the period, by the customer’s region.',
      rows: data?.regions,
      measure: 'Stones',
    },
  ]

  return (
    <Section
      title='Market insights'
      description='What is coming through the lab: the ten most frequent of each, the rest summed as Other.'
    >
      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
        {panels.map((panel) => (
          <ChartCard
            key={panel.title}
            {...state}
            title={panel.title}
            description={panel.description}
            isEmpty={!!data && !panel.rows?.length}
            table={{
              columns: [panel.title, panel.measure],
              rows: (panel.rows ?? []).map((row) => [row.name, row.count]),
            }}
          >
            <BreakdownChart data={panel.rows ?? []} measure={panel.measure} />
          </ChartCard>
        ))}
      </div>
    </Section>
  )
}
