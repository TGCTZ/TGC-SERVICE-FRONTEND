import { z } from 'zod'

/**
 * A role.
 *
 * Roles are Django groups, which are **not** soft-deletable and carry no audit
 * columns — so unlike every other resource in the app there is no `deleted_at`,
 * no restore, and no change history.
 */
export const roleSchema = z.object({
  id: z.number(),
  name: z.string(),
  /** Protected roles (superadmin) cannot be renamed, deleted or re-permissioned. */
  is_protected: z.boolean().default(false),
  permissions: z.array(z.string()).default([]),
  user_count: z.number().default(0),
})

export type Role = z.infer<typeof roleSchema>

/**
 * Permissions bucketed by app label, e.g. `{ gems: ['gems.view_stonetype'] }`.
 *
 * The values are fully qualified `app_label.codename` labels, the same strings a
 * role's own `permissions` array holds, so the matrix can write back exactly
 * what it read. A bare codename would be ambiguous — `view_logentry` exists in
 * both `admin` and `auditlog`.
 */
export const groupedPermissionsSchema = z.record(
  z.string(),
  z.array(z.string())
)

export type GroupedPermissions = z.infer<typeof groupedPermissionsSchema>
