import { z } from 'zod'

/** Mirrors `CertificateStatus` in `apps/gems/enums.py`. */
export const CERTIFICATE_STATUS_LABELS: Record<string, string> = {
  issued: 'Issued',
  revoked: 'Revoked',
}

/**
 * A certificate as the lab sees it.
 *
 * Write-once: everything but `stone` is minted by the issuing service — the
 * number, the verification token and the four snapshots have to be created
 * together or the document does not mean anything.
 *
 * The snapshots are copies, not joins, and that is the point: a certificate
 * must keep saying what it said on the day it was issued, even if the stone
 * type is later renamed or the colour retired.
 */
export const certificateSchema = z.object({
  id: z.number(),
  stone: z.number(),
  stone_label: z.string().nullable().default(null),
  order_reference: z.string().nullable().default(null),
  customer_name: z.string().nullable().default(null),
  report: z.number().nullable().default(null),
  report_number: z.string().nullable().default(null),

  certificate_number: z.string(),
  /** 64 hex characters. The only thing needed to verify the document. */
  verification_token: z.string(),

  stone_type_snapshot: z.string().nullable().default(''),
  weight_snapshot: z.string().nullable().default(''),
  color_snapshot: z.string().nullable().default(''),
  origin_snapshot: z.string().nullable().default(''),
  gemmologist: z.string().nullable().default(''),

  qr_code: z.string().nullable().default(null),
  pdf_file: z.string().nullable().default(null),

  status: z.string(),
  issued_by: z.number().nullable().default(null),
  issued_by_label: z.string().nullable().default(null),
  issued_at: z.string().nullable().default(null),

  created_at: z.string().nullable().default(null),
  updated_at: z.string().nullable().default(null),
  deleted_at: z.string().nullable().default(null),
})

export type Certificate = z.infer<typeof certificateSchema>

/** One public verification hit. An append-only ledger. */
export const accessLogSchema = z.object({
  id: z.number(),
  certificate: z.number(),
  accessed_at: z.string(),
  ip_address: z.string().nullable().default(null),
  user_agent: z.string().nullable().default(''),
})

export type CertificateAccessLog = z.infer<typeof accessLogSchema>
