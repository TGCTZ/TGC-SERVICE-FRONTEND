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
 * number and every snapshot have to be created together or the document does
 * not mean anything.
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
  customer_phone: z.string().nullable().default(null),
  report: z.number().nullable().default(null),
  report_number: z.string().nullable().default(null),

  certificate_number: z.string(),

  stone_type_snapshot: z.string().nullable().default(''),
  weight_snapshot: z.string().nullable().default(''),
  weight_unit_snapshot: z.string().nullable().default('carat'),
  color_snapshot: z.string().nullable().default(''),
  origin_snapshot: z.string().nullable().default(''),

  /*
   * The rest of what the printed document states, frozen at issue.
   *
   * Every one is a plain string on the wire, including specific gravity — a
   * decimal crosses as text to keep its precision. `instruments_snapshot` is a
   * JSON list of {name, used}, not a relation. Certificates from
   * before the checklist list only the instruments used, with no `used` key.
   */
  species_snapshot: z.string().nullable().default(''),
  variety_snapshot: z.string().nullable().default(''),
  shape_cut_snapshot: z.string().nullable().default(''),
  transparency_snapshot: z.string().nullable().default(''),
  optic_character_snapshot: z.string().nullable().default(''),
  treatment_snapshot: z.string().nullable().default(''),
  nature_type_snapshot: z.string().nullable().default(''),
  refractive_index_snapshot: z.string().nullable().default(''),
  specific_gravity_snapshot: z.string().nullable().default(''),
  comments_snapshot: z.string().nullable().default(''),
  instruments_snapshot: z
    .array(
      z.object({
        name: z.string().default(''),
        used: z.boolean().default(true),
      })
    )
    .default([]),
  /** The lab's full instrument list with this certificate's ticks, as the PDF prints it. */
  instrument_checklist: z
    .array(z.object({ name: z.string(), used: z.boolean() }))
    .default([]),
  report_number_snapshot: z.string().nullable().default(''),
  /** Absolute URL of the photograph as it was at issue, or null. */
  photo_snapshot: z.string().nullable().default(null),

  gemmologist: z.string().nullable().default(''),
  gemmologist_two: z.string().nullable().default(''),

  status: z.string(),
  issued_by: z.number().nullable().default(null),
  issued_by_label: z.string().nullable().default(null),
  issued_at: z.string().nullable().default(null),

  created_at: z.string().nullable().default(null),
  updated_at: z.string().nullable().default(null),
  deleted_at: z.string().nullable().default(null),
})

export type Certificate = z.infer<typeof certificateSchema>
