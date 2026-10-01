import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { NotificationBell } from './notification-bell'

const push = vi.fn()
const get = vi.fn()
const post = vi.fn()

vi.mock('@/lib/api', () => ({
  api: {
    get: (...args: unknown[]) => get(...args),
    post: (...args: unknown[]) => post(...args),
  },
}))

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return { ...actual, useRouter: () => ({ history: { push } }) }
})

const unreadItem = {
  id: 7,
  kind: 'ready_to_bill',
  title: 'Order ORD-26-00001 is ready to bill',
  body: 'All 2 stone(s) have been identified.',
  link: '/worklists/billing',
  created_at: '2026-09-25T08:00:00Z',
  read_at: null,
  is_read: false,
}

/** Answer each endpoint the bell reads with a fixed inbox of one unread item. */
function serveInbox(count: number) {
  get.mockImplementation(async (url: string) => {
    if (url === '/notifications/unread-summary')
      return {
        data: {
          count,
          by_link: count ? { [unreadItem.link]: count } : {},
          latest: count ? unreadItem : null,
        },
      }
    return {
      data: {
        count: count,
        next: null,
        previous: null,
        results: count ? [unreadItem] : [],
      },
    }
  })
}

async function renderBell() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <NotificationBell />
    </QueryClientProvider>
  )
}

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    post.mockResolvedValue({ data: {} })
  })

  it('shows the unread count on the bell', async () => {
    serveInbox(3)
    const screen = await renderBell()

    await expect
      .element(screen.getByRole('button', { name: 'Notifications, 3 unread' }))
      .toBeInTheDocument()
  })

  it('offers no badge and an empty panel when caught up', async () => {
    serveInbox(0)
    const screen = await renderBell()

    await userEvent.click(screen.getByRole('button', { name: 'Notifications' }))

    await expect.element(screen.getByText(/all caught up/i)).toBeInTheDocument()
  })

  it('marks an item read and follows its link when clicked', async () => {
    serveInbox(1)
    const screen = await renderBell()

    await userEvent.click(
      screen.getByRole('button', { name: 'Notifications, 1 unread' })
    )
    await userEvent.click(screen.getByText(unreadItem.title))

    expect(post).toHaveBeenCalledWith('/notifications/7/read')
    expect(push).toHaveBeenCalledWith('/worklists/billing')
  })
})
