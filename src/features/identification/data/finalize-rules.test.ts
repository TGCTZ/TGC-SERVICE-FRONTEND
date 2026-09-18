import { describe, expect, it } from 'vitest'
import {
  FINALIZE_REQUIRED_NAMES,
  listLabels,
  missingForFinalize,
} from '@/features/identification/data/finalize-rules'
import { reportSchema } from '@/features/identification/data/schema'

/**
 * The completeness rule the sign-off gate rests on.
 *
 * The server is the enforcement point; this copy exists so Finalize can refuse
 * before spending a round trip, and so the form can mark the four fields. If
 * the two drift, the dialog offers a button the API then rejects — which is the
 * failure these assertions are here to catch.
 */
function report(overrides: Record<string, unknown> = {}) {
  return reportSchema.parse({
    id: 1,
    stone: 1,
    report_number: 'TGC-2026-2027-0001',
    is_finalized: false,
    species: 3,
    color: 4,
    stone_weight: '2.500',
    conclusion: 'Natural ruby.',
    ...overrides,
  })
}

describe('missingForFinalize', () => {
  it('finds nothing missing in a complete report', () => {
    expect(missingForFinalize(report())).toEqual([])
  })

  it('names every unanswered field, not just the first', () => {
    const blank = report({
      species: null,
      color: null,
      stone_weight: null,
      conclusion: '',
    })

    expect(missingForFinalize(blank)).toEqual([
      'species',
      'colour',
      'weight',
      'conclusion',
    ])
  })

  it('reads weight from the stone, where it is actually stored', () => {
    // The form collects weight alongside the findings, but the API writes it to
    // the stone - so a report object carries it as `stone_weight`.
    expect(missingForFinalize(report({ stone_weight: null }))).toEqual([
      'weight',
    ])
  })

  it('treats a whitespace-only conclusion as unwritten', () => {
    expect(missingForFinalize(report({ conclusion: '   ' }))).toEqual([
      'conclusion',
    ])
  })

  it('marks exactly the four fields the form should flag', () => {
    expect([...FINALIZE_REQUIRED_NAMES].sort()).toEqual([
      'color',
      'conclusion',
      'species',
      'weight',
    ])
  })
})

describe('listLabels', () => {
  it('reads as a sentence at every length', () => {
    expect(listLabels([])).toBe('')
    expect(listLabels(['weight'])).toBe('weight')
    expect(listLabels(['species', 'weight'])).toBe('species and weight')
    expect(listLabels(['species', 'colour', 'weight'])).toBe(
      'species, colour and weight'
    )
  })
})
