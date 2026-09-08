import { z } from 'zod'

export const roleSchema = z.object({
  id: z.number(),
  name: z.string(),
  guard_name: z.string().default('web'),
  /** Protected roles (superadmin) cannot be renamed, deleted or re-permissioned. */
  is_protected: z.boolean().default(false),
  permissions: z.array(z.string()).optional(),
  permissions_count: z.number().optional(),
  users_count: z.number().optional(),
  created_at: z.string().nullable().default(null),
  updated_at: z.string().nullable().default(null),
})

export type Role = z.infer<typeof roleSchema>

/**
 * Permissions bucketed by app label, e.g. `{ catalog: ['view_product'] }`.
 *
 * The values are bare codenames, not the fully qualified names a user's own
 * permission list carries - the role editor and the authorization gates work in
 * different vocabularies.
 */
export const groupedPermissionsSchema = z.object({
  permissions: z.record(z.string(), z.array(z.string())),
})

export type GroupedPermissions = Record<string, string[]>
