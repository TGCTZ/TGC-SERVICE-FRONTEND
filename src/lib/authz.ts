import { redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'

/**
 * Authorization helpers.
 *
 * Gates are expressed as **permissions** (e.g. `catalog.add_product`) rather than
 * roles, because that is exactly how the API enforces access. Using the same
 * vocabulary on both sides means the UI and the server can never disagree
 * about what a user may do — a role gate would drift the moment someone edits
 * that role's permissions from the Roles screen.
 *
 * Hiding UI is a usability affordance, not security: the API enforces every
 * one of these independently.
 */

/** Permissions held by the signed-in user (empty when signed out). */
export function getCurrentPermissions(): string[] {
  return useAuthStore.getState().auth.user?.permissions ?? []
}

/** Accept either a single name or a list, so callers never have to wrap. */
export function toPermissionArray(
  value: string | string[] | undefined
): string[] {
  if (value === undefined) return []
  return Array.isArray(value) ? value : [value]
}

/**
 * True when the user holds at least one of the required permissions.
 *
 * Takes a bare string or an array. Normalising here rather than at each call
 * site matters: a bare string reaching an array-only signature does not fail
 * type-checking in every position, and `'catalog.view_product'.some` is a runtime
 * TypeError, not a denied permission.
 */
export function hasAnyPermission(required: string | string[]): boolean {
  const names = toPermissionArray(required)
  if (names.length === 0) return true
  const permissions = getCurrentPermissions()
  return names.some((permission) => permissions.includes(permission))
}

/**
 * Build a route `beforeLoad` guard requiring one of the given permissions.
 *
 * Redirects to the 403 page when the user is signed in but not allowed. Pair
 * it with the auth guard on `_authenticated`, which handles signed-out users.
 *
 * @example
 * export const Route = createFileRoute('/_authenticated/products/')({
 *   beforeLoad: requirePermission([perm('products', 'view')]),
 *   component: Products,
 * })
 */
export function requirePermission(required: string | string[]) {
  return () => {
    if (!hasAnyPermission(required)) {
      throw redirect({ to: '/403' })
    }
  }
}
