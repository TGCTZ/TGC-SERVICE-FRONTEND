/**
 * Identification enums, mirrored from `apps/gems/enums.py`.
 *
 * The API exposes no choices endpoint for these, so they are kept here and must
 * be changed in step with the backend. Every one of them is optional on the
 * model (`blank=True, default=""`), which is why each select offers a "not
 * recorded" choice: a stone can defeat one test while answering another.
 */

export type EnumOption = { value: string; label: string }

/** Whether the stone is natural or man-made/altered. */
export const NATURE_TYPES: EnumOption[] = [
  { value: 'natural', label: 'Natural' },
  { value: 'synthetic', label: 'Synthetic' },
  { value: 'treated', label: 'Treated' },
  { value: 'enhanced', label: 'Enhanced' },
  { value: 'artificial', label: 'Artificial' },
]

/** How light passes through the stone. */
export const TRANSPARENCIES: EnumOption[] = [
  { value: 'transparent', label: 'Transparent' },
  { value: 'translucent', label: 'Translucent' },
  { value: 'opaque', label: 'Opaque' },
]

/** Enhancement applied to the stone, if any. */
export const TREATMENTS: EnumOption[] = [
  { value: 'none', label: 'None' },
  { value: 'heated', label: 'Heated' },
  { value: 'oiled', label: 'Oiled' },
  { value: 'dyed', label: 'Dyed' },
  { value: 'irradiated', label: 'Irradiated' },
  { value: 'fracture_filled', label: 'Fracture filled' },
  { value: 'bleached', label: 'Bleached' },
  { value: 'impregnated', label: 'Impregnated' },
]

/**
 * Optical behaviour under polarised light.
 *
 * The stored value is the lowercase code; the label carries the expansion the
 * printed report uses, so the two must stay together.
 */
export const OPTIC_CHARACTERS: EnumOption[] = [
  { value: 'sr', label: 'SR — Singly refractive' },
  { value: 'adr', label: 'ADR — Anomalous double refractive' },
  { value: 'dr', label: 'DR — Double refractive' },
  { value: 'agg', label: 'AGG — Aggregate' },
]
