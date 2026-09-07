import { create } from 'zustand'
import { getCookie, setCookie, removeCookie } from '@/lib/cookies'

const ACCESS_TOKEN = 'alphadashboard_token'

/**
 * The authenticated user, mirroring the API's `UserResource`.
 *
 * `roles` and `permissions` are flat name arrays and drive every UI gate — see
 * `@/lib/authz` and the `<Can>` component.
 */
export interface AuthUser {
  id: number
  first_name: string
  last_name: string
  full_name: string
  username: string
  email: string
  avatar_url: string | null
  is_active: boolean
  roles: string[]
  permissions: string[]
}

interface AuthState {
  auth: {
    user: AuthUser | null
    setUser: (user: AuthUser | null) => void
    accessToken: string
    setAccessToken: (accessToken: string) => void
    resetAccessToken: () => void
    reset: () => void
  }
}

/**
 * Global authentication state: the current user and their bearer token.
 *
 * The token is mirrored into a cookie so a refresh keeps the session; the
 * **user is not**, and is null until the route guard rehydrates it from the
 * API. Read `auth.user` expecting that null — a component that assumes a user
 * is present will crash on a hard refresh.
 *
 * Permission checks belong in `@/lib/authz`, which reads this store. Do not
 * compare `auth.user.roles` directly: role names change per project, the
 * permission names the API enforces do not.
 *
 * @example
 * const user = useAuthStore((s) => s.auth.user)
 * useAuthStore.getState().auth.reset()  // sign out, clearing the cookie
 */
export const useAuthStore = create<AuthState>()((set) => {
  // The token is persisted in a cookie so a page refresh keeps the session.
  const cookieState = getCookie(ACCESS_TOKEN)
  const initToken = cookieState ? JSON.parse(cookieState) : ''

  return {
    auth: {
      user: null,
      setUser: (user) =>
        set((state) => ({ ...state, auth: { ...state.auth, user } })),
      accessToken: initToken,
      setAccessToken: (accessToken) =>
        set((state) => {
          setCookie(ACCESS_TOKEN, JSON.stringify(accessToken))
          return { ...state, auth: { ...state.auth, accessToken } }
        }),
      resetAccessToken: () =>
        set((state) => {
          removeCookie(ACCESS_TOKEN)
          return { ...state, auth: { ...state.auth, accessToken: '' } }
        }),
      reset: () =>
        set((state) => {
          removeCookie(ACCESS_TOKEN)
          return {
            ...state,
            auth: { ...state.auth, user: null, accessToken: '' },
          }
        }),
    },
  }
})
