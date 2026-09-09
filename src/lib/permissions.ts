/**
 * Permission names, in the vocabulary the API enforces.
 *
 * The API derives a permission for every model automatically, as
 * `<app_label>.<action>_<model>` — for example `gems.view_stonetype`. Those
 * names are not guessable from a URL segment: the app label groups several
 * resources (`colors` and `varieties` both live in `gems`), and the model name
 * drops the separators a URL keeps (`shape-cuts` → `shapecut`).
 *
 * Everything the UI gates on is therefore resolved here, so a renamed resource
 * or a moved model is one edit rather than a hunt through the feature folders.
 * The names must match the server exactly; a typo does not fail loudly, it
 * silently hides the control from everyone.
 *
 * Hiding UI is a usability affordance, not security — see `@/lib/authz`.
 */

/**
 * The four actions the API defines per model.
 *
 * There is deliberately no `viewAny`: one `view` permission covers both the
 * list and the detail of a resource.
 */
export type PermissionAction = 'view' | 'add' | 'change' | 'delete'

/** Where a URL segment's records actually live on the server. */
type ModelRef = {
  /** App label, which is the first half of every permission name. */
  app: string
  /** Model name as the API spells it: lowercase, no separators. */
  model: string
}

/**
 * URL segment to the model behind it.
 *
 * Keyed by the `resource` string the feature code already carries, so a lookup
 * screen can resolve its own permissions from its config entry.
 */
const RESOURCE_MODELS = {
  // Reference data.
  'stone-types': { app: 'gems', model: 'stonetype' },
  species: { app: 'gems', model: 'species' },
  varieties: { app: 'gems', model: 'variety' },
  colors: { app: 'gems', model: 'color' },
  origins: { app: 'gems', model: 'origin' },
  'shape-cuts': { app: 'gems', model: 'shapecut' },
  instruments: { app: 'gems', model: 'instrument' },

  // Reception.
  customers: { app: 'orders', model: 'customer' },
  orders: { app: 'orders', model: 'order' },
  stones: { app: 'orders', model: 'stone' },
  'status-history': { app: 'orders', model: 'statushistory' },

  // Billing.
  bills: { app: 'billing', model: 'bill' },
  'bill-items': { app: 'billing', model: 'billitem' },
  payments: { app: 'billing', model: 'payment' },
  'service-providers': { app: 'billing', model: 'serviceprovider' },

  // The bench.
  'identification-reports': {
    app: 'identification',
    model: 'identificationreport',
  },
  'instruments-used': { app: 'identification', model: 'instrumentused' },

  // Certification.
  certificates: { app: 'certificates', model: 'certificate' },
  'certificate-access-logs': {
    app: 'certificates',
    model: 'certificateaccesslog',
  },

  // Administration.
  users: { app: 'users', model: 'user' },
  'user-statuses': { app: 'users', model: 'userstatus' },
  genders: { app: 'users', model: 'gender' },
  'identity-details': { app: 'users', model: 'identitydetail' },
  // Roles are Django groups; the resource is exposed as `roles` for readability.
  roles: { app: 'auth', model: 'group' },
} as const satisfies Record<string, ModelRef>

/** URL segments with a model-backed permission set. */
export type PermissionResource = keyof typeof RESOURCE_MODELS

/**
 * Build the permission name for an action on a resource.
 *
 * @param resource - URL segment, e.g. `shape-cuts`.
 * @param action - The action being gated.
 * @returns A permission name such as `gems.change_shapecut`.
 *
 * @example
 * perm('identification-reports', 'add')  // 'identification.add_identificationreport'
 */
export function perm(
  resource: PermissionResource,
  action: PermissionAction
): string {
  const { app, model } = RESOURCE_MODELS[resource]
  return `${app}.${action}_${model}`
}

/**
 * The permission a soft-deleted row's restore action requires.
 *
 * Restore is a `POST` to `{id}/restore/`, and the API's permission class maps
 * every POST to `add_<model>`. It reads oddly — restoring is closer to a change
 * than a creation — but the UI must gate on what the server actually enforces,
 * or the button appears for users whose request will be refused.
 */
export function restorePerm(resource: PermissionResource): string {
  return perm(resource, 'add')
}

/**
 * Permissions that are not derived from a model.
 *
 * Two kinds. The workflow verbs are declared by hand on their model because
 * moving a stone or finalizing a report is not a create or an update — the API
 * gates those routes on these names, not on `add_<model>`. The module gates
 * decide whether a whole section of the UI is reachable at all.
 */
export const PERMISSIONS = {
  /** Row-level change history, written by the audit log. */
  viewActivityLogs: 'auditlog.view_logentry',
  /** Application-level events such as sign-ins and failures. */
  viewSystemLogs: 'audit.view_systemlog',

  // Workflow verbs.
  transitionStone: 'orders.transition_stone',
  generateBill: 'billing.generate_bill',
  finalizeReport: 'identification.finalize_report',
  issueCertificate: 'certificates.issue_certificate',
  revokeCertificate: 'certificates.revoke_certificate',

  // Module gates.
  moduleOrders: 'core.module_orders',
  moduleIdentification: 'core.module_identification',
  moduleBilling: 'core.module_billing',
  moduleCertificates: 'core.module_certificates',
  moduleReference: 'core.module_reference',
  moduleUser: 'core.module_user',
  moduleSettings: 'core.module_settings',
  moduleAudit: 'core.module_audit',
} as const
