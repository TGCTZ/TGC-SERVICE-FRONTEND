import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { env } from '@/env'
import { useAuthStore } from '@/stores/auth-store'

/**
 * Pre-configured Axios instance for talking to the backend API.
 *
 * Feature code should import this `api` client rather than calling `axios`
 * directly, so base URL, auth headers, and error handling stay consistent.
 *
 * `VITE_API_URL` already includes the version segment (e.g.
 * `http://localhost:8000/api/v1`), so callers use clean paths: `/products`.
 */
export const api = axios.create({
  baseURL: env.VITE_API_URL,
  headers: { Accept: 'application/json' },
})

/** Request config extended with our one-shot retry marker. */
type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

/**
 * Append the trailing slash Django expects.
 *
 * Django resolves `/auth/login/` but not `/auth/login`. `APPEND_SLASH` only
 * redirects safe methods; a POST to the unslashed path fails outright rather
 * than redirecting, because the body cannot be carried across a 301.
 *
 * Applied centrally rather than at each call site: a missed slash surfaces only
 * on whichever endpoint nobody exercised, whereas an error here is immediate
 * and global. Absolute URLs and paths that already end in a slash are left
 * alone; query strings are appended by Axios afterwards, so they are not a
 * concern here.
 */
function withTrailingSlash(path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  const [pathname, ...rest] = path.split('?')
  if (pathname === '' || pathname.endsWith('/')) return path
  return [`${pathname}/`, ...rest].join('?')
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (config.url) {
    config.url = withTrailingSlash(config.url)
  }

  const { accessToken } = useAuthStore.getState().auth
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

/**
 * In-flight refresh, shared by every request that 401s at the same time.
 *
 * Without this, a page issuing five parallel requests would fire five refreshes
 * and invalidate its own token. Concurrent callers await one promise.
 */
let refreshPromise: Promise<string> | null = null

/**
 * Exchange the refresh token for a fresh pair.
 *
 * The refresh token travels in the body, not the `Authorization` header: it is
 * the durable credential and is deliberately never attached to ordinary
 * requests. A bare `axios` call is used rather than the `api` instance so the
 * request skips this module's interceptors and cannot recurse.
 *
 * The API rotates refresh tokens and blacklists the old one, so **both** values
 * from the response must be stored. Keeping the previous refresh token would
 * leave the session working until the next refresh, then fail with a
 * blacklisted-token error roughly an access-token lifetime later.
 *
 * @throws When no refresh token is held, or the API rejects the one held.
 */
async function refreshAccessToken(): Promise<string> {
  const { refreshToken } = useAuthStore.getState().auth
  if (!refreshToken) {
    throw new Error('No refresh token available')
  }

  const res = await axios.post(
    `${env.VITE_API_URL ?? ''}/auth/refresh/`,
    { refresh: refreshToken },
    { headers: { Accept: 'application/json' } }
  )

  const access: string = res.data.access
  // Rotation is enabled server-side, but tolerate a deployment where it is not:
  // an absent `refresh` means the token we sent is still the current one.
  const refresh: string = res.data.refresh ?? refreshToken

  useAuthStore.getState().auth.setTokens(access, refresh)
  return access
}

function getRefreshPromise(): Promise<string> {
  refreshPromise ??= refreshAccessToken().finally(() => {
    refreshPromise = null
  })
  return refreshPromise
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined
    const { refreshToken, reset } = useAuthStore.getState().auth

    // Only attempt a refresh when a refresh token is actually held, and only
    // once per request (`_retry`) to avoid infinite loops. The refresh endpoint
    // itself is excluded, otherwise a dead session loops.
    const isRefreshCall = original?.url?.includes('/auth/refresh') ?? false

    const shouldRefresh =
      error.response?.status === 401 &&
      Boolean(refreshToken) &&
      original &&
      !original._retry &&
      !isRefreshCall

    if (shouldRefresh) {
      original._retry = true
      try {
        const token = await getRefreshPromise()
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      } catch {
        // Refresh failed - the session is genuinely over. The global query
        // error handler in `main.tsx` surfaces the toast and redirect.
        reset()
      }
    }

    return Promise.reject(error)
  }
)
