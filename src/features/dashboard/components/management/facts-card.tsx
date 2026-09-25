import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export type Fact = {
  label: string
  value: React.ReactNode
  /** A second line under the label, for what the number means. */
  hint?: string
}

/**
 * A handful of single figures that belong together.
 *
 * Numbers that are one value each - a rate, a median, a count - are clearer
 * written down than drawn: a one-bar chart is only a slower way to read them.
 */
export function FactsCard({
  title,
  facts,
  isPending,
  isStale = false,
  className,
}: {
  title: string
  facts: Fact[]
  isPending: boolean
  isStale?: boolean
  className?: string
}) {
  return (
    <Card className={cn('gap-4', className)}>
      <CardHeader>
        <CardTitle className='text-sm font-medium'>{title}</CardTitle>
      </CardHeader>
      <CardContent
        className={cn('transition-opacity', isStale && 'opacity-60')}
      >
        {isPending ? (
          <Skeleton className='h-40 w-full' />
        ) : (
          <dl className='divide-y'>
            {facts.map((fact) => (
              <div
                key={fact.label}
                className='flex items-baseline justify-between gap-4 py-2 first:pt-0 last:pb-0'
              >
                <dt className='text-sm text-muted-foreground'>
                  {fact.label}
                  {fact.hint && (
                    <span className='block text-xs'>{fact.hint}</span>
                  )}
                </dt>
                <dd className='text-right text-sm font-semibold tabular-nums'>
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </CardContent>
    </Card>
  )
}
