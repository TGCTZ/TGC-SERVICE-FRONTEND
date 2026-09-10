import { z } from 'zod'
import axios from 'axios'
import { queryOptions } from '@tanstack/react-query'
import { env } from '@/env'

/**
 * A bare client, deliberately not `@/lib/api`.
 *
 * The shared instance attaches whatever token is in cookies and runs the
 * refresh dance on a 401 — both wrong for an anonymous visitor holding a
 * printed certificate. Worse, a stale cookie could make a public check appear
 * to fail, or send a staff token to a page that has no business carrying one.
 */
const publicApi = axios.create({
  baseURL: env.VITE_API_URL,
  headers: { Accept: 'application/json' },
})

/**
 * What the public endpoint is willing to say.
 *
 * Deliberately narrow, and matched to `PublicCertificateSerializer`: enough to
 * answer "is this document genuine, and does it still stand", with nothing
 * about the customer, the order or the audit trail.
 */
export const publicCertificateSchema = z.object({
  certificate_number: z.string(),
  status: z.string(),
  /** False once revoked — the certificate resolves, but no longer stands. */
  is_valid: z.boolean(),
  issued_at: z.string().nullable().default(null),
  stone_type_snapshot: z.string().nullable().default(''),
  weight_snapshot: z.string().nullable().default(''),
  color_snapshot: z.string().nullable().default(''),
  origin_snapshot: z.string().nullable().default(''),
  gemmologist: z.string().nullable().default(''),
})

export type PublicCertificate = z.infer<typeof publicCertificateSchema>

/**
 * Look up a certificate by its verification token.
 *
 * Returns null when nothing matches, rather than throwing: "no certificate
 * matches this code" is an answer, not an error, and the page renders it as
 * one. Every hit is logged server-side, which is why this is never retried.
 *
 * @param token - 64 hex characters from the printed certificate.
 */
export const verifyCertificateQuery = (token: string) =>
  queryOptions({
    queryKey: ['verify', token],
    retry: false,
    queryFn: async (): Promise<PublicCertificate | null> => {
      try {
        const res = await publicApi.get(`/certificates/verify/${token}/`)
        return publicCertificateSchema.parse(res.data)
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          return null
        }
        throw error
      }
    },
  })
