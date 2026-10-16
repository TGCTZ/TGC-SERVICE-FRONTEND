import { beforeEach, describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'
import { useAuthStore } from '@/stores/auth-store'
import { UserIdentity } from './user-menu-content'

describe('UserIdentity', () => {
  beforeEach(() => {
    useAuthStore.getState().auth.setUser(null)
  })

  it('shows the signed-in user’s assigned roles in a badge', async () => {
    useAuthStore.getState().auth.setUser({
      id: 1,
      first_name: 'Neema',
      last_name: 'Kimaro',
      full_name: 'Neema Kimaro',
      username: 'neema',
      email: 'neema@example.com',
      avatar: null,
      is_active: true,
      roles: ['gemmologist', 'lab_manager'],
      permissions: [],
      must_change_password: false,
      must_complete_profile: false,
    })

    const screen = await render(<UserIdentity />)

    await expect
      .element(screen.getByTitle('Role: Gemmologist · Lab Manager'))
      .toBeInTheDocument()
  })
})
