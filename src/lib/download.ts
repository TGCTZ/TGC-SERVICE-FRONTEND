/**
 * Hand a file the browser already holds to the user as a download.
 *
 * Needed because the API returns document bytes rather than a URL: there is
 * nothing to point an `<a href>` at, and the request carries a bearer token, so
 * a plain link would 401 anyway. The object URL is revoked on the next tick —
 * not immediately, because Safari aborts a download whose blob URL is released
 * while the click is still being handled.
 *
 * @param blob - The file's bytes, with the content type the server sent.
 * @param filename - What the saved file should be called.
 * @example
 * saveBlob(await fetchCertificatePdf(id), 'CERT-2026-0004.pdf')
 */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = filename
  document.body.append(anchor)
  anchor.click()
  anchor.remove()

  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}
