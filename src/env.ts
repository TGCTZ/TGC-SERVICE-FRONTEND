import { z } from 'zod'

/**
 * Runtime environment variables, validated once at startup.
 *
 * Add every `VITE_`-prefixed variable your app relies on to the schema below.
 * This module is imported early in `main.tsx` so that a missing or malformed
 * variable fails loudly and immediately with a clear message, rather than
 * surfacing later as a confusing runtime bug.
 */
const envSchema = z.object({
  /**
   * Base URL of the backend API. Optional so the template boots without one.
   * An empty string (the default in .env.example) is treated as "unset".
   */
  VITE_API_URL: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.string().url().optional()
  ),

  /**
   * Public origin a certificate's verification link points at.
   *
   * Optional: it falls back to wherever the app is being served from, which is
   * right in every ordinary deployment. Set it when the printed link must reach
   * a different host than the staff app runs on - and set the backend to the
   * same value, since the QR code it will encode has to agree with the link
   * staff copy.
   */
  VITE_PUBLIC_BASE_URL: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.string().url().optional()
  ),
})

const parsed = envSchema.safeParse(import.meta.env)

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error(
    '❌ Invalid environment variables:',
    parsed.error.flatten().fieldErrors
  )
  throw new Error('Invalid environment variables. Check your .env file.')
}

/** Validated, typed environment variables. */
export const env = parsed.data
