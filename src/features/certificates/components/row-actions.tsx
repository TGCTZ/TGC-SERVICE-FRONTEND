import { DataTableRowActions } from '@/components/data-table'
import { type Certificate } from '../data/schema'
import { useCertificateActions } from '../hooks/use-actions'

export function CertificatesRowActions({
  certificate,
}: {
  certificate: Certificate
}) {
  return <DataTableRowActions actions={useCertificateActions(certificate)} />
}
