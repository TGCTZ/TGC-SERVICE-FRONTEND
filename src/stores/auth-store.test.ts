import { clearCookies } from '@/test-utils/cookies'
import { beforeEach, describe, expect, it, vi } from 'vitest'

async function importAuthStore() {
  const { useAuthStore } = await import('./auth-store')
  return useAuthStore
}

const sampleUser = {
  id: 1,
  first_name: 'Test',
  last_name: 'User',
  full_name: 'Test User',
  username: 'testuser',
  email: 'test@example.com',
  avatar: null,
  is_active: true,
  roles: ['admin'],
  permissions: ['catalog.view_product'],
}

describe('useAuthStore', () => {
  beforeEach(() => {
    clearCookies()
    vi.resetModules()
  })

  it('starts with empty tokens when nothing is persisted', async () => {
    const useAuthStore = await importAuthStore()

    expect(useAuthStore.getState().auth.accessToken).toBe('')
    expect(useAuthStore.getState().auth.refreshToken).toBe('')
    expect(useAuthStore.getState().auth.user).toBeNull()
  })

  it('persists both tokens so a new store instance reads them back', async () => {
    const useAuthStore = await importAuthStore()
    useAuthStore.getState().auth.setTokens('access-token', 'refresh-token')

    vi.resetModules()
    const useAuthStoreAfterReload = await importAuthStore()

    expect(useAuthStoreAfterReload.getState().auth.accessToken).toBe(
      'access-token'
    )
    expect(useAuthStoreAfterReload.getState().auth.refreshToken).toBe(
      'refresh-token'
    )
  })

  it('replaces the refresh token on every setTokens call', async () => {
    // The API rotates refresh tokens and blacklists the previous one, so a
    // stale value surviving a refresh would fail on the *next* refresh rather
    // than immediately - the failure this assertion exists to catch.
    const useAuthStore = await importAuthStore()
    useAuthStore.getState().auth.setTokens('access-1', 'refresh-1')
    useAuthStore.getState().auth.setTokens('access-2', 'refresh-2')

    vi.resetModules()
    const useAuthStoreAfterReload = await importAuthStore()

    expect(useAuthStoreAfterReload.getState().auth.refreshToken).toBe(
      'refresh-2'
    )
  })

  it('clears persisted access token when resetAccessToken is used', async () => {
    const useAuthStore = await importAuthStore()
    useAuthStore.getState().auth.setTokens('to-clear', 'refresh-kept')
    useAuthStore.getState().auth.resetAccessToken()

    vi.resetModules()
    const useAuthStoreAfterReload = await importAuthStore()

    expect(useAuthStoreAfterReload.getState().auth.accessToken).toBe('')
    // Only the access token is dropped: this is a re-authentication, not a
    // sign-out.
    expect(useAuthStoreAfterReload.getState().auth.refreshToken).toBe(
      'refresh-kept'
    )
  })

  it('updates the signed-in user via setUser', async () => {
    const useAuthStore = await importAuthStore()

    useAuthStore.getState().auth.setUser({ ...sampleUser })

    expect(useAuthStore.getState().auth.user).toEqual(sampleUser)
  })

  it('reset clears user and both tokens and drops persistence', async () => {
    const useAuthStore = await importAuthStore()
    useAuthStore.getState().auth.setTokens('will-be-cleared', 'also-cleared')
    useAuthStore.getState().auth.setUser({ ...sampleUser })

    useAuthStore.getState().auth.reset()

    expect(useAuthStore.getState().auth.user).toBeNull()
    expect(useAuthStore.getState().auth.accessToken).toBe('')
    expect(useAuthStore.getState().auth.refreshToken).toBe('')

    vi.resetModules()
    const useAuthStoreAfterReload = await importAuthStore()

    expect(useAuthStoreAfterReload.getState().auth.user).toBeNull()
    expect(useAuthStoreAfterReload.getState().auth.accessToken).toBe('')
    // A sign-out that leaves the 14-day credential on the machine is not a
    // sign-out.
    expect(useAuthStoreAfterReload.getState().auth.refreshToken).toBe('')
  })
})
