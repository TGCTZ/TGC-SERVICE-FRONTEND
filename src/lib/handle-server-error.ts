import { AxiosError } from 'axios'
import { toast } from 'sonner'

/**
 * Turn an unknown thrown value into a user-facing error toast.
 *
 * The default handler for anything a mutation or query rejects with. It never
 * shows a raw exception: the API's `title` field is used when present, and
 * everything else collapses to a generic message, so a stack trace or SQL
 * fragment cannot reach the screen.
 *
 * Form validation (422) should **not** come here — map those onto fields with
 * `form.setError` so the message lands next to the input that caused it.
 *
 * @param error - Anything thrown; Axios errors get their `title` extracted
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
    const title = error.response?.data?.title
    if (typeof title === 'string' && title.length > 0) {
      errMsg = title
    }
  }

  toast.error(errMsg)
}
