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

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
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
 * Exchange the current token for a fresh one.
 *
 * Sanctum has no refresh-token concept: the endpoint mints a new token and
 * revokes the one that authenticated the request, so the stored token must be
 * replaced with the response value.
 */
async function refreshAccessToken(): Promise<string> {
  const { accessToken } = useAuthStore.getState().auth

  const res = await axios.post(`${env.VITE_API_URL ?? ''}/auth/refresh`, null, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  })

  const token: string = res.data.token
  useAuthStore.getState().auth.setAccessToken(token)
  return token
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
    const { accessToken, reset } = useAuthStore.getState().auth

    // Only attempt a refresh for an authenticated request failing with 401,
    // and only once per request (`_retry`) to avoid infinite loops. The
    // refresh endpoint itself is excluded, otherwise a dead session loops.
    const isRefreshCall = original?.url?.includes('/auth/refresh') ?? false

    const shouldRefresh =
      error.response?.status === 401 &&
      Boolean(accessToken) &&
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
