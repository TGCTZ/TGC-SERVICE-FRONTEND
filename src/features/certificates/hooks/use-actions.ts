import { Ban, Eye, History } from 'lucide-react'
import { PERMISSIONS, perm } from '@/lib/permissions'
import { type RowAction } from '@/components/data-table'
import { useCertificates } from '../components/provider'
import { type Certificate } from '../data/schema'

/**
 * Every action the API exposes for a certificate.
 *
 * No Edit: everything but the stone is minted by the service. No Delete or
 * Restore either — a certificate is withdrawn by revoking it, which keeps the
 * record and the link so a holder is told the document was withdrawn rather
 * than that it never existed.
 */
export function useCertificateActions(
  certificate: Certificate | null
): RowAction[] {
  const { setOpen, setCurrentRow } = useCertificates()

  function select(dialog: 'view' | 'history' | 'revoke') {
    setCurrentRow(certificate)
    setOpen(dialog)
  }

  // Called unconditionally by the page before a row is chosen.
  if (!certificate) return []

  return [
    {
      label: 'View',
      icon: Eye,
      permission: perm('certificates', 'view'),
      onSelect: () => select('view'),
    },
    {
      label: 'History',
      icon: History,
      permission: PERMISSIONS.viewActivityLogs,
      onSelect: () => select('history'),
    },
    {
      label: 'Revoke',
      icon: Ban,
      permission: PERMISSIONS.revokeCertificate,
      onSelect: () => select('revoke'),
      variant: 'destructive',
      hidden: certificate.status === 'revoked',
      separatorBefore: true,
    },
  ]
}
