import { createStatusBadge, type StatusTone } from '@/components/status-badge'
import { CERTIFICATE_STATUS_LABELS } from '../data/schema'

/** A certificate either stands, or has been withdrawn. */
const TONES: Record<string, StatusTone> = {
  issued: 'success',
  reissued: 'success',
  revoked: 'danger',
}

export const CertificateStatusBadge = createStatusBadge(
  CERTIFICATE_STATUS_LABELS,
  TONES
)
