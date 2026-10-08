import type { AxiosResponse } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/stores/auth-store'
import { api } from '@/lib/api'
import { logout } from './api'

describe('logout', () => {
  beforeEach(() => useAuthStore.getState().auth.reset())
  afterEach(() => vi.restoreAllMocks())

  it('cannot clear a new login when an older logout request completes', async () => {
    vi.spyOn(api, 'post').mockResolvedValue({ data: null } as AxiosResponse)
    useAuthStore.getState().auth.setTokens('old-access', 'old-refresh')

    const oldLogout = logout()
    expect(useAuthStore.getState().auth.accessToken).toBe('')

    useAuthStore.getState().auth.setTokens('new-access', 'new-refresh')
    await oldLogout

    expect(useAuthStore.getState().auth.accessToken).toBe('new-access')
    expect(useAuthStore.getState().auth.refreshToken).toBe('new-refresh')
  })
})
