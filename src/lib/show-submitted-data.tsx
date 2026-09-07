import { toast } from 'sonner'

/**
 * Toast a form's values as formatted JSON.
 *
 * A **development placeholder**, not a real submit handler — it shows what
 * would have been sent and saves nothing. The remaining callers are the
 * unfinished settings forms (Account, Appearance, Notifications, Display);
 * each should lose this once it gets a real mutation.
 *
 * Treat a call to this in a new screen as a to-do, not a pattern to copy.
 *
 * @param data - The values to display; serialised with `JSON.stringify`
 * @param title - Heading for the toast
 */
export function showSubmittedData(
  data: unknown,
  title: string = 'You submitted the following values:'
) {
  toast.message(title, {
    description: (
      <pre className='mt-2 w-full overflow-x-auto rounded-md bg-slate-950 p-4'>
        <code className='text-white'>{JSON.stringify(data, null, 2)}</code>
      </pre>
    ),
  })
}
