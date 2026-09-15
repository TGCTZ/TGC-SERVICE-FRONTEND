import { cn } from '@/lib/utils'

/**
 * A page's title and the sentence explaining what the screen is for.
 *
 * Sixteen screens were writing the same two elements by hand, which meant
 * sixteen chances for the type scale or the colour to drift — and no single
 * place to change either.
 *
 * The description sits in a blue-outlined box tinted with the same colour as
 * the sidebar and header. It is the screen explaining itself, so it belongs to
 * the frame rather than to the data — and the text stays the same quiet grey as
 * every other secondary value, so the page gains an edge rather than a second
 * colour of prose.
 *
 * @param props.title - The screen's name. Rendered as an `h2`; the page title
 *   proper lives in the document head and the breadcrumb.
 * @param props.description - One sentence on what the screen holds. Optional,
 *   for screens whose title already says it.
 * @param props.children - Actions aligned to the end of the row, such as a
 *   primary "Create" button.
 */
export function PageHeading({
  title,
  description,
  children,
  className,
}: {
  title: string
  description?: React.ReactNode
  children?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-end justify-between gap-2',
        className
      )}
    >
      <div className='space-y-1'>
        <h2 className='text-2xl font-bold tracking-tight'>{title}</h2>
        {description && (
          // Grey text in a blue-outlined box, filled with `--header` — the
          // same tint as the sidebar and the page header, since that token
          // aliases `--sidebar`. The description is the screen explaining
          // itself, so it reads as part of the frame around the data rather
          // than as data; borrowing the chrome surface says that without a
          // second colour of prose.
          //
          // max-w: prose past roughly 90 characters is measurably harder to
          // scan, and these sit above a full-width table that would otherwise
          // stretch them the width of a monitor.
          <p className='max-w-prose rounded-md border border-primary/30 bg-header px-3 py-2 text-sm/relaxed text-muted-foreground'>
            {description}
          </p>
        )}
      </div>

      {children}
    </div>
  )
}
