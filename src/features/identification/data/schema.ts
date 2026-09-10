import { z } from 'zod'

/** A reference row expanded alongside its id. */
const relatedSchema = z.object({ id: z.number(), name: z.string() }).loose()

/** One instrument used during a report, with its reading. */
export const instrumentUsedSchema = z.object({
  id: z.number(),
  report: z.number(),
  instrument: z.number(),
  instrument_detail: relatedSchema.nullable().default(null),
  reading: z.string().default(''),
})

export type InstrumentUsed = z.infer<typeof instrumentUsedSchema>

/**
 * A gemmologist's findings for one stone.
 *
 * Every finding is optional: a report is built up over a sitting at the bench,
 * and a stone may defeat one test while answering another. What makes it
 * authoritative is `is_finalized`, which is one-way and moves only through
 * `POST {id}/finalize/`.
 *
 * `report_number`, `is_finalized`, `identified_by` and `identified_at` are all
 * read-only — the service writes them.
 */
export const reportSchema = z.object({
  id: z.number(),
  stone: z.number(),
  stone_label: z.string().nullable().default(null),
  order_reference: z.string().nullable().default(null),
  report_number: z.string(),

  species: z.number().nullable().default(null),
  species_detail: relatedSchema.nullable().default(null),
  variety: z.number().nullable().default(null),
  variety_detail: relatedSchema.nullable().default(null),
  origin: z.number().nullable().default(null),
  origin_detail: relatedSchema.nullable().default(null),
  shape_cut: z.number().nullable().default(null),
  shape_cut_detail: relatedSchema.nullable().default(null),
  color: z.number().nullable().default(null),
  color_detail: relatedSchema.nullable().default(null),

  nature_type: z.string().default(''),
  transparency: z.string().default(''),
  treatment: z.string().default(''),
  optic_character: z.string().default(''),

  dimensions: z.string().default(''),
  refractive_index: z.string().default(''),
  // A decimal, so it crosses the wire as a string.
  specific_gravity: z.string().nullable().default(null),
  is_polished: z.boolean().default(false),
  conclusion: z.string().default(''),

  instruments_used: z.array(instrumentUsedSchema).default([]),

  is_finalized: z.boolean().default(false),
  identified_by: z.number().nullable().default(null),
  identified_by_label: z.string().nullable().default(null),
  identified_at: z.string().nullable().default(null),

  created_at: z.string().nullable().default(null),
  updated_at: z.string().nullable().default(null),
  deleted_at: z.string().nullable().default(null),
})

export type IdentificationReport = z.infer<typeof reportSchema>
