import { z } from 'zod'

/**
 * A GePG service provider.
 *
 * Not a lookup, despite its size: it has no `description`, and its three codes
 * (`sp_code`, `group_code`, `sys_code`) are what identify the lab to the
 * gateway. Getting one wrong makes every bill submission fail, which is why it
 * has its own screen rather than sharing the generic reference-data form.
 */
export const serviceProviderSchema = z.object({
  id: z.number(),
  sp_code: z.string(),
  name: z.string(),
  group_code: z.string().nullable().default(''),
  sys_code: z.string().nullable().default(''),
  is_active: z.boolean().default(true),

  created_at: z.string().nullable().default(null),
  updated_at: z.string().nullable().default(null),
  deleted_at: z.string().nullable().default(null),
})

export type ServiceProvider = z.infer<typeof serviceProviderSchema>
