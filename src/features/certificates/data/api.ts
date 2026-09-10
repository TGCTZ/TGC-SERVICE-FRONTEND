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
import {
  accessLogSchema,
  certificateSchema,
  type Certificate,
  type CertificateAccessLog,
} from './schema'

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
 * The stone is the whole payload: the service mints the number, the token and
 * the snapshots together. It refuses a stone with no finalized report, an
 * unsettled bill, or a certificate already issued — each by name.
 */
export async function issueCertificate(stone: number): Promise<Certificate> {
  const res = await api.post('/certificates', { stone })
  return certificateSchema.parse(res.data)
}

/**
 * Withdraw a certificate.
 *
 * The record stays, and so does its verification link — a holder checking a
 * withdrawn document needs to be told it was withdrawn, not that it never
 * existed.
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

const accessLogListSchema = paginatedSchema(accessLogSchema)

export async function fetchAccessLogs(
  params: ListParams
): Promise<Paginated<CertificateAccessLog>> {
  const res = await api.get('/certificate-access-logs', {
    params: buildListParams(params),
  })

  return toPaginated(accessLogListSchema.parse(res.data), params)
}

export const accessLogsQuery = (params: ListParams) =>
  queryOptions({
    queryKey: ['certificate-access-logs', params],
    queryFn: () => fetchAccessLogs(params),
    placeholderData: (previous) => previous,
  })

/** The verification hits on one certificate, for its view dialog. */
export const certificateAccessLogsQuery = (certificateId: number) =>
  queryOptions({
    queryKey: ['certificate-access-logs', 'by-certificate', certificateId],
    queryFn: async () => {
      const res = await api.get('/certificate-access-logs', {
        params: {
          'filter[certificate]': certificateId,
          page_size: 20,
          ordering: '-accessed_at',
        },
      })
      return accessLogListSchema.parse(res.data).results
    },
  })
