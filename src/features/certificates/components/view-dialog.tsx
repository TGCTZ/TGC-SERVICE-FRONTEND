import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Check, Copy } from 'lucide-react'
import { formatDateTime } from '@/lib/format'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { type RowAction } from '@/components/data-table'
import { DefinitionList } from '@/components/definition-list'
import { DialogBody } from '@/components/dialog-body'
import { ViewFooterActions } from '@/components/view-footer-actions'
import { certificateAccessLogsQuery } from '../data/api'
import { type Certificate } from '../data/schema'
import { verificationUrl } from '../data/verification-link'
import { CertificateStatusBadge } from './status-badge'

type CertificateViewDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  certificate: Certificate
  actions?: RowAction[]
}

/**
 * Everything on one certificate, plus the link that proves it.
 *
 * The four snapshot fields are shown as the document's own words rather than
 * joined to the live records — that is what a certificate is.
 */
export function CertificateViewDialog({
  open,
  onOpenChange,
  certificate,
  actions = [],
}: CertificateViewDialogProps) {
  const [copied, setCopied] = useState(false)
  const link = verificationUrl(certificate.verification_token)

  const { data: visits, isPending } = useQuery({
    ...certificateAccessLogsQuery(certificate.id),
    enabled: open,
  })

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access is denied in some browsers and over plain HTTP; the
      // input beside the button is selectable, so there is still a way through.
      setCopied(false)
    }
  }

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
            <h3 className='text-sm font-medium'>Verification link</h3>
            <div className='flex gap-2'>
              <Input readOnly value={link} className='font-mono text-xs' />
              <Button type='button' variant='outline' onClick={copyLink}>
                {copied ? (
                  <Check className='me-1 size-4' />
                ) : (
                  <Copy className='me-1 size-4' />
                )}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <p className='text-xs text-muted-foreground'>
              Anyone holding the printed certificate can open this without
              signing in. Every visit is recorded below.
            </p>
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

          <Separator />

          <div className='space-y-3'>
            <h3 className='text-sm font-medium'>Recent verifications</h3>

            {isPending && <Skeleton className='h-16 w-full' />}

            {!isPending && visits?.length === 0 && (
              <p className='rounded-md border border-dashed p-4 text-sm text-muted-foreground'>
                Nobody has checked this certificate yet.
              </p>
            )}

            {visits && visits.length > 0 && (
              <ul className='divide-y rounded-md border'>
                {visits.map((visit) => (
                  <li key={visit.id} className='p-3'>
                    <div className='text-sm'>
                      {formatDateTime(visit.accessed_at)}
                    </div>
                    <div className='text-xs break-all text-muted-foreground'>
                      {visit.ip_address ?? 'Unknown address'} ·{' '}
                      {visit.user_agent || 'No user agent'}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogBody>

        <DialogFooter>
          <ViewFooterActions actions={actions} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
