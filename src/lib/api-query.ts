import { z } from 'zod'

/** Pagination metadata returned by every list endpoint. */
export const metaSchema = z.object({
  current_page: z.number(),
  last_page: z.number(),
  per_page: z.number(),
  total: z.number(),
})

/** Pagination metadata for a list response. Pages are 1-based. */
export type Meta = z.infer<typeof metaSchema>

const linksSchema = z.object({
  first_page: z.string().nullable(),
  last_page: z.string().nullable(),
  previous_page: z.string().nullable(),
  next_page: z.string().nullable(),
})

/**
 * Build the schema for a list response.
 *
 * The API keys collections by their plural resource name rather than a generic
 * `data`, so the key is passed in: `paginatedSchema(productSchema, 'products')`.
 */
export function paginatedSchema<T extends z.ZodTypeAny>(item: T, key: string) {
  return z.object({
    [key]: z.array(item),
    links: linksSchema,
    meta: metaSchema,
  })
}

/** A page of results, normalised so callers never care about the key name. */
export type Paginated<T> = {
  items: T[]
  meta: Meta
}

/**
 * Table state in the shape a list endpoint understands.
 *
 * Pass to {@link buildListParams} rather than constructing query strings by
 * hand — filter keys are bracketed (`filter[status]`) and arrays are
 * comma-joined, both easy to get subtly wrong.
 */
export type ListParams = {
  page?: number
  perPage?: number
  search?: string
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  /**
   * Whitelisted column filters. Arrays become CSV for `WHERE IN`; a
   * `{ from, to }` object becomes an inclusive range on a date column.
   */
  filters?: Record<string, unknown>
  /** Whitelisted relations to eager load. */
  include?: string[]
  /**
   * Include soft-deleted rows ('with') or show only them ('only').
   * Deletes are soft everywhere, so this is how deleted records are reached.
   */
  trashed?: 'with' | 'only'
}

/**
 * Translate table state into the API's query-parameter contract.
 *
 * Empty values are omitted rather than sent blank, which keeps URLs readable
 * and avoids the API treating `""` as a real filter value.
 */
export function buildListParams(params: ListParams): Record<string, unknown> {
  const query: Record<string, unknown> = {}

  if (params.page) query.page = params.page
  if (params.perPage) query.per_page = params.perPage

  const search = params.search?.trim()
  if (search) query.search = search

  if (params.sortBy) {
    query.sort_by = params.sortBy
    query.sort_dir = params.sortDir ?? 'asc'
  }

  if (params.include?.length) query.include = params.include.join(',')

  if (params.trashed === 'with') query.with_trashed = 1
  if (params.trashed === 'only') query.only_trashed = 1

  for (const [field, value] of Object.entries(params.filters ?? {})) {
    if (value === undefined || value === null || value === '') continue

    if (Array.isArray(value)) {
      if (value.length === 0) continue
      query[`filter[${field}]`] = value.join(',')
      continue
    }

    // A `{ from, to }` pair is a date range. Each bound is optional, so an
    // open-ended "everything since Monday" sends only `from`.
    if (typeof value === 'object') {
      const { from, to } = value as { from?: unknown; to?: unknown }
      if (from) query[`filter[${field}][from]`] = from
      if (to) query[`filter[${field}][to]`] = to
      continue
    }

    query[`filter[${field}]`] = value
  }

  return query
}
