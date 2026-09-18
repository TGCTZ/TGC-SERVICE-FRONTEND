import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { type ColumnDef } from '@tanstack/react-table'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ConfigDrawer } from '@/components/config-drawer'
import { DataTable, type TableQueryState } from '@/components/data-table'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { PageHeading } from '@/components/page-heading'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { IssueCertificateDialog } from '@/features/certificates/components/issue-dialog'
import { GeneralError } from '@/features/errors/general-error'
import { FinalizeReportDialog } from '@/features/identification/components/finalize-dialog'
import { ReportMutateDialog } from '@/features/identification/components/mutate-dialog'
import { reportQuery } from '@/features/identification/data/api'
import { type IdentificationReport } from '@/features/identification/data/schema'
import { AddStoneDialog } from '@/features/orders/components/add-stone-dialog'
import { ordersDataColumns } from '@/features/orders/components/columns'
import { GenerateBillDialog } from '@/features/orders/components/generate-bill-dialog'
import { type Order } from '@/features/orders/data/schema'
import { stonesDataColumns } from '@/features/stones/components/columns'
import { type Stone } from '@/features/stones/data/schema'
import { worklistQuery } from './data/api'
import { worklistConfigBySlug, type WorklistConfig } from './data/config'

const route = getRouteApi('/_authenticated/worklists/$slug/')

/** Which row the primary action was pressed on, and which dialog it opens. */
type PendingAction =
  | { slug: 'identification'; order: Order }
  | { slug: 'billing'; order: Order }
  | { slug: 'findings'; stone: Stone }
  | { slug: 'findings-edit'; reportId: number }
  | { slug: 'findings-finalize'; reportId: number }
  | { slug: 'certification'; stone: Stone }

/**
 * One screen for all four queues.
 *
 * The queues differ only in their endpoint, their row shape and the dialog
 * their primary action opens — everything else, including the columns, is
 * borrowed from the feature that owns those rows. So a queue's rows look
 * exactly like the same records look everywhere else in the app.
 */
export function Worklists() {
  const { slug } = route.useParams()
  const config = worklistConfigBySlug(slug)

  if (!config) {
    return <GeneralError minimal className='h-auto py-12' />
  }

  // Remount on slug change so paging and any open dialog reset between queues.
  return <WorklistContent key={slug} config={config} />
}

function WorklistContent({ config }: { config: WorklistConfig }) {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const [pending, setPending] = useState<PendingAction | null>(null)

  const state: TableQueryState = {
    page: search.page ?? 1,
    perPage: search.pageSize ?? 10,
    search: search.search ?? '',
    sortBy: undefined,
    sortDir: undefined,
  }

  const { data, isPending, isError, isFetching } = useQuery(
    worklistQuery(config, {
      page: state.page,
      perPage: state.perPage,
      search: state.search,
    })
  )

  function handleStateChange(next: Partial<TableQueryState>) {
    navigate({
      search: (prev) => ({
        ...prev,
        page: next.page ?? prev.page,
        pageSize: next.perPage ?? prev.pageSize,
        search: next.search ?? prev.search,
      }),
      replace: true,
    })
  }

  /**
   * The queue's search box, or nothing for a queue that declares no placeholder.
   *
   * Undebounced, like every other search in the app: each keystroke refetches,
   * cushioned by the query keeping the previous page on screen while the next
   * one loads. Typing resets to page 1, or a search would land on a page number
   * the narrowed result no longer has.
   */
  const toolbar = config.searchPlaceholder ? (
    <>
      <Input
        placeholder={config.searchPlaceholder}
        value={state.search}
        onChange={(e) => handleStateChange({ search: e.target.value, page: 1 })}
        className='h-8 w-full max-w-72'
      />

      {state.search && (
        <Button
          variant='ghost'
          className='h-8 px-2 lg:px-3'
          onClick={() => handleStateChange({ search: '', page: 1 })}
        >
          Reset
          <X className='ms-2 size-4' />
        </Button>
      )}
    </>
  ) : undefined

  /**
   * The queue's last column: one button, not a menu.
   *
   * A queue exists to be worked through, so the row offers the single action
   * that clears it rather than the full row-action menu the owning feature
   * shows. Everything else about the row stays reachable from that feature.
   */
  function actionColumn<T>(
    onAct: (row: T) => void,
    renderRow?: (row: T) => React.ReactNode
  ): ColumnDef<T> {
    return {
      id: 'worklist-action',
      cell: ({ row }) => (
        <div className='flex justify-end gap-2'>
          {renderRow?.(row.original) ?? (
            <Button size='sm' onClick={() => onAct(row.original)}>
              {config.actionLabel}
            </Button>
          )}
        </div>
      ),
    }
  }

  /**
   * The findings queue's row, which depends on whether a draft already exists.
   *
   * A stone carries at most one report, so "Record findings" on a stone that
   * has a draft would post a create the server rejects as a duplicate. The row
   * offers the two things left to do with a draft instead: reopen it, or sign
   * it off.
   */
  function findingsRowActions(stone: Stone) {
    const report = stone.report_detail

    if (!report) {
      return (
        <Button
          size='sm'
          onClick={() => setPending({ slug: 'findings', stone })}
        >
          {config.actionLabel}
        </Button>
      )
    }

    return (
      <>
        <Button
          size='sm'
          variant='outline'
          onClick={() =>
            setPending({ slug: 'findings-edit', reportId: report.id })
          }
        >
          Edit
        </Button>
        <Button
          size='sm'
          onClick={() =>
            setPending({ slug: 'findings-finalize', reportId: report.id })
          }
        >
          Finalize
        </Button>
      </>
    )
  }

  const orderColumns: ColumnDef<Order>[] = [
    ...ordersDataColumns,
    actionColumn<Order>((order) =>
      setPending(
        config.slug === 'identification'
          ? { slug: 'identification', order }
          : { slug: 'billing', order }
      )
    ),
  ]

  const stoneColumns: ColumnDef<Stone>[] = [
    ...stonesDataColumns,
    actionColumn<Stone>(
      (stone) => setPending({ slug: 'certification', stone }),
      config.slug === 'findings' ? findingsRowActions : undefined
    ),
  ]

  return (
    <>
      <Header fixed>
        <Search />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <PageHeading title={config.title} description={config.description} />

        {isError ? (
          <GeneralError minimal className='h-auto py-12' />
        ) : data?.kind === 'stone' ? (
          <DataTable
            columns={stoneColumns}
            data={data.page.items}
            meta={data.page.meta}
            isFetching={isPending || isFetching}
            state={state}
            onStateChange={handleStateChange}
            emptyMessage={config.emptyMessage}
            toolbar={toolbar}
          />
        ) : (
          <DataTable
            columns={orderColumns}
            data={data?.page.items ?? []}
            meta={data?.page.meta}
            isFetching={isPending || isFetching}
            state={state}
            onStateChange={handleStateChange}
            emptyMessage={config.emptyMessage}
            toolbar={toolbar}
          />
        )}
      </Main>

      {/* The dialogs belong to the features that own the action, so a queue
        cannot drift from the screen the same action is performed on. */}
      {pending?.slug === 'identification' && (
        <AddStoneDialog
          open
          onOpenChange={(isOpen) => !isOpen && setPending(null)}
          order={pending.order}
        />
      )}

      {pending?.slug === 'billing' && (
        <GenerateBillDialog
          open
          onOpenChange={(isOpen) => !isOpen && setPending(null)}
          order={pending.order}
        />
      )}

      {pending?.slug === 'findings' && (
        <ReportMutateDialog
          open
          onOpenChange={(isOpen) => !isOpen && setPending(null)}
          currentRow={null}
          initialStone={pending.stone.id}
        />
      )}

      {/* Edit and Finalize act on a report the row knows only the id of, so
        each is wrapped in the fetch for the rest of it. */}
      {pending?.slug === 'findings-edit' && (
        <WithReport
          id={pending.reportId}
          render={(report) => (
            <ReportMutateDialog
              open
              onOpenChange={(isOpen) => !isOpen && setPending(null)}
              currentRow={report}
            />
          )}
        />
      )}

      {pending?.slug === 'findings-finalize' && (
        <WithReport
          id={pending.reportId}
          render={(report) => (
            <FinalizeReportDialog
              open
              onOpenChange={(isOpen) => !isOpen && setPending(null)}
              currentRow={report}
            />
          )}
        />
      )}

      {pending?.slug === 'certification' && (
        <IssueCertificateDialog
          open
          onOpenChange={(isOpen) => !isOpen && setPending(null)}
          initialStone={pending.stone.id}
        />
      )}
    </>
  )
}

/**
 * Fetch one report, then render the dialog that needs it.
 *
 * A component rather than a hook in `WorklistContent`, because the fetch must
 * not run until a row is actually pressed — a hook there would fire on every
 * render of every queue. Renders nothing while loading: the dialog is the
 * feedback, and a spinner behind a button that is about to open one reads as a
 * stall rather than as progress.
 */
function WithReport({
  id,
  render,
}: {
  id: number
  render: (report: IdentificationReport) => React.ReactNode
}) {
  const { data } = useQuery(reportQuery(id))
  return data ? <>{render(data)}</> : null
}
