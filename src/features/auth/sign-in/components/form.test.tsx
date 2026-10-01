import { AxiosError, AxiosHeaders } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, type RenderResult } from 'vitest-browser-react'
import { type Locator, userEvent } from 'vitest/browser'
import { UserAuthForm } from './form'

const FORM_MESSAGES = {
  emailEmpty: 'Please enter your email.',
  passwordEmpty: 'Please enter your password.',
} as const

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  login: vi.fn(),
}))

/**
 * `login()` owns the whole sign-in transaction — it calls the API and hydrates
 * the auth store itself — so the form is tested against that one seam rather
 * than against a hand-built store mock. A store mock would also have to provide
 * `getState`, which `login` and every Axios interceptor call.
 */
vi.mock('@/features/auth/data/api', () => ({
  login: mocks.login,
}))

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    useNavigate: () => mocks.navigate,
  }
})

/** A user in the shape the API returns it. */
function signedInUser() {
  return {
    id: 1,
    first_name: 'Neema',
    last_name: 'Kimaro',
    full_name: 'Neema Kimaro',
    username: 'neema',
    email: 'a@b.com',
    avatar: null,
    is_active: true,
    roles: ['receptionist'],
    permissions: ['orders.view_order'],
  }
}

/**
 * A rejected sign-in as DRF sends it: 401 with `detail` at the response root.
 *
 * Not 422 with an `errors` envelope — that was the previous backend's shape,
 * and a fixture in the old shape would let a regression pass unnoticed.
 */
function unauthorized() {
  return new AxiosError(
    'Request failed with status code 401',
    'ERR_BAD_REQUEST',
    undefined,
    undefined,
    {
      status: 401,
      statusText: 'Unauthorized',
      headers: new AxiosHeaders(),
      config: { headers: new AxiosHeaders() },
      data: { detail: 'No active account found with the given credentials' },
    }
  )
}

describe('UserAuthForm', () => {
  describe('Rendering without redirectTo', () => {
    let screen: RenderResult
    let emailInput: Locator
    let passwordInput: Locator
    let signInButton: Locator

    beforeEach(async () => {
      vi.clearAllMocks()
      mocks.login.mockResolvedValue(signedInUser())
      screen = await render(<UserAuthForm />)
      /**
       * Field labels carry a visually hidden "(required)" suffix from
       * `RequiredMark`, so the accessible name is `Email (required)` rather
       * than `Email`. The leading anchor still keeps `Password` from matching
       * `Confirm Password`; a trailing `$` would reject every required field.
       */
      emailInput = screen.getByRole('textbox', { name: /^Email/i })
      passwordInput = screen.getByLabelText(/^Password/i)
      signInButton = screen.getByRole('button', { name: /^Sign in$/i })
    })

    it('renders fields and the submit button', async () => {
      await expect.element(emailInput).toBeInTheDocument()
      await expect.element(passwordInput).toBeInTheDocument()
      await expect.element(signInButton).toBeInTheDocument()
    })

    it('shows validation messages when submitting empty form', async () => {
      await userEvent.click(signInButton)

      await expect
        .element(screen.getByText(FORM_MESSAGES.emailEmpty))
        .toBeInTheDocument()
      await expect
        .element(screen.getByText(FORM_MESSAGES.passwordEmpty))
        .toBeInTheDocument()
    })

    it('authenticates and navigates to default route on success', async () => {
      await userEvent.fill(emailInput, 'a@b.com')
      await userEvent.fill(passwordInput, '1234567')

      await userEvent.click(signInButton)

      await vi.waitFor(() => expect(mocks.login).toHaveBeenCalledOnce())
      expect(mocks.login).toHaveBeenCalledWith({
        email: 'a@b.com',
        password: '1234567',
      })

      await vi.waitFor(() =>
        expect(mocks.navigate).toHaveBeenCalledWith({ to: '/', replace: true })
      )
    })

    it('puts a rejected sign-in on the email field, not in a toast', async () => {
      mocks.login.mockRejectedValueOnce(unauthorized())

      await userEvent.fill(emailInput, 'a@b.com')
      await userEvent.fill(passwordInput, 'wrong-password')
      await userEvent.click(signInButton)

      await expect
        .element(
          screen.getByText('No active account found with the given credentials')
        )
        .toBeInTheDocument()
      expect(mocks.navigate).not.toHaveBeenCalled()
    })
  })

  it('navigates to redirectTo when provided', async () => {
    vi.clearAllMocks()
    mocks.login.mockResolvedValue(signedInUser())

    const { getByRole, getByLabelText } = await render(
      <UserAuthForm redirectTo='/settings' />
    )

    await userEvent.fill(getByRole('textbox', { name: /Email/i }), 'a@b.com')
    await userEvent.fill(getByLabelText(/^Password/i), '1234567')

    await userEvent.click(getByRole('button', { name: /Sign in/i }))

    await vi.waitFor(() => expect(mocks.login).toHaveBeenCalledOnce())

    await vi.waitFor(() =>
      expect(mocks.navigate).toHaveBeenCalledWith({
        to: '/settings',
        replace: true,
      })
    )
  })
})
