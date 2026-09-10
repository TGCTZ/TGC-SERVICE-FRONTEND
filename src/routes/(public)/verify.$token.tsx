import { createFileRoute } from '@tanstack/react-router'
import { VerifyCertificate } from '@/features/verify'

/**
 * Public certificate verification.
 *
 * A pathless group beside `(auth)` and `(errors)`, so it renders outside
 * `_authenticated`: the visitor is whoever holds the printed certificate, and
 * they have no account. No `beforeLoad` guard, and nothing here touches the
 * auth store.
 */
export const Route = createFileRoute('/(public)/verify/$token')({
  component: VerifyCertificate,
})
