import { queryOptions } from '@tanstack/react-query'
import { api } from '@/lib/api'
import {
  buildListParams,
  paginatedSchema,
  toPaginated,
  type ListParams,
  type Paginated,
} from '@/lib/api-query'
import { lookupOptionsQuery } from '@/features/lookups/data/api'
import { userSchema, type User } from './schema'

const listSchema = paginatedSchema(userSchema)

export async function fetchUsers(params: ListParams): Promise<Paginated<User>> {
  const res = await api.get('/users', { params: buildListParams(params) })

  return toPaginated(listSchema.parse(res.data), params)
}

export const usersQueryOptions = (params: ListParams) =>
  queryOptions({
    queryKey: ['users', params],
    queryFn: () => fetchUsers(params),
    placeholderData: (previous) => previous,
  })

export type UserPayload = Record<string, unknown> & {
  avatar?: File | null
  roles?: string[]
}

/**
 * Encode a payload as multipart, for the one write that carries a file.
 *
 * Arrays are appended as a repeated bare key (`roles`, `roles`), which is what
 * the API reads them back with. A bracketed `roles[]` would arrive as a single
 * field literally named "roles[]" and be ignored.
 */
function toFormData(payload: UserPayload): FormData {
  const form = new FormData()

  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null || value === '') continue

    if (value instanceof File) {
      form.append(key, value)
      continue
    }

    if (Array.isArray(value)) {
      value.forEach((entry) => form.append(key, String(entry)))
      continue
    }

    if (typeof value === 'boolean') {
      form.append(key, value ? 'true' : 'false')
      continue
    }

    form.append(key, String(value))
  }

  return form
}

/**
 * Multipart only when there is a file to send.
 *
 * JSON round-trips types the API cares about — a null clears a field, a number
 * stays a number — whereas multipart flattens everything to a string. So the
 * heavier encoding is used only for the write that genuinely needs it.
 */
function encode(payload: UserPayload): UserPayload | FormData {
  return payload.avatar instanceof File ? toFormData(payload) : payload
}

export async function createUser(payload: UserPayload): Promise<User> {
  const res = await api.post('/users', encode(payload))
  return userSchema.parse(res.data)
}

export async function updateUser(
  id: number,
  payload: UserPayload
): Promise<User> {
  // `roles` is writable on the user serializer, so role changes ride along with
  // the ordinary update rather than needing a second request.
  const res = await api.put(`/users/${id}`, encode(payload))
  return userSchema.parse(res.data)
}

/** Deletes are soft, so a deleted account can always be brought back. */
export async function restoreUser(id: number): Promise<void> {
  await api.post(`/users/${id}/restore`)
}

export async function deleteUser(id: number): Promise<void> {
  await api.delete(`/users/${id}`)
}

export const userStatusesQuery = () => lookupOptionsQuery('user-statuses')
export const gendersQuery = () => lookupOptionsQuery('genders')
