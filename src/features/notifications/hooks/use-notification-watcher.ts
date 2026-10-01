import { useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocation, useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import {
  markAllNotificationsRead,
  notificationKeys,
  routeOf,
  unreadSummaryQuery,
} from '../data/api'

/**
 * Keep the signed-in shell in step with the inbox. Mount once, in the layout.
 *
 * Lives in the layout rather than the bell because every page renders its own
 * `Header`, so the bell remounts on each navigation and would forget the count
 * it last saw — the very thing arrival detection compares against.
 *
 * Three jobs:
 *
 * 1. **Toast arrivals.** When the unread count rises between polls, never on
 *    first load: signing in to a dozen unread should show badges, not toasts.
 * 2. **Acknowledge by visiting.** Opening the billing queue is how an
 *    accountant acknowledges "ready to bill", so the bell stops reporting work
 *    they are already looking at.
 * 3. **Refresh what the arrival changed.** Every notification means a queue
 *    grew, so the sidebar's queue counts refetch at once rather than on their
 *    next poll — and if the user is on that page, so does the page.
 */
export function useNotificationWatcher() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const pathname = useLocation({ select: (location) => location.pathname })
  const { data } = useQuery(unreadSummaryQuery())

  const lastCount = useRef<number | null>(null)
  useEffect(() => {
    if (!data) return
    const before = lastCount.current
    lastCount.current = data.count
    if (before === null || data.count <= before || !data.latest) return

    void queryClient.invalidateQueries({ queryKey: notificationKeys.recent() })
    void queryClient.invalidateQueries({ queryKey: ['count'] })

    const { latest } = data
    // Already looking at the page it points to; job 3 refreshes it instead.
    if (routeOf(latest.link) === pathname) return

    toast.info(latest.title, {
      description: latest.body || undefined,
      action: latest.link
        ? {
            label: 'Open',
            // Opening the page marks it read through job 2 below.
            onClick: () => router.history.push(latest.link),
          }
        : undefined,
    })
  }, [data, pathname, queryClient, router])

  const unreadHere = data?.by_link[pathname] ?? 0
  const lastPath = useRef(pathname)
  useEffect(() => {
    const stayed = lastPath.current === pathname
    lastPath.current = pathname
    if (unreadHere === 0) return

    void markAllNotificationsRead(pathname).then(() => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all })
      // Arrived while the page was already open: refetch what it shows, or
      // the new row stays invisible. On a fresh visit the page is loading its
      // own data anyway.
      if (stayed) {
        void queryClient.invalidateQueries({
          predicate: (query) => query.queryKey[0] !== notificationKeys.all[0],
        })
      }
    })
  }, [pathname, unreadHere, queryClient])
}
