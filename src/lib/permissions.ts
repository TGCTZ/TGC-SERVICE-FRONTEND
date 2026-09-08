/**
 * Permission names, in the vocabulary the API enforces.
 *
 * The API derives a permission for every model automatically, as
 * `<app_label>.<action>_<model>` — for example `catalog.view_product`. Those
 * names are not guessable from a URL segment: the app label groups several
 * resources (`brands` and `tags` both live in `catalog`), and the model name
 * drops the separators a URL keeps (`unit-of-measures` → `unitofmeasure`).
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
  products: { app: 'catalog', model: 'product' },
  'product-images': { app: 'catalog', model: 'productimage' },
  'product-categories': { app: 'catalog', model: 'productcategory' },
  brands: { app: 'catalog', model: 'brand' },
  'product-statuses': { app: 'catalog', model: 'productstatus' },
  'unit-of-measures': { app: 'catalog', model: 'unitofmeasure' },
  tags: { app: 'catalog', model: 'tag' },
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
 * @param resource - URL segment, e.g. `unit-of-measures`.
 * @param action - The action being gated.
 * @returns A permission name such as `catalog.change_unitofmeasure`.
 *
 * @example
 * perm('product-categories', 'add')  // 'catalog.add_productcategory'
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
 * Audit trails come from two different apps, and the module gates are custom
 * permissions the API declares by hand to control whether a whole section of
 * the UI is reachable at all.
 */
export const PERMISSIONS = {
  /** Row-level change history, written by the audit log. */
  viewActivityLogs: 'auditlog.view_logentry',
  /** Application-level events such as sign-ins and failures. */
  viewSystemLogs: 'audit.view_systemlog',

  moduleUser: 'core.module_user',
  moduleCatalog: 'core.module_catalog',
  moduleSettings: 'core.module_settings',
  moduleAudit: 'core.module_audit',
} as const
