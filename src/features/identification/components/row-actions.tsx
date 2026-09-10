import { DataTableRowActions } from '@/components/data-table'
import { type IdentificationReport } from '../data/schema'
import { useReportActions } from '../hooks/use-actions'

export function ReportsRowActions({
  report,
}: {
  report: IdentificationReport
}) {
  return <DataTableRowActions actions={useReportActions(report)} />
}
