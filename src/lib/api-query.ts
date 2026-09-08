import { z } from 'zod'

/**
 * Rows per page when the caller does not ask for a specific size.
 *
 * Must track `StandardPagination.page_size` on the API. The value is needed
 * client-side because the list envelope reports a total row count but not the
 * page size used to produce it, so `last_page` cannot be derived without it.
 */
export const DEFAULT_PAGE_SIZE = 15

/** Pagination metadata for a list response. Pages are 1-based. */
export type Meta = {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

/**
 * Build the schema for a list response.
 *
 * The API returns a fixed envelope for every collection - a total `count`, the
 * adjacent page URLs, and the rows under `results` - so unlike a
 * resource-keyed API there is no collection name to pass in.
 */
export function paginatedSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    count: z.number(),
    next: z.string().nullable(),
    previous: z.string().nullable(),
    results: z.array(item),
  })
}

/** A page of results, normalised for the table components. */
export type Paginated<T> = {
  items: T[]
  meta: Meta
}

/**
 * Convert a list envelope into the shape the table components consume.
 *
 * The envelope carries `count` but neither the current page nor the page size,
 * because the client supplied both in the request. They are read back off the
 * request parameters rather than the response, which is why this takes the same
 * `params` that produced the call.
 *
 * @param envelope - Parsed response from a {@link paginatedSchema}.
 * @param params - The list parameters the request was built from.
 * @returns Rows plus 1-based pagination metadata.
 */
export function toPaginated<T>(
  envelope: { count: number; results: T[] },
  params: ListParams
): Paginated<T> {
  const perPage = params.perPage ?? DEFAULT_PAGE_SIZE

  return {
    items: envelope.results,
    meta: {
      current_page: params.page ?? 1,
      // An empty collection still has one (empty) page; a last_page of 0 makes
      // the pager render "Page 1 of 0".
      last_page: Math.max(1, Math.ceil(envelope.count / perPage)),
      per_page: perPage,
      total: envelope.count,
    },
  }
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
  if (params.perPage) query.page_size = params.perPage

  const search = params.search?.trim()
  if (search) query.search = search

  // Ordering is a single parameter, with a leading `-` for descending, rather
  // than a field/direction pair.
  if (params.sortBy) {
    const prefix = params.sortDir === 'desc' ? '-' : ''
    query.ordering = `${prefix}${params.sortBy}`
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
