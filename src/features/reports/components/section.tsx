import { useQuery } from '@tanstack/react-query'
import { formatMoney } from '@/lib/format'
import { serverMessageOr } from '@/lib/handle-server-error'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { DataTable } from '@/components/data-table'
import { reportsQuery } from '../data/api'
import { type ReportKind } from '../data/config'
import { type ReportSearch, type ReportSection } from '../data/schema'
import { reportColumns } from './columns'

type Props = {
  kind: ReportKind
  summary: ReportSection
  search: ReportSearch
  active: boolean
  onPageChange: (page: number, pageSize: number) => void
}

/** One table has its own paging and retry state; summaries always cover the whole result. */
export function ReportSectionCard({
  kind,
  summary,
  search,
  active,
  onPageChange,
}: Props) {
  const state = {
    ...search,
    section: summary.key,
    page: active ? (search.page ?? 1) : 1,
    pageSize: search.pageSize ?? 10,
  }
  const query = useQuery(reportsQuery(kind, state))
  const data = query.data
  return (
    <Card>
      <CardHeader>
        <CardTitle>{summary.title}</CardTitle>
        <CardDescription>{summary.description}</CardDescription>
      </CardHeader>
      <CardContent
        className={
          query.isPlaceholderData ? 'space-y-4 opacity-60' : 'space-y-4'
        }
        aria-busy={query.isFetching}
      >
        <div className='flex flex-wrap gap-x-6 gap-y-2 text-sm'>
          <p>
            <span className='font-semibold tabular-nums'>
              {summary.count.toLocaleString('en-TZ')}
            </span>{' '}
            matching records
          </p>
          {summary.amounts.map((amount) => (
            <p key={amount.currency} className='font-semibold tabular-nums'>
              {formatMoney(Number(amount.amount), amount.currency)}
            </p>
          ))}
          {summary.statuses.map((status) => (
            <p key={status.status} className='text-muted-foreground'>
              {status.status.replace(/_/g, ' ')}: {status.count}
            </p>
          ))}
        </div>
        {summary.missing_dates > 0 && (
          <Alert>
            <AlertTitle>Records without an event date</AlertTitle>
            <AlertDescription>
              {summary.missing_dates} undated records match the other filters
              across all dates. They cannot be assigned to this period and are
              excluded.
            </AlertDescription>
          </Alert>
        )}
        {query.isError ? (
          <Alert variant='destructive'>
            <AlertTitle>Could not load this section</AlertTitle>
            <AlertDescription>
              {serverMessageOr(query.error, 'Please try again.')}
            </AlertDescription>
            <Button
              variant='outline'
              size='sm'
              onClick={() => void query.refetch()}
            >
              Retry
            </Button>
          </Alert>
        ) : (
          <DataTable
            columns={reportColumns(data?.columns ?? [])}
            data={data?.page.items ?? []}
            meta={data?.page.meta}
            isFetching={query.isFetching}
            state={{ page: state.page, perPage: state.pageSize, search: '' }}
            onStateChange={(next) =>
              onPageChange(
                next.page ?? state.page,
                next.perPage ?? state.pageSize
              )
            }
            emptyMessage='Nothing recorded in this period.'
          />
        )}
      </CardContent>
    </Card>
  )
}
