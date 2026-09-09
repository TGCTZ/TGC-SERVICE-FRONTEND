import { AxiosError } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fieldErrors, handleServerError } from './handle-server-error'

const toastError = vi.hoisted(() => vi.fn())

vi.mock('sonner', () => ({
  toast: {
    error: toastError,
  },
}))

/** Build an Axios error carrying an API response body. */
function apiError(status: number, data: unknown) {
  const error = new AxiosError('Request failed')
  error.response = { status, data } as AxiosError['response']
  return error
}

beforeEach(() => {
  vi.mocked(toastError).mockClear()
})

describe('handleServerError', () => {
  it('shows a generic message when the error is not recognised', () => {
    handleServerError(new Error('network'))

    expect(toastError).toHaveBeenCalledWith('Something went wrong!')
  })

  it('maps a plain object with status 204 to the no-content message', () => {
    handleServerError({ status: 204 })

    expect(toastError).toHaveBeenCalledWith('No content.')
  })

  it('surfaces the API detail message verbatim', () => {
    // A business rule explaining itself is the most useful sentence available.
    handleServerError(
      apiError(400, { detail: 'Order ORD-2026-0001 already has a bill.' })
    )

    expect(toastError).toHaveBeenCalledWith(
      'Order ORD-2026-0001 already has a bill.'
    )
  })

  it('surfaces a detail message on a permission refusal', () => {
    handleServerError(
      apiError(403, {
        detail: 'You do not have permission to perform this action.',
      })
    )

    expect(toastError).toHaveBeenCalledWith(
      'You do not have permission to perform this action.'
    )
  })

  it('falls back to the first field message when there is no detail', () => {
    handleServerError(apiError(400, { email: ['Already taken.'] }))

    expect(toastError).toHaveBeenCalledWith('Already taken.')
  })

  it('falls back to the generic message when the body carries nothing usable', () => {
    handleServerError(apiError(500, {}))

    expect(toastError).toHaveBeenCalledWith('Something went wrong!')
  })

  it('falls back to the generic message when detail is an empty string', () => {
    handleServerError(apiError(400, { detail: '' }))

    expect(toastError).toHaveBeenCalledWith('Something went wrong!')
  })

  it('logs the error to the console in development', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const err = new Error('logged')

    handleServerError(err)

    expect(log).toHaveBeenCalledTimes(1)
    expect(log).toHaveBeenCalledWith(err)

    log.mockRestore()
  })

  it('does not log the error to the console in production', () => {
    vi.stubEnv('DEV', false)

    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const err = new Error('not logged')

    handleServerError(err)

    expect(log).not.toHaveBeenCalled()

    log.mockRestore()
  })
})

describe('fieldErrors', () => {
  it('extracts field-keyed validation messages', () => {
    const fields = fieldErrors(
      apiError(400, { email: ['Already taken.'], username: ['Too short.'] })
    )

    expect(fields).toEqual({
      email: ['Already taken.'],
      username: ['Too short.'],
    })
  })

  it('returns null for a business-rule refusal', () => {
    // `detail` and field errors share status 400; only the shape tells them
    // apart, and a refusal has no field to attach itself to.
    expect(fieldErrors(apiError(400, { detail: 'No price set.' }))).toBeNull()
  })

  it('returns null for a status other than 400', () => {
    expect(fieldErrors(apiError(500, { email: ['nope'] }))).toBeNull()
  })

  it('returns null for anything that is not an Axios error', () => {
    expect(fieldErrors(new Error('boom'))).toBeNull()
  })
})
