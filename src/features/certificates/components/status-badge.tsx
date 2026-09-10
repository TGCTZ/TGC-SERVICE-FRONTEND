import { Badge } from '@/components/ui/badge'
import { CERTIFICATE_STATUS_LABELS } from '../data/schema'

/** A certificate either stands or has been withdrawn. */
export function CertificateStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={status === 'revoked' ? 'destructive' : 'default'}>
      {CERTIFICATE_STATUS_LABELS[status] ?? status}
    </Badge>
  )
}
