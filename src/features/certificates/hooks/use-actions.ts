import { useNavigate } from '@tanstack/react-router'
import { Download, Eye, FileSearch, Pencil, Printer } from 'lucide-react'
import { PERMISSIONS, perm } from '@/lib/permissions'
import { type RowAction } from '@/components/data-table'
import { useCertificates } from '../components/provider'
import { type Certificate } from '../data/schema'
import {
  useDownloadCertificatePdf,
  usePrintCertificatePdf,
} from './use-download-pdf'

/**
 * Every action the API exposes for a certificate.
 *
 * The certificate has no direct edit, delete, or restore action. Authorized
 * users can open its linked findings for a controlled correction.
 *
 * Declaring Download here rather than in a component is what puts it in both
 * the table row menu and the view dialog footer.
 */
export function useCertificateActions(
  certificate: Certificate | null
): RowAction[] {
  const navigate = useNavigate()
  const { setOpen, setCurrentRow } = useCertificates()
  const { download } = useDownloadCertificatePdf()
  const { print } = usePrintCertificatePdf()

  function select(dialog: 'view' | 'preview') {
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
    ...(certificate.report
      ? [
          {
            label: 'Edit findings',
            icon: Pencil,
            permission: PERMISSIONS.editFinalizedReport,
            onSelect: () =>
              navigate({
                to: '/identification-reports',
                search: {
                  page: 1,
                  pageSize: 10,
                  status: 'Finalized',
                  editReportId: certificate.report!,
                },
              }),
          },
        ]
      : []),
    {
      label: 'Preview PDF',
      icon: FileSearch,
      permission: perm('certificates', 'view'),
      onSelect: () => select('preview'),
    },
    {
      label: 'Print',
      icon: Printer,
      permission: perm('certificates', 'view'),
      onSelect: () => print(certificate),
    },
    {
      label: 'Download PDF',
      tone: 'document',
      icon: Download,
      permission: perm('certificates', 'view'),
      onSelect: () => download(certificate),
    },
  ]
}
