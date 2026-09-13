import { queryOptions } from '@tanstack/react-query'
import { api } from '@/lib/api'
import {
  buildListParams,
  paginatedSchema,
  toPaginated,
  type ListParams,
  type Paginated,
} from '@/lib/api-query'
import { stoneSchema, type Stone } from '@/features/stones/data/schema'
import { certificateSchema, type Certificate } from './schema'

const listSchema = paginatedSchema(certificateSchema)

export async function fetchCertificates(
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
 * Issue a certificate for a stone.
 *
 * The stone is the whole payload: the service mints the number and the
 * snapshots together. It refuses a stone with no finalized report, an
 * unsettled bill, or a certificate already issued — each by name.
 */
export async function issueCertificate(stone: number): Promise<Certificate> {
  const res = await api.post('/certificates', { stone })
  return certificateSchema.parse(res.data)
}

/**
 * Withdraw a certificate.
 *
 * The record stays, and so does its number — the PDF keeps downloading, now
 * watermarked REVOKED, so a holder checking a withdrawn document is told it was
 * withdrawn rather than that it never existed.
 */
export async function revokeCertificate(id: number): Promise<Certificate> {
  const res = await api.post(`/certificates/${id}/revoke`)
  return certificateSchema.parse(res.data)
}

/**
 * Stones with a finalized report and a paid bill, not yet certified.
 *
 * The source for the issue dialog's stone select: the endpoint encodes all
 * three guards, so the dialog offers only what the service will accept. Rows
 * are stones, not certificates.
 */
export const certificationWorklistQuery = () =>
  queryOptions({
    queryKey: ['worklist', 'certification'],
    queryFn: async (): Promise<Stone[]> => {
      const res = await api.get('/certificates/worklist', {
        params: { page_size: 100 },
      })
      return paginatedSchema(stoneSchema).parse(res.data).results
    },
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
