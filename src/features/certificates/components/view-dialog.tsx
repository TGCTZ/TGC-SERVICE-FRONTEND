import { Download } from 'lucide-react'
import { formatDateTime } from '@/lib/format'
import { perm } from '@/lib/permissions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Can } from '@/components/can'
import { type RowAction } from '@/components/data-table'
import { DefinitionList } from '@/components/definition-list'
import { DialogBody } from '@/components/dialog-body'
import { ViewFooterActions } from '@/components/view-footer-actions'
import { type Certificate } from '../data/schema'
import { useDownloadCertificatePdf } from '../hooks/use-download-pdf'
import { CertificateStatusBadge } from './status-badge'

type CertificateViewDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  certificate: Certificate
  actions?: RowAction[]
}

/**
 * Everything on one certificate, and the button that gets it out of the system.
 *
 * The four snapshot fields are shown as the document\'s own words rather than
 * joined to the live records — that is what a certificate is.
 */
export function CertificateViewDialog({
  open,
  onOpenChange,
  certificate,
  actions = [],
}: CertificateViewDialogProps) {
  const { download, isDownloading } = useDownloadCertificatePdf()
  const isRevoked = certificate.status === 'revoked'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-h-[90dvh] flex-col overflow-hidden sm:max-w-2xl'>
        <DialogHeader className='text-start'>
          <DialogTitle className='flex items-center gap-2'>
            {certificate.certificate_number}
            <CertificateStatusBadge status={certificate.status} />
          </DialogTitle>
          <DialogDescription>
            {certificate.order_reference} · {certificate.stone_label} ·{' '}
            {certificate.customer_name}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className='space-y-5'>
          <div className='space-y-3'>
            <h3 className='text-sm font-medium'>What the document says</h3>
            <DefinitionList
              items={[
                { label: 'Stone type', value: certificate.stone_type_snapshot },
                { label: 'Weight', value: certificate.weight_snapshot },
                { label: 'Colour', value: certificate.color_snapshot },
                { label: 'Origin', value: certificate.origin_snapshot },
                { label: 'Gemmologist', value: certificate.gemmologist },
                { label: 'From report', value: certificate.report_number },
              ]}
            />
          </div>

          <Separator />

          <div className='space-y-2'>
            <h3 className='text-sm font-medium'>The document</h3>
            <Can permission={perm('certificates', 'view')}>
              <Button
                type='button'
                size='lg'
                className='w-full sm:w-auto'
                disabled={isDownloading}
                onClick={() => download(certificate)}
              >
                <Download className='me-1 size-4' />
                {isDownloading ? 'Preparing...' : 'Download PDF'}
              </Button>
            </Can>
            <p className='text-xs text-muted-foreground'>
              The PDF is the certificate. Print it from your PDF reader — what
              you download is what the customer receives.
            </p>
            {isRevoked && (
              <p className='text-xs text-muted-foreground'>
                Revoked certificates download with a REVOKED watermark.
              </p>
            )}
          </div>

          <Separator />

          <div className='space-y-3'>
            <h3 className='text-sm font-medium'>Issued</h3>
            <DefinitionList
              items={[
                { label: 'By', value: certificate.issued_by_label },
                { label: 'On', value: formatDateTime(certificate.issued_at) },
              ]}
            />
          </div>
        </DialogBody>

        <DialogFooter>
          <ViewFooterActions actions={actions} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
