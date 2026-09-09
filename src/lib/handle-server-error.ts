import { AxiosError } from 'axios'
import { toast } from 'sonner'

/**
 * Field-keyed validation errors, as the API returns them.
 *
 * DRF puts them at the response root — `{"email": ["Already taken."]}` — with no
 * envelope, and at status **400**, the same status a business-rule refusal uses.
 * The two are told apart by shape: a refusal carries `detail`, a validation
 * failure carries one key per bad field.
 */
export type FieldErrors = Record<string, string[]>

/**
 * Pull field errors out of a rejected request, or null if there are none.
 *
 * Use it to route a validation failure onto the inputs that caused it:
 *
 * ```ts
 * const fields = fieldErrors(error)
 * if (fields) {
 *   for (const [name, messages] of Object.entries(fields)) {
 *     form.setError(name, { message: messages[0] })
 *   }
 * }
 * ```
 *
 * @param error - Anything thrown by a mutation or query.
 * @returns The field/messages map, or null when the error is not field-keyed.
 */
export function fieldErrors(error: unknown): FieldErrors | null {
  if (!(error instanceof AxiosError) || error.response?.status !== 400) {
    return null
  }

  const data = error.response.data
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null
  // `detail` is a business-rule refusal, not a field problem.
  if ('detail' in data) return null

  const fields: FieldErrors = {}
  for (const [key, value] of Object.entries(data)) {
    if (
      Array.isArray(value) &&
      value.every((item) => typeof item === 'string')
    ) {
      fields[key] = value
    }
  }
  return Object.keys(fields).length > 0 ? fields : null
}

/**
 * Read the human-readable message out of a rejected request.
 *
 * Prefers `detail` — a business rule explaining itself, which is almost always
 * the most useful sentence available — then the first field message, then
 * nothing.
 */
function serverMessage(error: AxiosError): string | null {
  const data = error.response?.data
  if (!data || typeof data !== 'object') return null

  const detail = (data as { detail?: unknown }).detail
  if (typeof detail === 'string' && detail.length > 0) return detail

  const fields = fieldErrors(error)
  if (fields) {
    const [first] = Object.values(fields)
    if (first?.[0]) return first[0]
  }
  return null
}

/**
 * Turn an unknown thrown value into a user-facing error toast.
 *
 * The default handler for anything a mutation or query rejects with. It never
 * shows a raw exception: only the API's own message is surfaced, and everything
 * else collapses to a generic line, so a stack trace or SQL fragment cannot
 * reach the screen.
 *
 * Field validation should **not** come here — route it through
 * {@link fieldErrors} onto `form.setError`, so each message lands next to the
 * input that caused it.
 *
 * @param error - Anything thrown; Axios errors get their message extracted.
 */
export function handleServerError(error: unknown) {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log(error)
  }

  let errMsg = 'Something went wrong!'

  if (
    error &&
    typeof error === 'object' &&
    'status' in error &&
    Number(error.status) === 204
  ) {
    errMsg = 'No content.'
  }

  if (error instanceof AxiosError) {
    errMsg = serverMessage(error) ?? errMsg
  }

  toast.error(errMsg)
}
