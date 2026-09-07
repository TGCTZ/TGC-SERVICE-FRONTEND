import { z } from 'zod'

/**
 * One parsed line from a Laravel log file.
 *
 * `id` is synthesised by the API (there is no table), so it is stable only
 * within a single response — fine as a React key, useless as a permalink.
 */
export const systemLogSchema = z.object({
  id: z.number(),
  logged_at: z.string(),
  environment: z.string(),
  level: z.string(),
  message: z.string(),
  context: z.string(),
  file: z.string(),
})

export type SystemLog = z.infer<typeof systemLogSchema>
