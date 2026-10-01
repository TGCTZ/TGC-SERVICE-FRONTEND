/**
 * Tanzania's 31 administrative regions (mikoa): 26 on the mainland, 5 in
 * Zanzibar. Mirrors `Region` in backend apps/gems/enums.py - `value` is what
 * the API stores and accepts; nothing else is.
 *
 * Checked against the official list in September 2026; the newest region is
 * Songwe, split from Mbeya in 2016. Labels are the official Swahili names, and
 * `aliases` are the English names people also search by.
 */

type RegionZone = 'mainland' | 'zanzibar'

type Region = {
  value: string
  label: string
  zone: RegionZone
  aliases?: readonly string[]
}

/** All 31 regions, mainland first, each alphabetical - the order the dropdown lists them. */
export const REGIONS = [
  { value: 'arusha', label: 'Arusha', zone: 'mainland' },
  {
    value: 'dar_es_salaam',
    label: 'Dar es Salaam',
    zone: 'mainland',
    aliases: ['DSM'],
  },
  { value: 'dodoma', label: 'Dodoma', zone: 'mainland' },
  { value: 'geita', label: 'Geita', zone: 'mainland' },
  { value: 'iringa', label: 'Iringa', zone: 'mainland' },
  { value: 'kagera', label: 'Kagera', zone: 'mainland' },
  { value: 'katavi', label: 'Katavi', zone: 'mainland' },
  { value: 'kigoma', label: 'Kigoma', zone: 'mainland' },
  { value: 'kilimanjaro', label: 'Kilimanjaro', zone: 'mainland' },
  { value: 'lindi', label: 'Lindi', zone: 'mainland' },
  { value: 'manyara', label: 'Manyara', zone: 'mainland' },
  { value: 'mara', label: 'Mara', zone: 'mainland' },
  { value: 'mbeya', label: 'Mbeya', zone: 'mainland' },
  { value: 'morogoro', label: 'Morogoro', zone: 'mainland' },
  { value: 'mtwara', label: 'Mtwara', zone: 'mainland' },
  { value: 'mwanza', label: 'Mwanza', zone: 'mainland' },
  { value: 'njombe', label: 'Njombe', zone: 'mainland' },
  { value: 'pwani', label: 'Pwani', zone: 'mainland', aliases: ['Coast'] },
  { value: 'rukwa', label: 'Rukwa', zone: 'mainland' },
  { value: 'ruvuma', label: 'Ruvuma', zone: 'mainland' },
  { value: 'shinyanga', label: 'Shinyanga', zone: 'mainland' },
  { value: 'simiyu', label: 'Simiyu', zone: 'mainland' },
  { value: 'singida', label: 'Singida', zone: 'mainland' },
  { value: 'songwe', label: 'Songwe', zone: 'mainland' },
  { value: 'tabora', label: 'Tabora', zone: 'mainland' },
  { value: 'tanga', label: 'Tanga', zone: 'mainland' },
  {
    value: 'kaskazini_pemba',
    label: 'Kaskazini Pemba',
    zone: 'zanzibar',
    aliases: ['Pemba North'],
  },
  {
    value: 'kaskazini_unguja',
    label: 'Kaskazini Unguja',
    zone: 'zanzibar',
    aliases: ['Unguja North', 'Zanzibar North'],
  },
  {
    value: 'kusini_pemba',
    label: 'Kusini Pemba',
    zone: 'zanzibar',
    aliases: ['Pemba South'],
  },
  {
    value: 'kusini_unguja',
    label: 'Kusini Unguja',
    zone: 'zanzibar',
    aliases: ['Unguja South', 'Zanzibar South'],
  },
  {
    value: 'mjini_magharibi',
    label: 'Mjini Magharibi',
    zone: 'zanzibar',
    aliases: ['Urban West', 'Zanzibar City'],
  },
] as const satisfies readonly Region[]

/** The dropdown's groups, in display order. */
export const REGION_ZONES: { zone: RegionZone; label: string }[] = [
  { zone: 'mainland', label: 'Mainland' },
  { zone: 'zanzibar', label: 'Zanzibar' },
]

const BY_VALUE = new Map<string, Region>(
  REGIONS.map((region) => [region.value, region])
)

/** Whether `value` is one of the region values the API accepts. */
export function isRegion(value: string | null | undefined): boolean {
  return !!value && BY_VALUE.has(value)
}

/**
 * A stored region as a reader should see it: its name, or - for a customer
 * saved before regions were a list - the text that was typed, unchanged.
 */
export function regionLabel(value: string | null | undefined): string {
  if (!value) return ''
  return BY_VALUE.get(value)?.label ?? value
}
