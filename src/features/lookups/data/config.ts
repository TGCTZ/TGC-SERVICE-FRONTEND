import { z } from 'zod'
import { type PermissionResource } from '@/lib/permissions'

/**
 * Lookup (reference-data) screens.
 *
 * Every lookup endpoint in the API shares one contract — `name`,
 * `description`, `is_active`, soft deletes, restore — so all of them are
 * served by a single screen (`features/lookups/`) parameterised by the
 * `lookupConfigs` array below, rather than by a near-identical feature folder
 * each.
 */

/**
 * How an extra field is edited and rendered.
 *
 * `select` covers two different sources: a fixed list supplied inline through
 * `options` (an API enum, which has no endpoint of its own), or the rows of
 * another reference table through `optionsFrom`.
 */
export type LookupFieldType =
  | 'text'
  | 'url'
  | 'color'
  | 'select'
  | 'number'
  | 'money'

export type LookupField = {
  key: string
  label: string
  type?: LookupFieldType
  /** Fixed choices for a `select`, for values the API defines as an enum. */
  options?: { value: string; label: string }[]
  /**
   * Reference table to draw a `select`'s options from.
   *
   * The API exposes the chosen row twice — the id under `key`, and the whole
   * row under `<key>_detail` — so the table column can render a name without a
   * second request.
   */
  optionsFrom?: PermissionResource
  placeholder?: string
  required?: boolean
}

export type LookupConfig = {
  /**
   * URL segment, e.g. `shape-cuts`.
   *
   * Typed against the permission registry rather than left as a free string:
   * the screen resolves its own gates through `perm(resource, …)`, so a segment
   * with no registry entry is a compile error instead of a screen that silently
   * hides itself from every user.
   */
  resource: PermissionResource
  /** Route path segment under /lookups. */
  slug: string
  title: string
  description: string
  /**
   * Beyond `name`, `description` and `is_active`.
   *
   * Keep to two: the table renders Name, up to two extras, then Active, and a
   * fifth column pushes the row actions off a laptop screen.
   */
  extraFields: LookupField[]
}

/**
 * Stone classification. Mirrors `StoneCategory` in `apps/gems/enums.py`.
 *
 * Inlined rather than fetched: the API exposes no choices endpoint, and three
 * strings are cheaper to keep in step than an endpoint to build.
 */
const STONE_CATEGORIES = [
  { value: 'precious', label: 'Precious' },
  { value: 'semi_precious', label: 'Semi-precious' },
  { value: 'diamond', label: 'Diamond' },
]

/** Broad colour families. Mirrors `ColorGroup` in `apps/gems/enums.py`. */
const COLOR_GROUPS = [
  { value: 'white_grey_black', label: 'White / Grey / Black' },
  { value: 'purple_violet', label: 'Purple / Violet' },
  { value: 'red_pink', label: 'Red / Pink' },
  { value: 'orange_yellow', label: 'Orange / Yellow' },
  { value: 'green', label: 'Green' },
  { value: 'blue', label: 'Blue' },
]

/**
 * The reference tables the lab maintains.
 *
 * Adding one takes three edits and no new components:
 *
 *   1. An entry here — `resource` doubles as the URL segment *and* the subject
 *      of its permission gates (`gems.view_color`, …), so it must match the API
 *      exactly.
 *   2. A sidebar link under Reference data.
 *   3. An entry in `lib/subject-types.ts`, if you want its audit history.
 */
const lookupConfigs: LookupConfig[] = [
  {
    resource: 'stone-types',
    slug: 'stone-types',
    title: 'Stone types',
    description:
      'What the lab identifies, and the flat fee charged for each. An unpriced type cannot be billed.',
    extraFields: [
      {
        key: 'category',
        label: 'Category',
        type: 'select',
        options: STONE_CATEGORIES,
        required: true,
      },
      { key: 'price', label: 'Identification fee', type: 'money' },
    ],
  },
  {
    resource: 'species',
    slug: 'species',
    title: 'Species',
    description: 'Gemmological species, the parent of a variety.',
    extraFields: [],
  },
  {
    resource: 'varieties',
    slug: 'varieties',
    title: 'Varieties',
    description:
      'A variety within a species. Two species may each have a variety of the same name.',
    extraFields: [
      {
        key: 'species',
        label: 'Species',
        type: 'select',
        optionsFrom: 'species',
        required: true,
      },
    ],
  },
  {
    resource: 'colors',
    slug: 'colors',
    title: 'Colours',
    description: 'Observed stone colours, filed under a broad colour family.',
    extraFields: [
      {
        key: 'group',
        label: 'Colour family',
        type: 'select',
        options: COLOR_GROUPS,
        required: true,
      },
    ],
  },
  {
    resource: 'origins',
    slug: 'origins',
    title: 'Origins',
    description: 'Where a stone was mined.',
    extraFields: [],
  },
  {
    resource: 'shape-cuts',
    slug: 'shape-cuts',
    title: 'Shapes and cuts',
    description: 'How a stone has been shaped or faceted.',
    extraFields: [],
  },
  {
    resource: 'instruments',
    slug: 'instruments',
    title: 'Instruments',
    description: 'Bench instruments a gemmologist records readings from.',
    extraFields: [],
  },
  {
    resource: 'user-statuses',
    slug: 'user-statuses',
    title: 'User statuses',
    description: 'The states an account can be in.',
    extraFields: [],
  },
  {
    resource: 'genders',
    slug: 'genders',
    title: 'Genders',
    description:
      'Self-described gender options, editable rather than hardcoded.',
    extraFields: [],
  },
]

export function lookupConfigBySlug(slug: string): LookupConfig | undefined {
  return lookupConfigs.find((config) => config.slug === slug)
}

/** Every configured lookup, for building navigation. */
export function allLookupConfigs(): LookupConfig[] {
  return lookupConfigs
}

/**
 * A lookup row.
 *
 * `.loose()` keeps the per-resource extras (category, price, species and its
 * expanded `species_detail`) without needing a schema per lookup — they are
 * read through the config's `extraFields` rather than by name.
 */
export const lookupRowSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    description: z.string().nullable().default(null),
    is_active: z.boolean().default(true),
    created_at: z.string().nullable().default(null),
    updated_at: z.string().nullable().default(null),
    deleted_at: z.string().nullable().default(null),
  })
  .loose()

export type LookupRow = z.infer<typeof lookupRowSchema>

/**
 * One option in a reference-table dropdown.
 *
 * `.loose()` because the endpoint returns the whole row; only the id and name
 * are needed to render a choice.
 */
export const lookupOptionSchema = z
  .object({
    id: z.number(),
    name: z.string(),
  })
  .loose()

export type LookupOption = z.infer<typeof lookupOptionSchema>
