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
 * Every permission the system defines, grouped by app.
 *
 * Permissions are code-defined and seeded, so this rarely changes and is cached
 * for the session. It is the source of rows for the permission matrix.
 */
export async function fetchGroupedPermissions(): Promise<GroupedPermissions> {
  const res = await api.get('/permissions/grouped')
  return groupedPermissionsSchema.parse(res.data)
}

export const groupedPermissionsQuery = () =>
  queryOptions({
    queryKey: ['permissions', 'grouped'],
    queryFn: fetchGroupedPermissions,
    staleTime: 10 * 60 * 1000,
  })

export type RolePayload = {
  name?: string
  /** Fully qualified `app_label.codename` labels. */
  permissions?: string[]
}

export async function createRole(payload: RolePayload): Promise<Role> {
  const res = await api.post('/roles', payload)
  return roleSchema.parse(res.data)
}

/**
 * Update a role, one field at a time.
 *
 * `permissions` is a writable field on the role, so the matrix saves through
 * this one call — there is no separate sync endpoint. Sending the array
 * replaces the role's whole permission set.
 *
 * **PATCH, not PUT.** Both callers send a partial payload — the matrix sends
 * only `permissions`, renaming sends only `name` — and a PUT is a full replace,
 * so the API rightly rejects it for the fields that are missing. Sending the
 * whole role back just to change one field would also mean the matrix
 * overwrites a name it never showed the user.
 */
export async function updateRole(
  id: number,
  payload: RolePayload
): Promise<Role> {
  const res = await api.patch(`/roles/${id}`, payload)
  return roleSchema.parse(res.data)
}

export async function deleteRole(id: number): Promise<void> {
  await api.delete(`/roles/${id}`)
}
