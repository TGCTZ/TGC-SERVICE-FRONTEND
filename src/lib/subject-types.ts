import { type PermissionResource } from '@/lib/permissions'

/**
 * Model names as the audit trail records them, keyed by URL resource.
 *
 * The API reports a log entry's subject as its lowercase model name —
 * `stonetype`, `identificationreport` — with no app label and no separators.
 * That is what `<RecordHistorySheet>` filters on.
 *
 * Keyed by URL segment throughout, so `subjectTypes[config.resource]` works for
 * the generic lookups screen and `subjectTypes.orders` reads naturally in a
 * feature. A mistyped name **fails silently**: the sheet returns no rows rather
 * than erroring, so a typo looks exactly like a record nobody has ever changed.
 *
 * **Only models the API registers with django-auditlog belong here.** It
 * registers every concrete `BaseModel` subclass, which deliberately excludes:
 *
 * - `statushistory` and `certificateaccesslog` — append-only ledgers; they are
 *   the log, so logging them would be circular. Stone status has its own
 *   history sheet fed by `/status-history/`.
 * - `group` (roles) — a Django built-in, not a `BaseModel`. A role's history is
 *   simply not recorded, so no entry here can produce one.
 *
 * To verify an entry:
 *
 *     GET /api/v1/activity-logs/?page_size=1&filter[content_type__model]=<name>
 */
export const subjectTypes = {
  // Reference data.
  'stone-types': 'stonetype',
  species: 'species',
  varieties: 'variety',
  colors: 'color',
  origins: 'origin',
  'shape-cuts': 'shapecut',
  instruments: 'instrument',

  // Reception.
  customers: 'customer',
  orders: 'order',
  stones: 'stone',

  // Billing.
  bills: 'bill',
  'bill-items': 'billitem',
  payments: 'payment',
  'service-providers': 'serviceprovider',

  // The bench.
  'identification-reports': 'identificationreport',
  'instruments-used': 'instrumentused',

  // Certification.
  certificates: 'certificate',

  // Administration.
  users: 'user',
  'user-statuses': 'userstatus',
  genders: 'gender',
  'identity-details': 'identitydetail',
} as const satisfies Partial<Record<PermissionResource, string>>
