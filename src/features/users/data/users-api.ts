import { z } from 'zod'
import { queryOptions } from '@tanstack/react-query'
import { api } from '@/lib/api'
import {
  buildListParams,
  metaSchema,
  type ListParams,
  type Paginated,
} from '@/lib/api-query'
import { lookupSchema, userSchema, type Lookup, type User } from './schema'

const listSchema = z.object({
  users: z.array(userSchema),
  meta: metaSchema,
})

export async function fetchUsers(params: ListParams): Promise<Paginated<User>> {
  const res = await api.get('/users', {
    params: buildListParams({
      ...params,
      include: ['userStatus', 'gender', 'roles'],
    }),
  })

  const parsed = listSchema.parse(res.data)
  return { items: parsed.users, meta: parsed.meta }
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

/** Users can carry an avatar, so writes go out as multipart. */
function toFormData(payload: UserPayload): FormData {
  const form = new FormData()

  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null || value === '') continue

    if (value instanceof File) {
      form.append(key, value)
      continue
    }

    if (Array.isArray(value)) {
      value.forEach((entry) => form.append(`${key}[]`, String(entry)))
      continue
    }

    if (typeof value === 'boolean') {
      form.append(key, value ? '1' : '0')
      continue
    }

    form.append(key, String(value))
  }

  return form
}

export async function createUser(payload: UserPayload): Promise<User> {
  const res = await api.post('/users', toFormData(payload))
  return userSchema.parse(res.data.user)
}

/** PUT + multipart is not parsed by PHP, so updates use method spoofing. */
export async function updateUser(
  id: number,
  payload: UserPayload
): Promise<User> {
  const form = toFormData(payload)
  form.append('_method', 'PUT')

  const res = await api.post(`/users/${id}`, form)
  return userSchema.parse(res.data.user)
}

/** Deletes are soft, so a deleted account can always be brought back. */
export async function restoreUser(id: number): Promise<void> {
  await api.patch(`/users/${id}/restore`)
}

export async function deleteUser(id: number): Promise<void> {
  await api.delete(`/users/${id}`)
}

/** Replace a user's role assignments (role names, not ids). */
export async function syncUserRoles(
  id: number,
  roles: string[]
): Promise<User> {
  const res = await api.put(`/users/${id}/roles`, { roles })
  return userSchema.parse(res.data.user)
}

async function fetchLookup(resource: string, key: string): Promise<Lookup[]> {
  const res = await api.get(`/${resource}`, {
    params: { per_page: 100, sort_by: 'name' },
  })

  const schema = z.object({ [key]: z.array(lookupSchema) })
  return schema.parse(res.data)[key] as Lookup[]
}

export const userStatusesQuery = () =>
  queryOptions({
    queryKey: ['lookup', 'user-statuses'],
    queryFn: () => fetchLookup('user-statuses', 'user_statuses'),
    staleTime: 10 * 60 * 1000,
  })

export const gendersQuery = () =>
  queryOptions({
    queryKey: ['lookup', 'genders'],
    queryFn: () => fetchLookup('genders', 'genders'),
    staleTime: 10 * 60 * 1000,
  })
