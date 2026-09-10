import { env } from '@/env'

/**
 * The public address a certificate is verified at.
 *
 * One place builds this so the link staff copy, the QR code the backend will
 * eventually encode, and the route that answers it cannot drift apart. The path
 * must match `routes/(public)/verify.$token.tsx`.
 *
 * @param token - The certificate's 64-character verification token.
 * @returns An absolute URL anyone can open without signing in.
 */
export function verificationUrl(token: string): string {
  const base =
    env.VITE_PUBLIC_BASE_URL ??
    (typeof window === 'undefined' ? '' : window.location.origin)

  return `${base.replace(/\/$/, '')}/verify/${token}`
}
