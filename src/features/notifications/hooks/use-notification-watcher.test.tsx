import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { useNotificationWatcher } from './use-notification-watcher'

const get = vi.fn()
const post = vi.fn()
let pathname = '/'

vi.mock('@/lib/api', () => ({
  api: {
    get: (...args: unknown[]) => get(...args),
    post: (...args: unknown[]) => post(...args),
  },
}))

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    useRouter: () => ({ history: { push: vi.fn() } }),
    useLocation: ({
      select,
    }: {
      select: (l: { pathname: string }) => string
    }) => select({ pathname }),
  }
})

function serveSummary(byLink: Record<string, number>) {
  const count = Object.values(byLink).reduce((a, b) => a + b, 0)
  get.mockResolvedValue({ data: { count, by_link: byLink, latest: null } })
}

function Watcher() {
  useNotificationWatcher()
  return null
}

async function renderWatcher() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <Watcher />
    </QueryClientProvider>
  )
}

describe('useNotificationWatcher', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    post.mockResolvedValue({ data: { updated: 1 } })
  })

  it("marks the open page's notifications read", async () => {
    pathname = '/worklists/billing'
    serveSummary({ '/worklists/billing': 2, '/orders': 1 })

    await renderWatcher()

    await vi.waitFor(() =>
      expect(post).toHaveBeenCalledWith('/notifications/read-all', {
        link: '/worklists/billing',
      })
    )
    expect(post).toHaveBeenCalledTimes(1)
  })

  it('leaves notifications for other pages alone', async () => {
    pathname = '/customers'
    serveSummary({ '/worklists/billing': 2 })

    await renderWatcher()

    await vi.waitFor(() => expect(get).toHaveBeenCalled())
    expect(post).not.toHaveBeenCalled()
  })
})
