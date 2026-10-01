import { describe, expect, it } from 'vitest'
import { isRegion, REGIONS, regionLabel } from './regions'

describe('REGIONS', () => {
  it('lists all 31: 26 on the mainland and 5 in Zanzibar', () => {
    expect(REGIONS).toHaveLength(31)
    expect(REGIONS.filter((r) => r.zone === 'mainland')).toHaveLength(26)
    expect(REGIONS.filter((r) => r.zone === 'zanzibar')).toHaveLength(5)
    expect(new Set(REGIONS.map((r) => r.value)).size).toBe(31)
  })
})

describe('regionLabel', () => {
  it('names a region by its official label', () => {
    expect(regionLabel('dar_es_salaam')).toBe('Dar es Salaam')
    expect(regionLabel('kaskazini_pemba')).toBe('Kaskazini Pemba')
  })

  it('shows free text from before the list exactly as it was typed', () => {
    expect(regionLabel('Hoffmanview')).toBe('Hoffmanview')
    expect(isRegion('Hoffmanview')).toBe(false)
    expect(regionLabel('')).toBe('')
  })
})
