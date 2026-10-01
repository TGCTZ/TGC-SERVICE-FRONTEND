import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { Download } from 'lucide-react'
import { toast } from 'sonner'
import { formatDateTime } from '@/lib/format'
import { serverMessageOr } from '@/lib/handle-server-error'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ReportSectionCard } from './components/section'
import { downloadReport, reportsQuery } from './data/api'
import { reportConfigs, type ReportKind } from './data/config'
import { defaultPeriod, periodProblem } from './data/period'
import { type ReportSearch } from './data/schema'

const financialRoute = getRouteApi('/_authenticated/reports/financial/')
const operationalRoute = getRouteApi('/_authenticated/reports/operational/')

export function FinancialReports() {
  const search = financialRoute.useSearch()
  const navigate = financialRoute.useNavigate()
  return (
    <ReportsPage
      kind='financial'
      search={search}
      onChange={(next) => void navigate({ search: next, replace: true })}
    />
  )
}

export function OperationalReports() {
  const search = operationalRoute.useSearch()
  const navigate = operationalRoute.useNavigate()
  return (
    <ReportsPage
      kind='operational'
      search={search}
      onChange={(next) => void navigate({ search: next, replace: true })}
    />
  )
}

type Props = {
  kind: ReportKind
  search: ReportSearch
  onChange: (search: ReportSearch) => void
}

/** Shared layout mirrors resource list screens; URL state remains the source of truth. */
export function ReportsPage({ kind, search, onChange }: Props) {
  const config = reportConfigs[kind]
  const defaults = defaultPeriod()
  const state = {
    ...search,
    from: search.from ?? defaults.from,
    to: search.to ?? defaults.to,
    page: search.page ?? 1,
    pageSize: search.pageSize ?? 10,
  }
  const problem = periodProblem(state.from, state.to)
  const query = useQuery({ ...reportsQuery(kind, state), enabled: !problem })
  const [exporting, setExporting] = useState(false)
  const data = query.data
  const totalRows =
    data?.sections.reduce((sum, section) => sum + section.count, 0) ?? 0

  function changeFilters(next: Partial<ReportSearch>) {
    onChange({ ...state, ...next, page: 1, section: undefined })
  }

  async function exportFile(fileType: 'xlsx' | 'pdf') {
    setExporting(true)
    try {
      await downloadReport(kind, state, fileType)
    } catch (error) {
      // Axios returns JSON errors as blobs when the request expects a download.
      if (error && typeof error === 'object' && 'response' in error) {
        const response = (error as { response?: { data?: unknown } }).response
        if (response?.data instanceof Blob) {
          try {
            const payload = JSON.parse(await response.data.text()) as {
              detail?: string | string[]
            }
            toast.error(
              Array.isArray(payload.detail)
                ? payload.detail.join(' ')
                : (payload.detail ?? 'Could not download this report.')
            )
            return
          } catch {
            /* The server may return a non-JSON error body. */
          }
        }
      }
      toast.error(
        serverMessageOr(
          error,
          'Could not download this report. Please try again.'
        )
      )
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>
      <Main className='flex flex-1 flex-col gap-6'>
        <div className='flex flex-wrap items-start justify-between gap-4'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>
              {config.title}
            </h1>
            <p className='text-muted-foreground'>{config.description}</p>
          </div>
          <div className='flex gap-2'>
            <Button
              variant='outline'
              disabled={
                !data ||
                !!problem ||
                query.isFetching ||
                exporting ||
                totalRows > 10000
              }
              onClick={() => void exportFile('xlsx')}
            >
              <Download className='size-4' />
              Excel
            </Button>
            <Button
              variant='outline'
              disabled={
                !data ||
                !!problem ||
                query.isFetching ||
                exporting ||
                totalRows > 10000
              }
              onClick={() => void exportFile('pdf')}
            >
              <Download className='size-4' />
              PDF
            </Button>
          </div>
        </div>
        <div className='flex flex-wrap items-end gap-3 rounded-lg border bg-card p-4'>
          <div className='space-y-2'>
            <Label htmlFor='report-from'>From</Label>
            <Input
              id='report-from'
              type='date'
              value={state.from}
              onChange={(event) => changeFilters({ from: event.target.value })}
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='report-to'>To</Label>
            <Input
              id='report-to'
              type='date'
              value={state.to}
              onChange={(event) => changeFilters({ to: event.target.value })}
            />
          </div>
          <Button
            variant='outline'
            onClick={() => onChange({ ...defaults, pageSize: state.pageSize })}
          >
            Reset to this month
          </Button>
          <FilterSelect
            label='Customer'
            value={state.customer?.toString()}
            choices={data?.filters.customers ?? []}
            onChange={(value) =>
              changeFilters({ customer: value ? Number(value) : undefined })
            }
          />
          {kind === 'financial' ? (
            <>
              {data?.sections.some((section) =>
                ['billing', 'outstanding'].includes(section.key)
              ) && (
                <FilterSelect
                  label='Bill status'
                  value={state.status}
                  choices={[
                    'pending',
                    'partially_paid',
                    'paid',
                    'cancelled',
                    'expired',
                  ].map((status) => ({
                    id: status,
                    label: status.replace(/_/g, ' '),
                  }))}
                  onChange={(value) => changeFilters({ status: value })}
                />
              )}
              {data?.sections.some(
                (section) => section.key === 'collections'
              ) && (
                <FilterSelect
                  label='Payment provider'
                  value={state.provider}
                  choices={data.filters.providers}
                  onChange={(value) => changeFilters({ provider: value })}
                />
              )}
            </>
          ) : (
            <FilterSelect
              label='Stone type'
              value={state.stoneType?.toString()}
              choices={data?.filters.stone_types ?? []}
              onChange={(value) =>
                changeFilters({ stoneType: value ? Number(value) : undefined })
              }
            />
          )}
        </div>
        <p className='text-xs text-muted-foreground'>
          Dates are inclusive in Africa/Dar_es_Salaam.{' '}
          {kind === 'financial' &&
            'Bill status applies to billing and outstanding sections; payment provider applies to collections and exceptions. Outstanding balances are current.'}
        </p>
        {query.isPlaceholderData && (
          <p role='status' className='text-sm text-muted-foreground'>
            Updating report...
          </p>
        )}
        {problem ? (
          <Alert variant='destructive'>
            <AlertTitle>Check the date range</AlertTitle>
            <AlertDescription>{problem}</AlertDescription>
          </Alert>
        ) : query.isError ? (
          <Alert variant='destructive'>
            <AlertTitle>Could not load the report</AlertTitle>
            <AlertDescription>
              {serverMessageOr(query.error, 'Please try again.')}
            </AlertDescription>
            <Button variant='outline' onClick={() => void query.refetch()}>
              Retry
            </Button>
          </Alert>
        ) : query.isPending ? (
          <Skeleton className='h-48 w-full' />
        ) : (
          data && (
            <>
              <p className='text-xs text-muted-foreground'>
                Generated {formatDateTime(data.generated_at)}. Exports include
                all matching authorized sections.
              </p>
              {totalRows > 10000 && (
                <Alert>
                  <AlertTitle>Narrow the filters to export</AlertTitle>
                  <AlertDescription>
                    The report contains {totalRows.toLocaleString('en-TZ')}{' '}
                    detail rows. Downloads support up to 10,000 rows.
                  </AlertDescription>
                </Alert>
              )}
              {data.sections.map((section) => (
                <ReportSectionCard
                  key={section.key}
                  kind={kind}
                  summary={section}
                  search={state}
                  active={
                    state.section === section.key ||
                    (!state.section && data.section === section.key)
                  }
                  onPageChange={(page, pageSize) =>
                    onChange({ ...state, section: section.key, page, pageSize })
                  }
                />
              ))}
            </>
          )
        )}
      </Main>
    </>
  )
}

type FilterProps = {
  label: string
  value?: string
  choices: { id: string | number; label: string }[]
  onChange: (value: string | undefined) => void
}

function FilterSelect({ label, value, choices, onChange }: FilterProps) {
  const id = `report-${label.toLowerCase().replace(/ /g, '-')}`
  return (
    <div className='min-w-44 space-y-2'>
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={value ?? 'all'}
        onValueChange={(next) => onChange(next === 'all' ? undefined : next)}
      >
        <SelectTrigger id={id}>
          <SelectValue placeholder={`All ${label.toLowerCase()}s`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>All</SelectItem>
          {choices.map((choice) => (
            <SelectItem key={choice.id} value={String(choice.id)}>
              {choice.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
