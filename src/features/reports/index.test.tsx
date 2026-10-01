import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { type ReportSearch } from './data/schema'
import { ReportsPage } from './index'

const mocks = vi.hoisted(() => ({ fetch: vi.fn(), download: vi.fn() }))

vi.mock('./data/api', () => ({
  reportsQuery: (kind: string, search: ReportSearch) => ({
    queryKey: ['reports', kind, search],
    retry: false,
    queryFn: () => mocks.fetch(kind, search),
  }),
  downloadReport: (...args: unknown[]) => mocks.download(...args),
}))
vi.mock('@/components/layout/header', () => ({
  Header: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}))
vi.mock('@/components/config-drawer', () => ({ ConfigDrawer: () => null }))
vi.mock('@/components/profile-dropdown', () => ({
  ProfileDropdown: () => null,
}))
vi.mock('@/components/search', () => ({ Search: () => null }))
vi.mock('@/components/theme-switch', () => ({ ThemeSwitch: () => null }))

function result() {
  return {
    report: 'financial',
    title: 'Financial reports',
    range: {
      from: '2026-09-01',
      to: '2026-09-30',
      timezone: 'Africa/Dar_es_Salaam',
    },
    generated_at: '2026-10-01T09:00:00Z',
    section: 'billing',
    sections: [
      {
        key: 'billing',
        title: 'Billing summary',
        description: 'Bills issued in the period.',
        count: 3,
        missing_dates: 0,
        amounts: [{ currency: 'TZS', amount: '300.00' }],
        statuses: [],
      },
    ],
    columns: [
      { key: 'reference', label: 'Reference', kind: 'text' },
      { key: 'control_number', label: 'Control number', kind: 'text' },
    ],
    filters: {
      customers: [{ id: 4, label: 'Test Customer' }],
      stone_types: [],
    },
    page: {
      items: [
        { id: 1, reference: 'BILL-EXAMPLE', control_number: '991234567890' },
      ],
      meta: { current_page: 1, last_page: 3, per_page: 1, total: 3 },
    },
  }
}

async function renderPage(
  search: ReportSearch = {},
  kind: 'financial' | 'operational' = 'financial'
) {
  const onChange = vi.fn()
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const screen = await render(
    <QueryClientProvider client={client}>
      <ReportsPage
        kind={kind}
        search={{
          from: '2026-09-01',
          to: '2026-09-30',
          pageSize: 1,
          ...search,
        }}
        onChange={onChange}
      />
    </QueryClientProvider>
  )
  return { screen, onChange }
}

describe('Financial reports page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.fetch.mockResolvedValue(result())
    mocks.download.mockResolvedValue(undefined)
  })

  it('renders only authorized sections and whole-result counts alongside a paginated row', async () => {
    const { screen } = await renderPage()
    await expect.element(screen.getByText('BILL-EXAMPLE')).toBeInTheDocument()
    await expect.element(screen.getByText('991234567890')).toBeInTheDocument()
    await expect
      .element(screen.getByText('3 matching records'))
      .toBeInTheDocument()
    await expect
      .element(screen.getByText('Billing summary'))
      .toBeInTheDocument()
    await expect.element(screen.getByText('Date range')).toBeInTheDocument()
    await expect
      .element(screen.getByText(/Dates are inclusive/))
      .not.toBeInTheDocument()
    await expect
      .element(screen.getByText(/Exports include all matching/))
      .not.toBeInTheDocument()
    await expect
      .element(screen.getByText('Outstanding bills', { exact: true }))
      .not.toBeInTheDocument()
    await expect
      .element(screen.getByRole('button', { name: 'Excel', exact: true }))
      .toHaveClass(/bg-success/)
    await expect
      .element(screen.getByRole('button', { name: 'PDF', exact: true }))
      .toHaveClass(/bg-institutional/)
  })

  it('shows Customer only on Operational reports and omits providers', async () => {
    const financial = await renderPage()
    await expect
      .element(financial.screen.getByText('Customer', { exact: true }))
      .not.toBeInTheDocument()
    await expect
      .element(financial.screen.getByText('Payment provider', { exact: true }))
      .not.toBeInTheDocument()

    const operational = await renderPage({}, 'operational')
    await expect
      .element(operational.screen.getByText('Customer', { exact: true }))
      .toBeInTheDocument()
    await expect
      .element(
        operational.screen.getByText('Payment provider', { exact: true })
      )
      .not.toBeInTheDocument()
  })

  it('passes effective dates and filters to exports without limiting them to the visible row', async () => {
    const { screen } = await renderPage({ status: 'paid' })
    await expect.element(screen.getByText('BILL-EXAMPLE')).toBeInTheDocument()
    await screen.getByRole('button', { name: 'Excel', exact: true }).click()
    expect(mocks.download).toHaveBeenCalledWith(
      'financial',
      expect.objectContaining({
        from: '2026-09-01',
        to: '2026-09-30',
        status: 'paid',
      }),
      'xlsx'
    )
  })

  it('rejects a reversed range without making a report request', async () => {
    const { screen } = await renderPage({
      from: '2026-10-01',
      to: '2026-09-30',
    })
    await expect
      .element(screen.getByText('Check the date range'))
      .toBeInTheDocument()
    expect(mocks.fetch).not.toHaveBeenCalled()
    await expect
      .element(screen.getByRole('button', { name: 'PDF', exact: true }))
      .toBeDisabled()
  })

  it('explains the export limit rather than silently downloading a partial report', async () => {
    const data = result()
    data.sections[0].count = 10001
    mocks.fetch.mockResolvedValue(data)
    const { screen } = await renderPage()
    await expect
      .element(screen.getByText('Narrow the filters to export'))
      .toBeInTheDocument()
    await expect
      .element(screen.getByRole('button', { name: 'Excel', exact: true }))
      .toBeDisabled()
  })

  it('offers a retry after a report failure', async () => {
    mocks.fetch.mockRejectedValueOnce(new Error('Network unavailable'))
    const { screen } = await renderPage()
    await expect
      .element(screen.getByText('Could not load the report'))
      .toBeInTheDocument()
    await screen.getByRole('button', { name: 'Retry', exact: true }).click()
    await expect.element(screen.getByText('BILL-EXAMPLE')).toBeInTheDocument()
  })
})
