import { useAuthStore } from '@/stores/auth-store'
import { toPermissionArray } from '@/lib/authz'

type CanProps = {
  /** Permission(s) that grant access. The user needs at least one. */
  permission?: string | string[]
  /** Role(s) that grant access, for coarse gates. The user needs at least one. */
  role?: string | string[]
  children: React.ReactNode
  /** Rendered when the user is not allowed. Defaults to nothing. */
  fallback?: React.ReactNode
}

/**
 * Conditionally renders children based on the current user's access.
 *
 * The UI counterpart to `requirePermission()` (`@/lib/authz`), for hiding
 * actions the user may not perform. Prefer `permission` over `role`: it
 * matches how the API enforces access, so the two cannot drift apart.
 *
 * Hiding UI is a usability affordance, not security — the API enforces every
 * one of these independently.
 *
 * @example
 * <Can permission={perm('products', 'add')}>
 *   <Button>Add product</Button>
 * </Can>
 */
export function Can({ permission, role, children, fallback = null }: CanProps) {
  // Select the user (a stable reference) rather than deriving a new array in
  // the selector, which would re-render on every store read.
  const user = useAuthStore((state) => state.auth.user)

  const requiredPermissions = toPermissionArray(permission)
  const requiredRoles = toPermissionArray(role)

  // With neither prop the gate is inert and simply renders its children.
  if (requiredPermissions.length === 0 && requiredRoles.length === 0) {
    return <>{children}</>
  }

  const allowed =
    requiredPermissions.some((p) => user?.permissions?.includes(p)) ||
    requiredRoles.some((r) => user?.roles?.includes(r))

  return <>{allowed ? children : fallback}</>
}
