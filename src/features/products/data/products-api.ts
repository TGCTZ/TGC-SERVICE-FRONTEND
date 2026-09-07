import { z } from 'zod'
import { queryOptions } from '@tanstack/react-query'
import { api } from '@/lib/api'
import {
  buildListParams,
  metaSchema,
  paginatedSchema,
  type ListParams,
  type Paginated,
} from '@/lib/api-query'
import {
  lookupSchema,
  productSchema,
  type Lookup,
  type Product,
} from './schema'

// A literal key (rather than the generic helper) keeps TypeScript's inference
// intact, so `parsed.products` is properly typed.
const listSchema = z.object({
  products: z.array(productSchema),
  meta: metaSchema,
})

/** Fetch one page of products, validated at the network boundary. */
export async function fetchProducts(
  params: ListParams
): Promise<Paginated<Product>> {
  const res = await api.get('/products', {
    params: buildListParams({ ...params, include: ['tags'] }),
  })

  const parsed = listSchema.parse(res.data)
  return { items: parsed.products, meta: parsed.meta }
}

/**
 * Query options for a page of products.
 *
 * `params` is part of the query key so each page/filter combination is cached
 * separately, and `placeholderData` keeps the previous page on screen while
 * the next one loads instead of flashing a skeleton on every keystroke.
 */
export const productsQueryOptions = (params: ListParams) =>
  queryOptions({
    queryKey: ['products', params],
    queryFn: () => fetchProducts(params),
    placeholderData: (previous) => previous,
  })

export async function fetchProduct(id: number): Promise<Product> {
  const res = await api.get(`/products/${id}`)
  return productSchema.parse(res.data)
}

export const productQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ['products', 'detail', id],
    queryFn: () => fetchProduct(id),
  })

/**
 * Values the product form collects. Kept loose because the form mirrors a wide
 * table; the API validates authoritatively.
 */
export type ProductPayload = Record<string, unknown> & {
  image?: File | null
  tags?: number[]
}

/**
 * Convert a payload into FormData.
 *
 * Products can carry a file, so every write goes out as multipart. Booleans
 * become "1"/"0" and arrays use `tags[]`, which is what PHP expects; `null`
 * and `undefined` are skipped so untouched fields are left alone.
 */
function toFormData(payload: ProductPayload): FormData {
  const form = new FormData()

  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null || value === '') continue

    if (value instanceof File) {
      form.append(key, value)
      continue
    }

    if (Array.isArray(value)) {
      value.forEach((entry) => form.append(`${key}[]`, String(entry)))
      continue
    }

    if (typeof value === 'boolean') {
      form.append(key, value ? '1' : '0')
      continue
    }

    if (typeof value === 'object') {
      form.append(key, JSON.stringify(value))
      continue
    }

    form.append(key, String(value))
  }

  return form
}

export async function createProduct(payload: ProductPayload): Promise<Product> {
  const res = await api.post('/products', toFormData(payload))
  return productSchema.parse(res.data.product)
}

/**
 * PHP does not parse multipart bodies on PUT, so updates are POSTed with
 * `_method=PUT` (Laravel's method spoofing). Without this an image upload on
 * edit silently arrives empty.
 */
export async function updateProduct(
  id: number,
  payload: ProductPayload
): Promise<Product> {
  const form = toFormData(payload)
  form.append('_method', 'PUT')

  const res = await api.post(`/products/${id}`, form)
  return productSchema.parse(res.data.product)
}

export async function deleteProduct(id: number): Promise<void> {
  await api.delete(`/products/${id}`)
}

/** Deletes are soft, so a deleted product can always be brought back. */
export async function restoreProduct(id: number): Promise<void> {
  await api.patch(`/products/${id}/restore`)
}

export async function uploadProductImages(
  id: number,
  files: File[]
): Promise<void> {
  const form = new FormData()
  files.forEach((file) => form.append('images[]', file))
  await api.post(`/products/${id}/images`, form)
}

export async function deleteProductImage(imageId: number): Promise<void> {
  await api.delete(`/product-images/${imageId}`)
}

export async function setPrimaryProductImage(imageId: number): Promise<void> {
  await api.patch(`/product-images/${imageId}/primary`)
}

/* ------------------------------------------------------------------ */
/* Lookups                                                             */
/* ------------------------------------------------------------------ */

/**
 * Lookups are small, rarely change, and are needed by every product form, so
 * they are fetched once at a large page size and cached for the session.
 */
async function fetchLookup(resource: string, key: string): Promise<Lookup[]> {
  const res = await api.get(`/${resource}`, {
    params: { per_page: 100, 'filter[is_active]': 1, sort_by: 'name' },
  })

  return paginatedSchema(lookupSchema, key).parse(res.data)[key] as Lookup[]
}

export const lookupQueryOptions = (resource: string, key: string) =>
  queryOptions({
    queryKey: ['lookup', resource, key],
    queryFn: () => fetchLookup(resource, key),
    staleTime: 10 * 60 * 1000,
  })

export const productCategoriesQuery = () =>
  lookupQueryOptions('product-categories', 'product_categories')
export const brandsQuery = () => lookupQueryOptions('brands', 'brands')
export const productStatusesQuery = () =>
  lookupQueryOptions('product-statuses', 'product_statuses')
export const unitOfMeasuresQuery = () =>
  lookupQueryOptions('unit-of-measures', 'unit_of_measures')
export const tagsQuery = () => lookupQueryOptions('tags', 'tags')
