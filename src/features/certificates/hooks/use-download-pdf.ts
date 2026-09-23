import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { saveBlob } from '@/lib/download'
import { fetchCertificatePdf } from '../data/api'
import { type Certificate } from '../data/schema'

/**
 * Download a certificate's PDF, named after the certificate.
 *
 * A revoked certificate still downloads — it renders with a REVOKED watermark,
 * and the `-revoked` suffix keeps a saved copy from being mistaken for a live
 * one. The server sets the same name in `Content-Disposition`, but a blob
 * download never sees that header, so the filename is rebuilt here.
 */
export function useDownloadCertificatePdf() {
  const mutation = useMutation({
    mutationFn: async (certificate: Certificate) => {
      const blob = await fetchCertificatePdf(certificate.id)
      const suffix = certificate.status === 'revoked' ? '-revoked' : ''
      saveBlob(blob, `${certificate.certificate_number}${suffix}.pdf`)
    },
    onError: () => toast.error('Could not download the certificate.'),
  })

  return { download: mutation.mutate, isDownloading: mutation.isPending }
}

/**
 * Print a certificate's PDF without showing it first.
 *
 * Loads the PDF into a hidden iframe and calls the embedded viewer's print.
 * The frame is removed a minute later rather than on `afterprint`, which the
 * PDF viewer's frame does not reliably fire across browsers.
 */
export function usePrintCertificatePdf() {
  const mutation = useMutation({
    mutationFn: async (certificate: Certificate) => {
      const blob = await fetchCertificatePdf(certificate.id)
      const url = URL.createObjectURL(
        new Blob([blob], { type: 'application/pdf' })
      )
      const frame = document.createElement('iframe')
      frame.style.cssText =
        'position:fixed;width:0;height:0;border:0;visibility:hidden'
      frame.src = url
      frame.onload = () => frame.contentWindow?.print()
      document.body.appendChild(frame)
      setTimeout(() => {
        frame.remove()
        URL.revokeObjectURL(url)
      }, 60_000)
    },
    onError: () => toast.error('Could not print the certificate.'),
  })

  return { print: mutation.mutate, isPrinting: mutation.isPending }
}
