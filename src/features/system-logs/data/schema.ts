import { z } from 'zod'

/**
 * One parsed line from the application log file, as the API sends it.
 *
 * The endpoint reads a file rather than a table, so there is no id, no
 * pagination envelope and no per-row metadata beyond these four fields.
 */
export const systemLogWireSchema = z.object({
  timestamp: z.string(),
  level: z.string(),
  logger: z.string(),
  message: z.string(),
})

/**
 * One log line in the shape the table renders.
 *
 * `id` is synthesised from the row's position, because the API has no
 * identifier to offer — it is stable only within a single response, which makes
 * it fine as a React key and useless as a permalink. `file` carries the logger
 * name, which is the nearest thing to an origin the file format records.
 */
export const systemLogSchema = z.object({
  id: z.number(),
  logged_at: z.string(),
  level: z.string(),
  message: z.string(),
  file: z.string(),
})

export type SystemLog = z.infer<typeof systemLogSchema>
