import { api } from '@/lib/api'

/**
 * Fetch one certificate's PDF.
 *
 * Deliberately unparsed: the Zod-at-the-boundary rule guards JSON shapes, and a
 * PDF has none. `responseType: 'blob'` is what stops axios decoding the bytes
 * as text and corrupting them.
 */
export async function fetchCertificatePdf(id: number): Promise<Blob> {
  const res = await api.get(`/certificates/${id}/pdf`, { responseType: 'blob' })
  return res.data as Blob
}
