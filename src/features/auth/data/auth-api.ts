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
    avatar_url: z.string().nullable().default(null),
    is_active: z.boolean().default(true),
    roles: z.array(z.string()).default([]),
    permissions: z.array(z.string()).default([]),
  })
  .loose()

const loginResponseSchema = z.object({
  message: z.string(),
  user: authUserSchema,
  token: z.string(),
})

export type LoginCredentials = {
  email: string
  password: string
}

/**
 * Exchange credentials for a Sanctum token and hydrate the auth store.
 *
 * The store is the single source of truth for the token (persisted to a
 * cookie) and the current user, so it is updated here rather than in the form.
 */
export async function login(credentials: LoginCredentials): Promise<AuthUser> {
  const res = await api.post('/auth/login', credentials)
  const parsed = loginResponseSchema.parse(res.data)

  const { auth } = useAuthStore.getState()
  auth.setAccessToken(parsed.token)
  auth.setUser(parsed.user as AuthUser)

  return parsed.user as AuthUser
}

/**
 * Revoke the current token server-side, then clear local state.
 *
 * The local reset runs even if the request fails - a user asking to sign out
 * must always end up signed out on this device.
 */
export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout')
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
