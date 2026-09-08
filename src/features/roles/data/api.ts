import { queryOptions } from '@tanstack/react-query'
import { api } from '@/lib/api'
import {
  buildListParams,
  paginatedSchema,
  toPaginated,
  type ListParams,
  type Paginated,
} from '@/lib/api-query'
import {
  groupedPermissionsSchema,
  roleSchema,
  type GroupedPermissions,
  type Role,
} from './schema'

const listSchema = paginatedSchema(roleSchema)

export async function fetchRoles(
  params: ListParams = {}
): Promise<Paginated<Role>> {
  const res = await api.get('/roles', { params: buildListParams(params) })
  const parsed = listSchema.parse(res.data)
  return toPaginated(parsed, params)
}

export const rolesQuery = (params: ListParams = {}) =>
  queryOptions({
    queryKey: ['roles', params],
    queryFn: () => fetchRoles(params),
    placeholderData: (previous) => previous,
  })

export async function fetchRole(id: number): Promise<Role> {
  const res = await api.get(`/roles/${id}`)
  return roleSchema.parse(res.data)
}

export const roleQuery = (id: number) =>
  queryOptions({
    queryKey: ['roles', 'detail', id],
    queryFn: () => fetchRole(id),
  })

/**
 * Every permission the system defines, grouped by resource.
 *
 * Permissions are code-defined and seeded, so this rarely changes and is
 * cached for the session. It is the source of rows for the permission matrix.
 */
export async function fetchGroupedPermissions(): Promise<GroupedPermissions> {
  const res = await api.get('/permissions/grouped')
  return groupedPermissionsSchema.parse(res.data).permissions
}

export const groupedPermissionsQuery = () =>
  queryOptions({
    queryKey: ['permissions', 'grouped'],
    queryFn: fetchGroupedPermissions,
    staleTime: 10 * 60 * 1000,
  })

export async function createRole(payload: {
  name: string
  permissions?: string[]
}): Promise<Role> {
  const res = await api.post('/roles', payload)
  return roleSchema.parse(res.data.role)
}

export async function updateRole(
  id: number,
  payload: { name?: string }
): Promise<Role> {
  const res = await api.put(`/roles/${id}`, payload)
  return roleSchema.parse(res.data.role)
}

export async function deleteRole(id: number): Promise<void> {
  await api.delete(`/roles/${id}`)
}

/** Replace a role's permission set — the write behind the matrix. */
export async function syncRolePermissions(
  id: number,
  permissions: string[]
): Promise<Role> {
  const res = await api.put(`/roles/${id}/permissions`, { permissions })
  return roleSchema.parse(res.data.role)
}
