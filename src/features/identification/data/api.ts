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
  instrumentUsedSchema,
  reportSchema,
  type IdentificationReport,
  type InstrumentUsed,
} from './schema'

const listSchema = paginatedSchema(reportSchema)

export async function fetchReports(
  params: ListParams
): Promise<Paginated<IdentificationReport>> {
  const res = await api.get('/identification-reports', {
    params: buildListParams(params),
  })

  return toPaginated(listSchema.parse(res.data), params)
}

export const reportsQuery = (params: ListParams) =>
  queryOptions({
    queryKey: ['identification-reports', params],
    queryFn: () => fetchReports(params),
    placeholderData: (previous) => previous,
  })

export type ReportPayload = Record<string, unknown>

/**
 * Create a report against a stone.
 *
 * The service refuses when the stone's bill is not settled, and allocates the
 * report number itself — neither is the client's to decide.
 */
export async function createReport(
  payload: ReportPayload
): Promise<IdentificationReport> {
  const res = await api.post('/identification-reports', payload)
  return reportSchema.parse(res.data)
}

/** Refused by the service once the report is finalized. */
export async function updateReport(
  id: number,
  payload: ReportPayload
): Promise<IdentificationReport> {
  const res = await api.put(`/identification-reports/${id}`, payload)
  return reportSchema.parse(res.data)
}

export async function deleteReport(id: number): Promise<void> {
  await api.delete(`/identification-reports/${id}`)
}

/** Deletes are soft, so a removed report can always be brought back. */
export async function restoreReport(id: number): Promise<void> {
  await api.post(`/identification-reports/${id}/restore`)
}

/**
 * Lock a report against further edits.
 *
 * One-way, and it stamps who identified the stone and when — which is what
 * makes the report authoritative enough to certify from.
 */
export async function finalizeReport(
  id: number
): Promise<IdentificationReport> {
  const res = await api.post(`/identification-reports/${id}/finalize`)
  return reportSchema.parse(res.data)
}

/**
 * Paid stones whose findings are not finalized yet.
 *
 * The source for the create dialog's stone select: the endpoint already encodes
 * "billed, settled, and not done", so the dialog does not have to re-derive a
 * rule the server owns. Rows are stones, not reports.
 */
export const findingsWorklistQuery = () =>
  queryOptions({
    queryKey: ['worklist', 'findings'],
    queryFn: async (): Promise<Stone[]> => {
      const res = await api.get('/identification-reports/worklist', {
        params: { page_size: 100 },
      })
      return paginatedSchema(stoneSchema).parse(res.data).results
    },
  })

/* ------------------------------------------------------------------ */
/* Instruments used — a sub-resource, not a field on the report.       */
/* `instruments_used` is read-only on the report serializer, so each   */
/* row is written through its own endpoint.                            */
/* ------------------------------------------------------------------ */

export const reportInstrumentsQuery = (reportId: number) =>
  queryOptions({
    queryKey: ['instruments-used', reportId],
    queryFn: async (): Promise<InstrumentUsed[]> => {
      const res = await api.get('/instruments-used', {
        params: { 'filter[report]': reportId, page_size: 100 },
      })
      return paginatedSchema(instrumentUsedSchema).parse(res.data).results
    },
  })

export async function addInstrumentUsed(
  reportId: number,
  instrument: number,
  reading: string
): Promise<InstrumentUsed> {
  const res = await api.post('/instruments-used', {
    report: reportId,
    instrument,
    reading,
  })
  return instrumentUsedSchema.parse(res.data)
}

export async function removeInstrumentUsed(id: number): Promise<void> {
  await api.delete(`/instruments-used/${id}`)
}
