import { z } from 'zod'
import { queryOptions } from '@tanstack/react-query'
import { useAuthStore, type AuthUser } from '@/stores/auth-store'
import { api } from '@/lib/api'

/**
 * Subset of the API's UserResource that the client actually relies on.
 *
 * `.loose()` keeps the many extra profile fields the API returns instead of
 * stripping them, while still guaranteeing the shape we depend on.
 */
export const authUserSchema = z
  .object({
    id: z.number(),
    first_name: z.string(),
    last_name: z.string(),
    full_name: z.string(),
    username: z.string(),
    email: z.string(),
    avatar: z.string().nullable().default(null),
    is_active: z.boolean().default(true),
    roles: z.array(z.string()).default([]),
    permissions: z.array(z.string()).default([]),
  })
  .loose()

/**
 * The API returns the user alongside the token pair, which saves the client an
 * immediate follow-up call to `/auth/me/` just to render a name and gate the UI.
 */
const loginResponseSchema = z.object({
  access: z.string(),
  refresh: z.string(),
  user: authUserSchema,
})

export type LoginCredentials = {
  email: string
  password: string
}

/**
 * Exchange credentials for a JWT token pair and hydrate the auth store.
 *
 * The store is the single source of truth for the tokens (persisted to
 * cookies) and the current user, so it is updated here rather than in the form.
 */
export async function login(credentials: LoginCredentials): Promise<AuthUser> {
  const res = await api.post('/auth/login', credentials)
  const parsed = loginResponseSchema.parse(res.data)

  const { auth } = useAuthStore.getState()
  auth.setTokens(parsed.access, parsed.refresh)
  auth.setUser(parsed.user as AuthUser)

  return parsed.user as AuthUser
}

/**
 * Blacklist the refresh token server-side, then clear local state.
 *
 * Only the refresh token can be revoked: access tokens are stateless JWTs the
 * server never stores, so one already issued stays valid until it expires. This
 * is why the access lifetime is kept short.
 *
 * The local reset runs even if the request fails - a user asking to sign out
 * must always end up signed out on this device.
 */
export async function logout(): Promise<void> {
  const { refreshToken } = useAuthStore.getState().auth
  try {
    if (refreshToken) {
      await api.post('/auth/logout', { refresh: refreshToken })
    }
  } finally {
    useAuthStore.getState().auth.reset()
  }
}

export type PasswordChange = {
  current_password: string
  password: string
  password_confirmation: string
}

/**
 * Change the signed-in user's own password.
 *
 * A dedicated endpoint rather than `PUT /users/{id}`: that one lets an
 * administrator set a password without knowing the old one, which is right for
 * a reset but wrong for self-service. This one verifies the current password
 * and revokes every other session.
 */
export async function changePassword(payload: PasswordChange): Promise<void> {
  await api.post('/auth/password', payload)
}

/** Fetch the authenticated user, including their roles and permissions. */
export async function fetchMe(): Promise<AuthUser> {
  const res = await api.get('/auth/me')
  return authUserSchema.parse(res.data) as AuthUser
}

/**
 * Rehydrates the signed-in user after a page refresh: the token survives in a
 * cookie but the user object does not, so the app re-fetches it on load.
 */
export const meQueryOptions = queryOptions({
  queryKey: ['auth', 'me'],
  queryFn: fetchMe,
  staleTime: 5 * 60 * 1000,
  retry: false,
})
