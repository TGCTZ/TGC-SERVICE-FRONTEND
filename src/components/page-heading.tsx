import { cn } from '@/lib/utils'

/**
 * A page's title and the sentence explaining what the screen is for.
 *
 * Sixteen screens were writing the same two elements by hand, which meant
 * sixteen chances for the type scale or the colour to drift — and no single
 * place to change either.
 *
 * The description sits in a panel tinted with the same colour as the sidebar
 * and header. It is the screen explaining itself, so it belongs to the frame
 * rather than to the data — and the text stays the same quiet grey as every
 * other secondary value, so the page gains a surface rather than a second
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
        'brand-gradient-lines relative flex flex-wrap items-end justify-between gap-4 overflow-hidden rounded-xl border border-white/15 p-5 text-white shadow-sm sm:p-6 dark:gap-2 dark:overflow-visible dark:rounded-none dark:border-transparent dark:bg-transparent dark:p-0 dark:text-foreground dark:shadow-none',
        className
      )}
    >
      <div className='relative z-10 space-y-1'>
        <h2 className='text-2xl font-bold tracking-tight'>{title}</h2>
        {description && (
          <p className='max-w-prose text-sm/relaxed text-white/80 dark:rounded-md dark:bg-sidebar dark:px-3 dark:py-2 dark:text-muted-foreground'>
            {description}
          </p>
        )}
      </div>

      <div className='relative z-10 ms-auto flex flex-wrap items-center gap-2'>
        {children}
      </div>
    </div>
  )
}
