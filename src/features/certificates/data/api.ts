import { queryOptions } from '@tanstack/react-query'
import { api } from '@/lib/api'
import {
  buildListParams,
  paginatedSchema,
  toPaginated,
  type ListParams,
  type Paginated,
} from '@/lib/api-query'
import { certificateSchema } from './schema'

const listSchema = paginatedSchema(certificateSchema)

async function fetchCertificates(
  params: ListParams
): Promise<Paginated<Certificate>> {
  const res = await api.get('/certificates', {
    params: buildListParams(params),
  })

  return toPaginated(listSchema.parse(res.data), params)
}

export const certificatesQuery = (params: ListParams) =>
  queryOptions({
    queryKey: ['certificates', params],
    queryFn: () => fetchCertificates(params),
    placeholderData: (previous) => previous,
  })

/**
 * Fetch one certificate's PDF.
 *
 * Deliberately unparsed: the Zod-at-the-boundary rule guards JSON shapes, and a
 * PDF has none. `responseType: 'blob'` is what stops axios decoding the bytes
 * as text and corrupting them.
 */
export async function fetchCertificatePdf(id: number): Promise<Blob> {
  const res = await api.get(`/certificates/${id}/pdf`, { responseType: 'blob' })
  return res.data as Blob
}
