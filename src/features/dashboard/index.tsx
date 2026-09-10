import { useQueries } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { PERMISSIONS, perm } from '@/lib/permissions'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Can } from '@/components/can'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { STONE_STATUS_LABELS } from '@/features/stones/data/enums'
import { allWorklistConfigs } from '@/features/worklists/data/config'
import { countQuery } from './data/api'

/**
 * Stone statuses worth a tile.
 *
 * The pipeline's four live states. The other five are either unimplemented
 * handover stages or exceptions rare enough that a queue is the better place
 * to notice them.
 */
const TRACKED_STATUSES = ['received', 'billed', 'paid', 'certified'] as const

/**
 * The lab's status board.
 *
 * Every number is a `count` off a list endpoint the app already calls, so
 * there is no reporting endpoint to keep in step — and each queue tile links
 * to the queue itself, because a number nobody can act on is decoration.
 */
export function Dashboard() {
  const queues = allWorklistConfigs()

  const queueCounts = useQueries({
    queries: queues.map((config) => countQuery(config.endpoint)),
  })

  const statusCounts = useQueries({
    queries: TRACKED_STATUSES.map((status) =>
      countQuery('/stones', { 'filter[status]': status })
    ),
  })

  const [orders, customers, certificates, unprocessed] = useQueries({
    queries: [
      countQuery('/orders'),
      countQuery('/customers'),
      countQuery('/certificates', { 'filter[status]': 'issued' }),
      countQuery('/payments', { 'filter[is_processed]': 0 }),
    ],
  })

  return (
    <>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-6'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Dashboard</h1>
          <p className='text-muted-foreground'>
            What the lab is holding, and what is waiting on someone.
          </p>
        </div>

        <section className='space-y-3'>
          <h2 className='text-sm font-medium text-muted-foreground'>
            Waiting on someone
          </h2>
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            {queues.map((config, index) => (
              <Can key={config.slug} permission={config.permission}>
                <Link
                  to='/worklists/$slug'
                  params={{ slug: config.slug }}
                  className='block'
                >
                  <Card className='h-full transition-colors hover:border-primary'>
                    <CardHeader className='pb-2'>
                      <CardTitle className='text-sm font-medium'>
                        {config.title}
                      </CardTitle>
                      <CardDescription className='flex items-center gap-1 text-xs'>
                        {config.actionLabel}
                        <ArrowRight className='size-3' />
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Counter query={queueCounts[index]} />
                    </CardContent>
                  </Card>
                </Link>
              </Can>
            ))}
          </div>
        </section>

        <Can permission={perm('stones', 'view')}>
          <section className='space-y-3'>
            <h2 className='text-sm font-medium text-muted-foreground'>
              Stones in the lab
            </h2>
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
              {TRACKED_STATUSES.map((status, index) => (
                <Card key={status}>
                  <CardHeader className='pb-2'>
                    <CardTitle className='text-sm font-medium'>
                      {STONE_STATUS_LABELS[status]}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Counter query={statusCounts[index]} />
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </Can>

        <section className='space-y-3'>
          <h2 className='text-sm font-medium text-muted-foreground'>Totals</h2>
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            <Can permission={perm('orders', 'view')}>
              <Card>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-sm font-medium'>Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <Counter query={orders} />
                </CardContent>
              </Card>
            </Can>

            <Can permission={perm('customers', 'view')}>
              <Card>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Customers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Counter query={customers} />
                </CardContent>
              </Card>
            </Can>

            <Can permission={perm('certificates', 'view')}>
              <Card>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Certificates standing
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Counter query={certificates} />
                </CardContent>
              </Card>
            </Can>

            {/* Money that arrived but has not reached its bill: the one number
              here that is a problem rather than a fact. */}
            <Can permission={perm('payments', 'view')}>
              <Link
                to='/payments'
                search={{ processed: '0' }}
                className='block'
              >
                <Card className='h-full transition-colors hover:border-primary'>
                  <CardHeader className='pb-2'>
                    <CardTitle className='text-sm font-medium'>
                      Unprocessed payments
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='flex items-center gap-2'>
                    <Counter query={unprocessed} />
                    {(unprocessed.data ?? 0) > 0 && (
                      <Badge variant='destructive'>Needs attention</Badge>
                    )}
                  </CardContent>
                </Card>
              </Link>
            </Can>
          </div>
        </section>

        <Can permission={PERMISSIONS.viewActivityLogs}>
          <p className='text-xs text-muted-foreground'>
            Every change behind these numbers is recorded — see Audit logs.
          </p>
        </Can>
      </Main>
    </>
  )
}

/** One number, or a placeholder while it loads or if it cannot be read. */
function Counter({
  query,
}: {
  query: { data?: number; isPending: boolean; isError: boolean }
}) {
  if (query.isPending) return <Skeleton className='h-8 w-16' />

  if (query.isError) {
    return <span className='text-2xl font-bold text-muted-foreground'>—</span>
  }

  return <span className='text-2xl font-bold tabular-nums'>{query.data}</span>
}
