import { create } from 'zustand'
import { getCookie, setCookie, removeCookie } from '@/lib/cookies'

const ACCESS_TOKEN = 'tgc_access_token'
const REFRESH_TOKEN = 'tgc_refresh_token'

/**
 * The refresh cookie must outlive the access cookie.
 *
 * The shared default in `@/lib/cookies` is 7 days, but the API issues refresh
 * tokens with a 14-day lifetime (`JWT_REFRESH_DAYS`). Left on the default, the
 * cookie would expire a week before the token it holds and end the session
 * while the credential was still valid.
 */
const REFRESH_MAX_AGE = 60 * 60 * 24 * 14

/**
 * The authenticated user, mirroring the API's user serializer.
 *
 * `roles` and `permissions` are flat name arrays and drive every UI gate — see
 * `@/lib/authz` and the `<Can>` component. Permission names follow Django's
 * `<app>.<action>_<model>` convention, e.g. `catalog.view_product`.
 */
export interface AuthUser {
  id: number
  first_name: string
  last_name: string
  full_name: string
  username: string
  email: string
  avatar: string | null
  is_active: boolean
  roles: string[]
  permissions: string[]
}

interface AuthState {
  auth: {
    user: AuthUser | null
    setUser: (user: AuthUser | null) => void
    accessToken: string
    refreshToken: string
    /**
     * Store a freshly issued token pair.
     *
     * Always both. The API rotates refresh tokens and blacklists the old one on
     * every refresh, so storing a new access token without its matching refresh
     * token leaves a dead credential behind. The session then survives one more
     * access-token lifetime and fails on the *following* refresh, which is why
     * there is deliberately no setter for the access token alone.
     */
    setTokens: (accessToken: string, refreshToken: string) => void
    resetAccessToken: () => void
    reset: () => void
  }
}

/**
 * Global authentication state: the current user and their JWT token pair.
 *
 * Both tokens are mirrored into cookies so a refresh keeps the session; the
 * **user is not**, and is null until the route guard rehydrates it from the
 * API. Read `auth.user` expecting that null — a component that assumes a user
 * is present will crash on a hard refresh.
 *
 * Permission checks belong in `@/lib/authz`, which reads this store. Do not
 * compare `auth.user.roles` directly: role names change per project, the
 * permission names the API enforces do not.
 *
 * Both tokens are readable by JavaScript, so an XSS exposes the 14-day refresh
 * credential and not merely the short-lived access token. The stronger option
 * is an httpOnly cookie issued by the API, which requires CSRF handling and
 * `CORS_ALLOW_CREDENTIALS` on the server. Accepted deliberately for now.
 *
 * @example
 * const user = useAuthStore((s) => s.auth.user)
 * useAuthStore.getState().auth.reset()  // sign out, clearing both cookies
 */
export const useAuthStore = create<AuthState>()((set) => {
  // Both tokens are persisted in cookies so a page refresh keeps the session.
  const accessCookie = getCookie(ACCESS_TOKEN)
  const initAccessToken = accessCookie ? JSON.parse(accessCookie) : ''

  const refreshCookie = getCookie(REFRESH_TOKEN)
  const initRefreshToken = refreshCookie ? JSON.parse(refreshCookie) : ''

  return {
    auth: {
      user: null,
      setUser: (user) =>
        set((state) => ({ ...state, auth: { ...state.auth, user } })),
      accessToken: initAccessToken,
      refreshToken: initRefreshToken,
      setTokens: (accessToken, refreshToken) =>
        set((state) => {
          setCookie(ACCESS_TOKEN, JSON.stringify(accessToken))
          setCookie(
            REFRESH_TOKEN,
            JSON.stringify(refreshToken),
            REFRESH_MAX_AGE
          )
          return {
            ...state,
            auth: { ...state.auth, accessToken, refreshToken },
          }
        }),
      resetAccessToken: () =>
        set((state) => {
          removeCookie(ACCESS_TOKEN)
          return { ...state, auth: { ...state.auth, accessToken: '' } }
        }),
      reset: () =>
        set((state) => {
          removeCookie(ACCESS_TOKEN)
          removeCookie(REFRESH_TOKEN)
          return {
            ...state,
            auth: {
              ...state.auth,
              user: null,
              accessToken: '',
              refreshToken: '',
            },
          }
        }),
    },
  }
})
