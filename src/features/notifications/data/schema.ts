import { z } from 'zod'

/**
 * A notification as its recipient sees it.
 *
 * `kind` is left an open string rather than an enum: the server adds kinds as
 * the pipeline grows, and an unknown one should still render, not fail the
 * whole inbox parse.
 *
 * `link` is an in-app route (path plus optional query string), not a URL.
 */
export const notificationSchema = z.object({
  id: z.number(),
  kind: z.string(),
  title: z.string(),
  body: z.string(),
  link: z.string(),
  created_at: z.string(),
  read_at: z.string().nullable(),
  is_read: z.boolean(),
})

export type Notification = z.infer<typeof notificationSchema>

/**
 * Everything the client polls for, in one response.
 *
 * `by_link` is keyed by route **without** its query string, which is exactly
 * the form a sidebar entry's `url` takes.
 */
export const unreadSummarySchema = z.object({
  count: z.number(),
  by_link: z.record(z.string(), z.number()),
  latest: notificationSchema.nullable(),
})

export type UnreadSummary = z.infer<typeof unreadSummarySchema>
