import { type NavGroup, type NavItem } from '../types'

/** True when the entry declares no permission, or the user holds one of them. */
function isVisible(permission: NavItem['permission'], granted: string[]) {
  if (!permission) return true
  const required = Array.isArray(permission) ? permission : [permission]
  return required.some((p) => granted.includes(p))
}

/**
 * Hide navigation the current user cannot reach.
 *
 * Shared by the sidebar and the command palette so the two can never disagree
 * about what is reachable. Filtering from the same permission list the API
 * enforces means navigation never offers a page that would immediately 403.
 * Collapsible groups are dropped once all their children are filtered out.
 */
export function filterNavGroups(
  groups: NavGroup[],
  granted: string[]
): NavGroup[] {
  return groups
    .map((group) => ({
      ...group,
      items: group.items
        .filter((item) => isVisible(item.permission, granted))
        .map((item) => {
          if (!('items' in item) || !item.items) return item

          return {
            ...item,
            items: item.items.filter((child) =>
              isVisible(child.permission, granted)
            ),
          }
        })
        .filter((item) => !('items' in item && item.items?.length === 0)),
    }))
    .filter((group) => group.items.length > 0) as NavGroup[]
}
