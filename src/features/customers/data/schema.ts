import { z } from 'zod'

/**
 * A customer as returned by the API.
 *
 * `full_name` is composed server-side from the three name parts, so it is
 * read-only here and never sent back.
 */
export const customerSchema = z.object({
  id: z.number(),
  first_name: z.string(),
  middle_name: z.string().nullable().default(''),
  last_name: z.string(),
  full_name: z.string(),
  phone: z.string(),
  email: z.string().nullable().default(''),
  company_name: z.string().nullable().default(''),
  region: z.string().nullable().default(''),
  id_number: z.string().nullable().default(''),
  address: z.string().nullable().default(''),

  created_at: z.string().nullable().default(null),
  updated_at: z.string().nullable().default(null),
  deleted_at: z.string().nullable().default(null),
})

export type Customer = z.infer<typeof customerSchema>
