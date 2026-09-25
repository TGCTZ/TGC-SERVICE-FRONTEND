import { queryOptions } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { paginatedSchema } from '@/lib/api-query'
import {
  notificationSchema,
  unreadSummarySchema,
  type Notification,
  type UnreadSummary,
} from './schema'

/**
 * How often the client asks for the unread summary.
 *
 * Polling rather than a socket: every notification is a handoff between desks,
 * where half a minute is invisible, and a GET needs no server infrastructure.
 * React Query pauses the interval while the tab is hidden.
 */
const UNREAD_POLL_MS = 30_000

/** How many recent notifications the bell's panel lists. */
const PANEL_SIZE = 10

const listSchema = paginatedSchema(notificationSchema)

export const notificationKeys = {
  all: ['notifications'] as const,
  unreadSummary: () => [...notificationKeys.all, 'unread-summary'] as const,
  recent: () => [...notificationKeys.all, 'recent'] as const,
}

/**
 * The unread count, per-route counts and newest unread item.
 *
 * One query shared by the bell, the sidebar and the watcher — React Query
 * dedupes the observers, so the three still cost one request per interval.
 */
export const unreadSummaryQuery = () =>
  queryOptions({
    queryKey: notificationKeys.unreadSummary(),
    queryFn: async (): Promise<UnreadSummary> => {
      const res = await api.get('/notifications/unread-summary')
      return unreadSummarySchema.parse(res.data)
    },
    refetchInterval: UNREAD_POLL_MS,
  })

/** The most recent notifications, read and unread, newest first. */
export const recentNotificationsQuery = () =>
  queryOptions({
    queryKey: notificationKeys.recent(),
    queryFn: async (): Promise<Notification[]> => {
      const res = await api.get('/notifications', {
        params: { page_size: PANEL_SIZE },
      })
      return listSchema.parse(res.data).results
    },
  })

/** The route a notification's link opens, query string dropped. */
export function routeOf(link: string): string {
  return link.split('?', 1)[0]
}

export async function markNotificationRead(id: number): Promise<void> {
  await api.post(`/notifications/${id}/read`)
}

/**
 * Mark unread notifications read — every one, or only those for `route`.
 *
 * @param route - A path without query string; the server matches every link
 *   to it, whatever order or filter the link carried.
 */
export async function markAllNotificationsRead(route?: string): Promise<void> {
  await api.post('/notifications/read-all', route ? { link: route } : {})
}
