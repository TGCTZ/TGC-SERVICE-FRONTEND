import { z } from 'zod'
import { DEFAULT_CURRENCY } from '@/lib/format'

/** A lookup row (category, brand, status, unit of measure, tag). */
export const lookupSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    description: z.string().nullable().default(null),
    is_active: z.boolean().default(true),
  })
  .loose()

export type Lookup = z.infer<typeof lookupSchema>

export const productImageSchema = z.object({
  id: z.number(),
  product: z.number(),
  image: z.string(),
  alt_text: z.string().nullable().default(null),
  sort_order: z.number().default(0),
  is_primary: z.boolean().default(false),
})

export type ProductImage = z.infer<typeof productImageSchema>

/**
 * A product as returned by the API.
 *
 * Money and decimal columns arrive as strings - the API renders decimals as
 * strings to avoid float precision loss - so they are coerced to numbers here
 * once, at the boundary, rather than in every component that formats them.
 */
export const productSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  sku: z.string(),
  barcode: z.string().nullable().default(null),

  short_description: z.string().nullable().default(null),
  description: z.string().nullable().default(null),

  /*
   * Relations arrive as two fields: the bare name holds the foreign key, and
   * `<field>_detail` holds the expanded object. The id is what writes send
   * back, so it keeps the plain name; the detail is read-only.
   */
  product_category: z.number().nullable().default(null),
  product_category_detail: lookupSchema.nullable().default(null),
  brand: z.number().nullable().default(null),
  brand_detail: lookupSchema.nullable().default(null),
  product_status: z.number().nullable().default(null),
  product_status_detail: lookupSchema.nullable().default(null),
  unit_of_measure: z.number().nullable().default(null),
  unit_of_measure_detail: lookupSchema.nullable().default(null),

  price: z.coerce.number(),
  cost_price: z.coerce.number().nullable().default(null),
  discount_percentage: z.coerce.number().nullable().default(null),
  tax_rate: z.coerce.number().nullable().default(null),
  currency: z.string().default(DEFAULT_CURRENCY),

  stock_quantity: z.number().default(0),
  reorder_level: z.number().nullable().default(null),
  weight: z.coerce.number().nullable().default(null),
  length: z.coerce.number().nullable().default(null),
  width: z.coerce.number().nullable().default(null),
  height: z.coerce.number().nullable().default(null),
  warranty_months: z.number().nullable().default(null),
  rating: z.coerce.number().nullable().default(null),

  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  is_digital: z.boolean().default(false),
  requires_shipping: z.boolean().default(true),

  released_at: z.string().nullable().default(null),
  available_from: z.string().nullable().default(null),
  expiry_date: z.string().nullable().default(null),

  specifications: z.record(z.string(), z.unknown()).nullable().default(null),
  metadata: z.record(z.string(), z.unknown()).nullable().default(null),

  color: z.string().nullable().default(null),
  website_url: z.string().nullable().default(null),
  contact_email: z.string().nullable().default(null),

  image: z.string().nullable().default(null),

  tags: z.array(z.number()).default([]),
  tags_detail: z.array(lookupSchema).default([]),
  images: z.array(productImageSchema).default([]),

  created_at: z.string().nullable().default(null),
  updated_at: z.string().nullable().default(null),
  deleted_at: z.string().nullable().default(null),
})

export type Product = z.infer<typeof productSchema>
