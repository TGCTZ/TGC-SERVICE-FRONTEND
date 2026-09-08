import { z } from 'zod'

/** A lookup row (user status, gender). */
export const lookupSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    is_active: z.boolean().default(true),
  })
  .loose()

export type Lookup = z.infer<typeof lookupSchema>

/**
 * A user as returned by the API.
 *
 * `roles` and `permissions` are only present when the requester may see them
 * (the API hides them otherwise), so both default to an empty array rather
 * than being required.
 */
export const userSchema = z.object({
  id: z.number(),
  first_name: z.string(),
  middle_name: z.string().nullable().default(null),
  last_name: z.string(),
  full_name: z.string(),
  username: z.string(),
  email: z.string(),
  phone_number: z.string().nullable().default(null),

  avatar: z.string().nullable().default(null),

  date_of_birth: z.string().nullable().default(null),
  bio: z.string().nullable().default(null),
  address_line1: z.string().nullable().default(null),
  address_line2: z.string().nullable().default(null),
  city: z.string().nullable().default(null),
  state: z.string().nullable().default(null),
  postal_code: z.string().nullable().default(null),
  country: z.string().nullable().default(null),
  timezone: z.string().nullable().default(null),
  locale: z.string().nullable().default(null),

  last_login_at: z.string().nullable().default(null),
  is_active: z.boolean().default(true),

  /*
   * Relations arrive as two fields: the bare name holds the foreign key, and
   * `<field>_detail` holds the expanded object. The id is what writes send
   * back, so it keeps the plain name; the detail is read-only.
   */
  user_status: z.number().nullable().default(null),
  user_status_detail: lookupSchema.nullable().default(null),
  gender: z.number().nullable().default(null),
  gender_detail: lookupSchema.nullable().default(null),

  roles: z.array(z.string()).default([]),
  permissions: z.array(z.string()).default([]),

  created_at: z.string().nullable().default(null),
  updated_at: z.string().nullable().default(null),
  deleted_at: z.string().nullable().default(null),
})

export type User = z.infer<typeof userSchema>
