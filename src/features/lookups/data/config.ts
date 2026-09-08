import { z } from 'zod'
import { type PermissionResource } from '@/lib/permissions'

/**
 * Lookup (reference-data) screens.
 *
 * Every lookup endpoint in the API shares one contract — `name`,
 * `description`, `is_active`, soft deletes, restore — so all of them are
 * served by a single screen (`features/lookups/`) parameterised by the
 * `lookupConfigs` array at the bottom of this file, rather than by a
 * near-identical feature folder each.
 */

/**
 * Extra fields a particular lookup carries beyond the shared contract.
 */
export type LookupFieldType = 'text' | 'url' | 'color' | 'select'

export type LookupField = {
  key: string
  label: string
  type?: LookupFieldType
  /** Loads options for a `select` field, e.g. the self-referencing parent. */
  optionsFrom?: string
  placeholder?: string
}

export type LookupConfig = {
  /**
   * URL segment, e.g. `product-categories`.
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
  extraFields: LookupField[]
}

/**
 * SWAP POINT — rewrite for your project.
 *
 * The example entries below are the bundled TestAPI's product catalogue.
 * Replace them with your own reference tables; the screen, the CRUD, the
 * soft-delete/restore flow and the permission gating all come for free.
 *
 * Adding a lookup takes three edits and no new components:
 *
 *   1. An entry here — `resource` doubles as the URL segment *and* the
 *      subject of its permission gates (`catalog.view_brand`, …), so it must
 *      match the API exactly.
 *   2. A sidebar link under Workspace → Reference data.
 *   3. An entry in `lib/subject-types.ts`, if you want its audit history.
 */
const lookupConfigs: LookupConfig[] = [
  {
    resource: 'product-categories',
    slug: 'product-categories',
    title: 'Product categories',
    description: 'Group products into a nestable category tree.',
    extraFields: [
      { key: 'slug', label: 'Slug', placeholder: 'auto-generated if blank' },
      {
        key: 'parent_id',
        label: 'Parent category',
        type: 'select',
        optionsFrom: 'product-categories',
      },
    ],
  },
  {
    resource: 'brands',
    slug: 'brands',
    title: 'Brands',
    description: 'Manufacturers and labels a product can belong to.',
    extraFields: [
      { key: 'slug', label: 'Slug', placeholder: 'auto-generated if blank' },
      { key: 'website_url', label: 'Website', type: 'url' },
      { key: 'country', label: 'Country' },
    ],
  },
  {
    resource: 'product-statuses',
    slug: 'product-statuses',
    title: 'Product statuses',
    description: 'Lifecycle states such as draft, published or archived.',
    extraFields: [{ key: 'color', label: 'Colour', type: 'color' }],
  },
  {
    resource: 'unit-of-measures',
    slug: 'unit-of-measures',
    title: 'Units of measure',
    description: 'How a product is counted, weighed or measured.',
    extraFields: [{ key: 'code', label: 'Code', placeholder: 'e.g. KG' }],
  },
  {
    resource: 'tags',
    slug: 'tags',
    title: 'Tags',
    description: 'Free-form labels that can be applied to many products.',
    extraFields: [
      { key: 'slug', label: 'Slug', placeholder: 'auto-generated if blank' },
      { key: 'color', label: 'Colour', type: 'color' },
    ],
  },
]

export function lookupConfigBySlug(slug: string): LookupConfig | undefined {
  return lookupConfigs.find((config) => config.slug === slug)
}

/**
 * A lookup row.
 *
 * `.loose()` keeps the per-resource extras (slug, code, colour, parent_id)
 * without needing a schema per lookup - they are read through the config's
 * `extraFields` rather than by name.
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
