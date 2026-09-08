import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { SignOutDialog } from './sign-out-dialog'

const navigate = vi.fn()
const reset = vi.fn()

const MOCK_HREF = 'https://app.test/dashboard?tab=1'

/**
 * The store is reached two ways: components call `useAuthStore()` as a hook,
 * while `logout()` in the API layer calls `useAuthStore.getState()`. Both have
 * to be stubbed or the sign-out handler throws before it navigates.
 *
 * `refreshToken` is empty on purpose — `logout()` skips the network call when
 * there is no token to revoke, so this test needs no HTTP mock while still
 * exercising the real sign-out path.
 */
const authState = { auth: { reset, refreshToken: '' } }

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: Object.assign(() => authState, {
    getState: () => authState,
  }),
}))

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    useNavigate: () => navigate,
    useLocation: () => ({ href: MOCK_HREF }),
  }
})

/**
 * Render inside a fresh QueryClient.
 *
 * The dialog clears the cache on sign-out via `useQueryClient()`, which throws
 * outside a provider. A new client per test keeps the cases isolated.
 */
async function renderDialog() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <SignOutDialog open onOpenChange={vi.fn()} />
    </QueryClientProvider>
  )
}

describe('SignOutDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls auth.reset and navigates to sign-in with current location as redirect', async () => {
    const { getByRole } = await renderDialog()

    await userEvent.click(getByRole('button', { name: /^Sign out$/i }))

    await vi.waitFor(() => expect(reset).toHaveBeenCalledOnce())
    expect(navigate).toHaveBeenCalledWith({
      to: '/sign-in',
      search: { redirect: MOCK_HREF },
      replace: true,
    })
  })

  it('does not call reset or navigate when Cancel is clicked', async () => {
    const { getByRole } = await renderDialog()

    await userEvent.click(getByRole('button', { name: /^Cancel$/i }))

    expect(reset).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
  })
})
