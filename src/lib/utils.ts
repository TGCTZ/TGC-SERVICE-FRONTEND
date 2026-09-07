import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind class names, resolving conflicts in favour of the last one.
 *
 * Plain string concatenation loses here: `'p-2' + ' p-4'` leaves both in the
 * class list and the winner depends on CSS source order, not on the order you
 * wrote. `twMerge` understands that `p-4` supersedes `p-2`, which is what makes
 * a `className` prop able to override a component's own styling.
 *
 * @param inputs - Class values; strings, arrays, and conditional objects
 * @returns One class string with conflicts resolved
 *
 * @example
 * cn('p-2 text-sm', isActive && 'bg-accent', className)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Resolve after a delay.
 *
 * For demos and artificial latency while developing against a fast local API.
 * Not for sequencing real work — if you are sleeping to wait for state, the
 * dependency is the bug.
 *
 * @param ms - Milliseconds to wait
 * @returns A promise resolving once the delay has elapsed
 */
export function sleep(ms: number = 1000) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Build the page-button sequence for a pager, collapsing gaps to an ellipsis.
 *
 * At most five numbered buttons are shown. The first and last page are always
 * present, so a user can jump to either end from anywhere without paging
 * through the middle.
 *
 * @param currentPage - Current page, 1-based
 * @param totalPages - Total number of pages
 * @returns Page numbers interleaved with `'...'` strings; render the numbers as
 *   buttons and the ellipses as inert text
 *
 * @example
 * getPageNumbers(1, 5)   // [1, 2, 3, 4, 5]        — no gaps to collapse
 * getPageNumbers(2, 10)  // [1, 2, 3, 4, '...', 10]
 * getPageNumbers(5, 10)  // [1, '...', 4, 5, 6, '...', 10]
 * getPageNumbers(9, 10)  // [1, '...', 7, 8, 9, 10]
 */
export function getPageNumbers(currentPage: number, totalPages: number) {
  const maxVisiblePages = 5 // Maximum number of page buttons to show
  const rangeWithDots = []

  if (totalPages <= maxVisiblePages) {
    // If total pages is 5 or less, show all pages
    for (let i = 1; i <= totalPages; i++) {
      rangeWithDots.push(i)
    }
  } else {
    // Always show first page
    rangeWithDots.push(1)

    if (currentPage <= 3) {
      // Near the beginning: [1] [2] [3] [4] ... [10]
      for (let i = 2; i <= 4; i++) {
        rangeWithDots.push(i)
      }
      rangeWithDots.push('...', totalPages)
    } else if (currentPage >= totalPages - 2) {
      // Near the end: [1] ... [7] [8] [9] [10]
      rangeWithDots.push('...')
      for (let i = totalPages - 3; i <= totalPages; i++) {
        rangeWithDots.push(i)
      }
    } else {
      // In the middle: [1] ... [4] [5] [6] ... [10]
      rangeWithDots.push('...')
      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
        rangeWithDots.push(i)
      }
      rangeWithDots.push('...', totalPages)
    }
  }

  return rangeWithDots
}

/**
 * Initials from a display name: first character of the first word + first
 * character of the last word. One word only: first two characters. Empty: `?`.
 */
export function getDisplayNameInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  const first = parts[0][0] ?? ''
  const last = parts[parts.length - 1]?.[0] ?? ''
  return (first + last).toUpperCase()
}
