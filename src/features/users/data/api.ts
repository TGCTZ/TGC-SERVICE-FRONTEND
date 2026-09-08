import { queryOptions } from '@tanstack/react-query'
import { api } from '@/lib/api'
import {
  buildListParams,
  paginatedSchema,
  toPaginated,
  type ListParams,
  type Paginated,
} from '@/lib/api-query'
import { lookupSchema, userSchema, type Lookup, type User } from './schema'

const listSchema = paginatedSchema(userSchema)

export async function fetchUsers(params: ListParams): Promise<Paginated<User>> {
  const res = await api.get('/users', {
    params: buildListParams({
      ...params,
      include: ['userStatus', 'gender', 'roles'],
    }),
  })

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

async function fetchLookup(resource: string): Promise<Lookup[]> {
  const res = await api.get(`/${resource}`, {
    params: { page_size: 100, ordering: 'name' },
  })

  return paginatedSchema(lookupSchema).parse(res.data).results as Lookup[]
}

export const userStatusesQuery = () =>
  queryOptions({
    queryKey: ['lookup', 'user-statuses'],
    queryFn: () => fetchLookup('user-statuses'),
    staleTime: 10 * 60 * 1000,
  })

export const gendersQuery = () =>
  queryOptions({
    queryKey: ['lookup', 'genders'],
    queryFn: () => fetchLookup('genders'),
    staleTime: 10 * 60 * 1000,
  })
