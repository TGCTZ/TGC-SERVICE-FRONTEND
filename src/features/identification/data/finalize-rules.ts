import { type IdentificationReport } from './schema'

/**
 * What a report must answer before the service will lock it.
 *
 * Mirrors `FINALIZE_REQUIRED_FIELDS` in
 * `backend/apps/identification/services/report.py`. The server is the
 * enforcement point — this copy exists so the requirement can be shown while
 * the findings are being recorded, and so Finalize can refuse before spending a
 * round trip on a rejection.
 *
 * Deliberately short: a certificate quotes these four — what the stone is, what
 * it looks like, how big it is, and the verdict. Everything else is situational,
 * because a stone may legitimately defeat a test and still deserve a
 * certificate, which is why the form itself stays permissive.
 */
export const FINALIZE_REQUIRED_FIELDS = [
  { name: 'species', label: 'species' },
  { name: 'color', label: 'colour' },
  { name: 'weight', label: 'weight' },
  { name: 'conclusion', label: 'conclusion' },
] as const

/** Field names the form should mark as needed before sign-off. */
export const FINALIZE_REQUIRED_NAMES: ReadonlySet<string> = new Set(
  FINALIZE_REQUIRED_FIELDS.map((field) => field.name)
)

/**
 * Labels of the required findings a report has not answered yet.
 *
 * `weight` is read from `stone_weight`: the form collects it alongside the
 * findings but it is stored on the stone, which is also where certification
 * looks for it.
 */
export function missingForFinalize(report: IdentificationReport): string[] {
  const answered: Record<string, unknown> = {
    species: report.species,
    color: report.color,
    weight: report.stone_weight,
    conclusion: report.conclusion.trim(),
  }

  return FINALIZE_REQUIRED_FIELDS.filter((field) => !answered[field.name]).map(
    (field) => field.label
  )
}

/** "species and colour", "species, colour and weight" — for a sentence. */
export function listLabels(labels: string[]): string {
  if (labels.length <= 1) return labels.join('')
  return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`
}
