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
