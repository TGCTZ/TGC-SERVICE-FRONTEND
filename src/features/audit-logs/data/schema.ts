import { z } from 'zod'

/**
 * Events the API records, in the vocabulary this screen displays.
 *
 * The audit trail records four actions. Everything richer that a
 * request-scoped audit log might carry — sign-ins, failed passwords, role
 * syncs — is written to the system log instead, so it is not offered here.
 */
export const auditEvents = [
  'created',
  'updated',
  'deleted',
  'accessed',
] as const

/**
 * Action integer to display name.
 *
 * The API sends the raw enum value plus its own label; the index is the stable
 * half of that pair, so the mapping is keyed on it. Order matches the server's
 * enum: create, update, delete, access.
 */
const ACTION_EVENTS = ['created', 'updated', 'deleted', 'accessed'] as const

/** Display name back to the action integer, for filtering. */
export const eventToAction: Record<string, number> = Object.fromEntries(
  ACTION_EVENTS.map((event, index) => [event, index])
)

/**
 * One audit entry exactly as the API sends it.
 *
 * Kept separate from the shape the screen renders: the API records a change as
 * a single `changes` map of `field: [before, after]`, while the diff component
 * wants the two sides apart. Reshaping once here beats teaching every component
 * about the wire format.
 */
const activityLogWireSchema = z.object({
  id: z.number(),
  action: z.number(),
  action_label: z.string(),
  subject_type: z.string().nullable().default(null),
  object_pk: z.string().nullable().default(null),
  object_repr: z.string().nullable().default(null),
  changes: z.record(z.string(), z.array(z.unknown())).nullable().default(null),
  actor: z.number().nullable().default(null),
  actor_label: z.string().nullable().default(null),
  remote_addr: z.string().nullable().default(null),
  timestamp: z.string(),
})

/**
 * Split the API's combined change map into before and after.
 *
 * A `changes` entry is a two-element array, `[before, after]`. A creation has
 * no meaningful before and a deletion no meaningful after, but the API still
 * sends both slots, so the nulls are preserved rather than dropped — the diff
 * component distinguishes "absent" from "was null".
 */
function splitChanges(changes: Record<string, unknown[]> | null) {
  if (!changes) return { old_values: null, new_values: null }

  const old_values: Record<string, unknown> = {}
  const new_values: Record<string, unknown> = {}
  for (const [field, pair] of Object.entries(changes)) {
    old_values[field] = pair[0] ?? null
    new_values[field] = pair[1] ?? null
  }
  return { old_values, new_values }
}

/**
 * One audit-log entry, normalised for display.
 *
 * The API is the authority on field names everywhere else in this project, but
 * an audit entry is read by six components and carries a wire format none of
 * them should have to know. This is the one place the two vocabularies meet.
 *
 * Some fields the screen was built around have no counterpart and are always
 * null: the audit trail records the actor's *name* rather than a joined user,
 * so there is no avatar, and it does not capture the user agent, HTTP method,
 * request URL or a batch id.
 */
export const activityLogSchema = activityLogWireSchema.transform((entry) => ({
  id: entry.id,
  event: ACTION_EVENTS[entry.action] ?? entry.action_label,
  description: entry.object_repr,

  subject_type: entry.subject_type,
  subject_name: entry.subject_type,
  subject_id: entry.object_pk === null ? null : Number(entry.object_pk),
  subject_label: entry.object_repr,

  causer_id: entry.actor,
  causer_label: entry.actor_label,
  causer: undefined as { avatar_url: string | null } | undefined,

  ...splitChanges(entry.changes),

  ip_address: entry.remote_addr,
  user_agent: null as string | null,
  method: null as string | null,
  url: null as string | null,
  batch_uuid: null as string | null,

  created_at: entry.timestamp,
}))

export type ActivityLog = z.infer<typeof activityLogSchema>
