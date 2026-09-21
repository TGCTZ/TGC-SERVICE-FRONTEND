import { type ColumnDef } from '@tanstack/react-table'
import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'
import { DataTable, type TableQueryState } from './data-table'

/**
 * Responsive regression guard for the shared list surface.
 *
 * Every list screen renders through `<DataTable>`, so the mobile contract is
 * worth pinning here once rather than per feature. These run in a real
 * Chromium viewport — `page.viewport()` resizes the actual window, so the
 * media query behind `useIsMobile` and the CSS breakpoints are the real ones,
 * not a mocked `matchMedia`.
 *
 * The width below is an iPhone SE, the narrowest screen worth supporting.
 */
const MOBILE = { width: 375, height: 667 }
const DESKTOP = { width: 1280, height: 800 }

type Row = { id: number; bill_number: string; customer_name: string }

const columns: ColumnDef<Row>[] = [
  {
    accessorKey: 'bill_number',
    header: () => <span>Bill</span>,
    meta: { label: 'Bill' },
    cell: ({ row }) => <span>{row.original.bill_number}</span>,
  },
  {
    accessorKey: 'customer_name',
    header: () => <span>Customer</span>,
    meta: { label: 'Customer' },
    cell: ({ row }) => <span>{row.original.customer_name}</span>,
  },
]

const data: Row[] = [
  { id: 1, bill_number: 'B-001', customer_name: 'Asha Mollel' },
  { id: 2, bill_number: 'B-002', customer_name: 'Juma Kileo' },
]

const state: TableQueryState = { page: 1, perPage: 10, search: '' }

function renderTable(
  overrides: Partial<React.ComponentProps<typeof DataTable<Row>>> = {}
) {
  return render(
    <DataTable
      columns={columns}
      data={data}
      meta={{ current_page: 1, per_page: 10, last_page: 1, total: 2 }}
      isFetching={false}
      state={state}
      onStateChange={vi.fn()}
      {...overrides}
    />
  )
}

describe('DataTable responsiveness', () => {
  it('renders a real table on desktop', async () => {
    await page.viewport(DESKTOP.width, DESKTOP.height)
    const screen = await renderTable()

    await expect.element(screen.getByRole('table')).toBeInTheDocument()
  })

  it('renders labelled cards instead of a table on a phone', async () => {
    await page.viewport(MOBILE.width, MOBILE.height)
    const screen = await renderTable()

    // The card view must replace the table outright. Rendering both would
    // duplicate every row action in the accessibility tree.
    expect(screen.container.querySelector('table')).toBeNull()

    // Each value keeps its label, which is what horizontal scrolling loses.
    await expect.element(screen.getByText('Bill')).toBeInTheDocument()
    await expect.element(screen.getByText('B-001')).toBeInTheDocument()
    await expect.element(screen.getByText('Asha Mollel')).toBeInTheDocument()
  })

  it('does not overflow the viewport horizontally on a phone', async () => {
    await page.viewport(MOBILE.width, MOBILE.height)
    await renderTable()

    // The guard that actually matters: a page the user can scroll sideways is
    // the single most common mobile layout failure, and it is invisible in any
    // test that only asserts on the DOM.
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
      MOBILE.width
    )
  })

  it('exposes the row as a keyboard-activatable control when clickable', async () => {
    await page.viewport(MOBILE.width, MOBILE.height)
    const onRowClick = vi.fn()
    const screen = await renderTable({ onRowClick })

    const cards = screen.getByRole('button')
    await cards.first().click()

    expect(onRowClick).toHaveBeenCalledWith(data[0])
  })

  it('leaves the card inert when there is no detail view to open', async () => {
    await page.viewport(MOBILE.width, MOBILE.height)
    const screen = await renderTable()

    expect(screen.container.querySelectorAll('[role="button"]')).toHaveLength(0)
  })
})
