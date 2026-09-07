import { z } from 'zod'

/** Events the API records. Kept in sync with AuditLogger's `event` values. */
export const auditEvents = [
  'created',
  'updated',
  'deleted',
  'force_deleted',
  'restored',
  'login',
  'logout',
  'login_failed',
  'registered',
  'permissions_synced',
  'roles_synced',
  'password_changed',
  'password_change_failed',
] as const

const causerSchema = z.object({
  id: z.number(),
  full_name: z.string(),
  email: z.string(),
  avatar_url: z.string().nullable(),
})

/**
 * One audit-log entry.
 *
 * `old_values` / `new_values` hold only the attributes that changed, so the
 * shape varies per row and per model - hence the open record type. `event` is
 * a plain string rather than the enum above: a backend that learns a new event
 * must not break the whole page's parse.
 */
export const activityLogSchema = z.object({
  id: z.number(),
  event: z.string(),
  description: z.string().nullable(),

  subject_type: z.string().nullable(),
  subject_name: z.string().nullable(),
  subject_id: z.number().nullable(),
  subject_label: z.string().nullable(),

  causer_id: z.number().nullable(),
  causer_label: z.string().nullable(),
  causer: causerSchema.optional(),

  old_values: z.record(z.string(), z.unknown()).nullable(),
  new_values: z.record(z.string(), z.unknown()).nullable(),

  ip_address: z.string().nullable(),
  user_agent: z.string().nullable(),
  method: z.string().nullable(),
  url: z.string().nullable(),
  batch_uuid: z.string().nullable(),

  created_at: z.string(),
})

export type ActivityLog = z.infer<typeof activityLogSchema>
