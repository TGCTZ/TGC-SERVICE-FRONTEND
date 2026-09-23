import { useEffect, useRef, useState } from 'react'
import { Download, Loader2, Printer } from 'lucide-react'
import { perm } from '@/lib/permissions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Can } from '@/components/can'
import { fetchCertificatePdf } from '../data/api'
import { type Certificate } from '../data/schema'
import { useDownloadCertificatePdf } from '../hooks/use-download-pdf'

type PreviewDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  certificate: Certificate
}

/**
 * Show a certificate's PDF in the browser's own viewer, inside the page.
 *
 * Fetched through the authenticated API client and shown via an object URL:
 * pointing the iframe at the endpoint directly would not carry the auth header.
 */
export function CertificatePreviewDialog({
  open,
  onOpenChange,
  certificate,
}: PreviewDialogProps) {
  const [url, setUrl] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const { download, isDownloading } = useDownloadCertificatePdf()
  const frameRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (!open) return
    let objectUrl: string | null = null
    let cancelled = false

    fetchCertificatePdf(certificate.id)
      .then((blob) => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(
          new Blob([blob], { type: 'application/pdf' })
        )
        setUrl(objectUrl)
      })
      .catch(() => !cancelled && setFailed(true))

    // An object URL pins its blob in memory until revoked or the page unloads.
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      setUrl(null)
      setFailed(false)
    }
  }, [open, certificate.id])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex h-[90vh] flex-col sm:max-w-5xl'>
        {/* pe-8 keeps the button clear of the dialog's close (X) button. */}
        <DialogHeader className='flex-row items-start justify-between gap-4 pe-8'>
          <div className='space-y-1.5'>
            <DialogTitle>{certificate.certificate_number}</DialogTitle>
            <DialogDescription>
              {certificate.status === 'revoked'
                ? 'Revoked — the document carries a REVOKED watermark.'
                : 'Preview of the issued certificate.'}
            </DialogDescription>
          </div>
          <Can permission={perm('certificates', 'view')}>
            <div className='flex gap-2'>
              <Button
                type='button'
                size='sm'
                variant='outline'
                disabled={!url}
                // Same-origin blob URL, so the embedded PDF viewer's print is reachable.
                onClick={() => frameRef.current?.contentWindow?.print()}
              >
                <Printer className='me-1 size-4' />
                Print
              </Button>
              <Button
                type='button'
                size='sm'
                variant='success'
                disabled={isDownloading}
                onClick={() => download(certificate)}
              >
                <Download className='me-1 size-4' />
                {isDownloading ? 'Preparing...' : 'Download PDF'}
              </Button>
            </div>
          </Can>
        </DialogHeader>
        <div className='min-h-0 flex-1 overflow-hidden rounded-md border'>
          {url ? (
            <iframe
              ref={frameRef}
              src={url}
              title={`Certificate ${certificate.certificate_number}`}
              className='size-full'
            />
          ) : (
            <div className='flex size-full items-center justify-center text-sm text-muted-foreground'>
              {failed ? (
                'Could not load the certificate.'
              ) : (
                <Loader2 className='size-6 animate-spin' />
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
