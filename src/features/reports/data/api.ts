import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toPaginated } from '@/lib/api-query'
import { type ReportKind } from './config'
import { reportResultSchema, type ReportSearch } from './schema'

function reportParams(search: ReportSearch) {
  return {
    from_date: search.from,
    to_date: search.to,
    section: search.section,
    customer: search.customer,
    status: search.status,
    provider: search.provider,
    stone_type: search.stoneType,
    page: search.page,
    page_size: search.pageSize,
  }
}

/** Parse every API response before passing it to the shared table components. */
export const reportsQuery = (kind: ReportKind, search: ReportSearch) =>
  queryOptions({
    queryKey: ['reports', kind, search],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const response = await api.get(`/reports/${kind}`, {
        params: reportParams(search),
      })
      const data = reportResultSchema.parse(response.data)
      return {
        ...data,
        page: toPaginated(data, {
          page: search.page,
          perPage: search.pageSize,
        }),
      }
    },
  })

/** The server exports every matching section, not merely the table's visible page. */
export async function downloadReport(
  kind: ReportKind,
  search: ReportSearch,
  fileType: 'xlsx' | 'pdf'
) {
  const response = await api.get(`/reports/${kind}/export`, {
    params: { ...reportParams(search), file_type: fileType },
    responseType: 'blob',
  })
  const url = URL.createObjectURL(response.data as Blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${kind}-reports-${search.from}-${search.to}.${fileType}`
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
