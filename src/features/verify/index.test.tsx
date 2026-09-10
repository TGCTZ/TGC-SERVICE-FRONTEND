import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { type PublicCertificate } from './data/api'
import { VerifyCertificate } from './index'

const VALID_TOKEN = 'a'.repeat(64)

const mocks = vi.hoisted(() => ({
  token: { current: 'a'.repeat(64) },
  fetch: vi.fn(),
}))

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    getRouteApi: () => ({ useParams: () => ({ token: mocks.token.current }) }),
  }
})

/**
 * Mocked at the query, not at axios: what matters here is which of the three
 * outcomes the page renders, and the request itself is the one thing a public
 * page must never make against a real backend during a test run.
 */
vi.mock('./data/api', () => ({
  verifyCertificateQuery: (token: string) => ({
    queryKey: ['verify', token],
    retry: false,
    queryFn: () => mocks.fetch(token),
  }),
}))

function certificate(
  overrides: Partial<PublicCertificate> = {}
): PublicCertificate {
  return {
    certificate_number: 'CERT-2026-0004',
    status: 'issued',
    is_valid: true,
    issued_at: '2026-09-10T08:29:45Z',
    stone_type_snapshot: 'Amethyst',
    weight_snapshot: '2.150',
    color_snapshot: 'Purple',
    origin_snapshot: 'Arusha',
    gemmologist: 'Neema Kimaro',
    ...overrides,
  }
}

async function renderPage(token = VALID_TOKEN) {
  mocks.token.current = token
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return await render(
    <QueryClientProvider client={client}>
      <VerifyCertificate />
    </QueryClientProvider>
  )
}

describe('VerifyCertificate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('confirms a certificate that still stands', async () => {
    mocks.fetch.mockResolvedValue(certificate())

    const screen = await renderPage()

    await expect
      .element(screen.getByRole('heading', { name: 'Verified' }))
      .toBeInTheDocument()
    await expect.element(screen.getByText('CERT-2026-0004')).toBeInTheDocument()
    await expect.element(screen.getByText('Amethyst')).toBeInTheDocument()
  })

  it('shows a revoked certificate as withdrawn, with its details intact', async () => {
    // The holder needs to see that the document they have is the one that was
    // withdrawn - hiding the details would leave them unable to tell.
    mocks.fetch.mockResolvedValue(
      certificate({ status: 'revoked', is_valid: false })
    )

    const screen = await renderPage()

    // By role: the sentence below the heading also contains "withdrawn".
    await expect
      .element(screen.getByRole('heading', { name: 'Withdrawn' }))
      .toBeInTheDocument()
    await expect.element(screen.getByText('CERT-2026-0004')).toBeInTheDocument()
    await expect.element(screen.getByText('Amethyst')).toBeInTheDocument()
  })

  it('answers an unknown token without confirming anything', async () => {
    mocks.fetch.mockResolvedValue(null)

    const screen = await renderPage('0'.repeat(64))

    await expect
      .element(screen.getByText('No certificate matches this code'))
      .toBeInTheDocument()
  })

  it('rejects a malformed token locally, and identically', async () => {
    // Same wording as a token that never existed, and no request at all: a
    // difference in either would help someone guessing tokens.
    const screen = await renderPage('not-a-token')

    await expect
      .element(screen.getByText('No certificate matches this code'))
      .toBeInTheDocument()
    expect(mocks.fetch).not.toHaveBeenCalled()
  })
})
